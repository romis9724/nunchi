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

const DEFAULT_TIMEOUT_MS = 30_000;
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
}

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 1;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return Math.round(n);
}

/** Extract the first JSON object from a model reply and read score/reason. */
function parseJudgeReply(content: string): ParsedScore {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    return { score: 1, reason: `unparseable judge reply: ${content.slice(0, 120)}` };
  }
  try {
    const obj = JSON.parse(match[0]) as Record<string, unknown>;
    const score = clampScore(Number(obj.score));
    const reason =
      typeof obj.reason === "string" ? obj.reason : "(no reason given)";
    return { score, reason };
  } catch {
    return { score: 1, reason: `invalid judge JSON: ${match[0].slice(0, 120)}` };
  }
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
        options: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return {
      score: 1,
      reason: `judge network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    return { score: 1, reason: `judge HTTP ${res.status}: ${body.slice(0, 120)}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    return {
      score: 1,
      reason: `judge JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const content = (data as { message?: { content?: unknown } }).message?.content;
  if (typeof content !== "string") {
    return { score: 1, reason: `judge reply missing message.content` };
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

  const rawScores = results.map((r) => r.score);
  const sum = rawScores.reduce((acc, s) => acc + s, 0);
  const avg = Math.round((sum / rawScores.length) * 10) / 10;
  const spread = Math.max(...rawScores) - Math.min(...rawScores);

  return {
    score: avg,
    reason: results.map((r, i) => `[#${i + 1}] ${r.reason}`).join(" "),
    rawScores,
    highVariance: spread >= VARIANCE_THRESHOLD,
  };
}
