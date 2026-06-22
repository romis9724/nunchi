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

function parseReviewResponse(text: string): ReviewLLMResult {
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/(\{[\s\S]*?\})/s);

  if (!jsonMatch) {
    return {
      grade: "C",
      rationale: "결과를 분석하는 중 오류가 발생했습니다. 수동 검토를 권장합니다.",
      suggestions: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    const grade = VALID_GRADES.has(parsed.grade) ? (parsed.grade as Grade) : "C";
    return {
      grade,
      rationale: parsed.rationale ?? "",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return {
      grade: "C",
      rationale: "결과 파싱 오류. 수동 검토를 권장합니다.",
      suggestions: [],
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
