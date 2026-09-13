import type { ReviewPromptInput, ReviewLLMResult } from "./prompts/review-campaign";
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
} from "./prompts/review-campaign";
import type { Grade } from "@noonchi/shared";
import { ollamaEmbed } from "./ollamaEmbedClient";

const VALID_GRADES = new Set<Grade>(["A", "B", "C", "D", "F"]);

// ── LLM Provider 설정 ──────────────────────────────────────────────────────
// GEMINI_API_KEY가 있으면 Gemini, 없으면 Ollama(로컬) fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
// Gemini OpenAI-compatible endpoint
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";

export async function callReviewEngine(
  input: ReviewPromptInput
): Promise<ReviewLLMResult> {
  if (GEMINI_API_KEY) {
    return callGemini(input);
  }
  return callOllama(input);
}

async function callGemini(input: ReviewPromptInput): Promise<ReviewLLMResult> {
  const body = {
    model: GEMINI_MODEL,
    messages: [
      { role: "system", content: buildReviewSystemPrompt() },
      { role: "user", content: buildReviewUserPrompt(input) },
    ],
    temperature: 0,
    max_tokens: 1024,
  };

  const res = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      // 분당 요청 초과 — C등급 fallback 반환 (에러 대신). transient: 캐시 금지
      return {
        grade: "C" as const,
        rationale: "현재 AI 분석 요청이 많아 잠시 후 다시 시도해주세요. 지금은 일반 주의(C등급)로 임시 분류됩니다.",
        suggestions: [],
        transient: true,
      };
    }
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseReviewResponse(text);
}

async function callOllama(input: ReviewPromptInput): Promise<ReviewLLMResult> {
  const body = {
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: buildReviewSystemPrompt() },
      { role: "user", content: buildReviewUserPrompt(input) },
    ],
    stream: false,
    options: { temperature: 0 },
  };

  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { message?: { content?: string } };
  const text = data.message?.content ?? "";
  return parseReviewResponse(text);
}

type ExpressionRisk = NonNullable<ReviewLLMResult["expressionRisk"]>;

const VALID_DISPOSITIONS = new Set(["harmful", "benign", "uncertain"]);

/**
 * ```json 펜스를 우선 쓰고, 없으면 첫 `{` 부터 마지막 `}` 까지를 잘라낸다.
 * (lazy 매칭 `\{[\s\S]*?\}` 은 중첩 객체가 있으면 첫 닫는 괄호에서 끊긴다.)
 */
function extractJsonText(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1];

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start !== -1 && end > start ? text.slice(start, end + 1) : null;
}

/** 모델이 흘린 값은 버리거나 uncertain 으로 내린다 — 과잉 경고보다 미표시가 낫다. */
function normalizeExpressionRisk(raw: unknown): ExpressionRisk {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item): ExpressionRisk => {
    if (typeof item !== "object" || item === null) return [];
    const r = item as Record<string, unknown>;
    if (typeof r.key !== "string" || r.key.trim() === "") return [];

    const disposition = VALID_DISPOSITIONS.has(r.disposition as string)
      ? (r.disposition as ExpressionRisk[number]["disposition"])
      : "uncertain";

    return [
      {
        key: r.key,
        disposition,
        rationale: typeof r.rationale === "string" ? r.rationale : "",
        ...(typeof r.alternative === "string" && r.alternative.trim() !== ""
          ? { alternative: r.alternative }
          : {}),
      },
    ];
  });
}

export function parseReviewResponse(text: string): ReviewLLMResult {
  const jsonText = extractJsonText(text);

  if (!jsonText) {
    return {
      grade: "C",
      rationale: "결과를 분석하는 중 오류가 발생했습니다. 수동 검토를 권장합니다.",
      suggestions: [],
      expressionRisk: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonText);
    const grade = VALID_GRADES.has(parsed.grade) ? (parsed.grade as Grade) : "C";
    return {
      grade,
      rationale: parsed.rationale ?? "",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      expressionRisk: normalizeExpressionRisk(parsed.expressionRisk),
    };
  } catch {
    return {
      grade: "C",
      rationale: "결과 파싱 오류. 수동 검토를 권장합니다.",
      suggestions: [],
      expressionRisk: [],
    };
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // ollamaEmbed가 성공하면 그대로 반환; 실패 시 해시 폴백으로 graceful degradation
  try {
    return await ollamaEmbed(text);
  } catch {
    /* Ollama down / malformed response → hash fallback (service stays alive) */
  }

  // 해시 기반 폴백 (차원은 OLLAMA_EMBED_DIM env, 기본 768 — bge-m3 사용 시 1024)
  const dim = process.env.OLLAMA_EMBED_DIM
    ? Number(process.env.OLLAMA_EMBED_DIM)
    : 768;
  const encoder = new TextEncoder();
  const buf = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const vector: number[] = [];
  for (let i = 0; i < dim; i++) {
    vector.push((hashArray[i % 32] / 255) * 2 - 1);
  }
  return vector;
}
