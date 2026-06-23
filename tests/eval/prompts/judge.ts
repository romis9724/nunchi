/**
 * judge — qwen3:8b self-assessment of an engine's free-text rationale.
 *
 * This is a *reference-based* LLM judge: it is handed the ground-truth event
 * (name + summary + recommended tone + risk) and the rationale the engine
 * produced, and scores 1–5 how well the rationale identifies the correct event
 * and recommends an appropriate tone. It deliberately does NOT reuse any text
 * from `review-campaign.ts` — the judge must be an independent rubric so a
 * shared phrasing bug can't make a wrong answer look self-consistent.
 *
 * Transport: Ollama `/api/chat` (POST, stream:false, temperature:0). Two calls
 * are averaged; large between-call divergence is flagged. Uses global `fetch`
 * only — zero external dependencies.
 */

export interface JudgeInput {
  date: string;
  copy: string;
  eventName: string;
  eventSummary: string;
  recommendedTone: string;
  riskLevel: string;
  rationale: string;
}

export interface JudgeOptions {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
}

export interface JudgeVerdict {
  /** Averaged 1–5 score across the two calls (rounded to 1 decimal). */
  score: number;
  /** Concatenated reasons from each call. */
  reason: string;
  /** Per-call raw scores (1–5). */
  rawScores: number[];
  /** true when the two calls disagreed by >= 2 points (low confidence). */
  highVariance: boolean;
}

const DEFAULT_TIMEOUT_MS = 60_000; // qwen3:8b 추론이 느려 여유있게
const VARIANCE_THRESHOLD = 2;
const JUDGE_CALLS = 2;

/**
 * Build the judge system + user prompt. Independent rubric — phrased to score
 * an existing rationale, not to produce one.
 */
export function buildJudgePrompt(input: JudgeInput): {
  system: string;
  user: string;
} {
  const system = `You are a strict evaluator auditing an AI safety rationale for Korean marketing campaigns. You are given the GROUND-TRUTH historical/cultural event and the rationale that another system produced. Score how faithfully the rationale reflects the ground truth.

Reference-based 1–5 rubric:
5 = explicitly names/cites the correct ground-truth event AND its tone advice fits the event's risk and recommended tone.
4 = clearly references the correct event; tone advice is mostly appropriate with minor slack.
3 = vaguely on-topic; touches the right theme but does not clearly identify the event.
2 = mostly off-target; mentions an unrelated event or generic boilerplate.
1 = irrelevant or hallucinated; cites a wrong/fabricated event or contradicts the ground truth.

Be conservative: hallucinated specifics or a tone that clashes with the event's gravity cap the score at 2.
Output JSON ONLY, no prose, no markdown fences: {"score": <1-5 integer>, "reason": "<one sentence>"}.`;

  const user = `## Ground truth
- Event: ${input.eventName}
- Summary: ${input.eventSummary}
- Recommended tone: ${input.recommendedTone}
- Risk level: ${input.riskLevel}

## Engine input
- Date: ${input.date}
- Copy: ${input.copy}

## Rationale under review
${input.rationale}

Score the rationale against the ground truth using the rubric. JSON only.`;

  return { system, user };
}

interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ParsedScore {
  score: number;
  reason: string;
  /** false → 모델 응답을 점수로 파싱하지 못함(네트워크/형식 오류). 평균에서 제외한다. */
  ok: boolean;
}

function clampScore(n: number): number {
  if (n < 1) return 1;
  if (n > 5) return 5;
  return Math.round(n);
}

/** qwen3 thinking 블록 제거 후 마지막 JSON 객체를 견고하게 추출. */
function parseJudgeReply(content: string): ParsedScore {
  // qwen3:8b는 <think>…</think> 추론을 앞에 붙일 수 있다 — 제거.
  const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 모든 {...} 후보 중 score를 가진 마지막 것을 채택(추론 중 중괄호 오탐 회피).
  const candidates = cleaned.match(/\{[^{}]*\}/g) ?? [];
  for (let i = candidates.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(candidates[i]) as Record<string, unknown>;
      if (obj.score == null || Number.isNaN(Number(obj.score))) continue;
      return {
        score: clampScore(Number(obj.score)),
        reason: typeof obj.reason === "string" ? obj.reason : "(no reason)",
        ok: true,
      };
    } catch {
      /* try next candidate */
    }
  }
  // score 숫자만이라도 회수 시도 (e.g. "score: 4").
  const m = cleaned.match(/score["'\s:]+([1-5])/i);
  if (m) return { score: clampScore(Number(m[1])), reason: cleaned.slice(0, 100), ok: true };

  return { score: 0, reason: `unparseable: ${cleaned.slice(0, 120)}`, ok: false };
}

async function callOllamaChat(
  messages: OllamaChatMessage[],
  opts: JudgeOptions
): Promise<ParsedScore> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let res: Response;
  try {
    res = await fetch(`${opts.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts.model,
        messages,
        stream: false,
        think: false, // qwen3 thinking 비활성 → 깨끗한 JSON 출력
        options: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return {
      score: 0,
      reason: `judge network error: ${err instanceof Error ? err.message : String(err)}`,
      ok: false,
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    return { score: 0, reason: `judge HTTP ${res.status}: ${body.slice(0, 120)}`, ok: false };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    return {
      score: 0,
      reason: `judge JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
      ok: false,
    };
  }

  const content = (data as { message?: { content?: unknown } }).message?.content;
  if (typeof content !== "string") {
    return { score: 0, reason: `judge reply missing message.content`, ok: false };
  }
  return parseJudgeReply(content);
}

/**
 * Run the judge twice and average. Divergence >= VARIANCE_THRESHOLD flags the
 * verdict as low-confidence so the report can surface it for human review.
 */
export async function judgeRationale(
  input: JudgeInput,
  opts: JudgeOptions
): Promise<JudgeVerdict> {
  const { system, user } = buildJudgePrompt(input);
  const messages: OllamaChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const results: ParsedScore[] = [];
  for (let i = 0; i < JUDGE_CALLS; i++) {
    results.push(await callOllamaChat(messages, opts));
  }

  // 파싱 성공(ok)한 점수만 평균. 전부 실패하면 score=0(미채점)으로 표기.
  const okScores = results.filter((r) => r.ok).map((r) => r.score);
  const avg =
    okScores.length > 0
      ? Math.round((okScores.reduce((a, s) => a + s, 0) / okScores.length) * 10) / 10
      : 0;
  const spread =
    okScores.length > 1 ? Math.max(...okScores) - Math.min(...okScores) : 0;

  return {
    score: avg,
    reason: results.map((r, i) => `[#${i + 1}] ${r.reason}`).join(" "),
    rawScores: results.map((r) => r.score),
    highVariance: spread >= VARIANCE_THRESHOLD,
  };
}
