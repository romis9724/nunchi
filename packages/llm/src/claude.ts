import type { ReviewPromptInput, ReviewLLMResult } from "./prompts/review-campaign";
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
} from "./prompts/review-campaign";
import type { Grade } from "@nunchi/shared";

const VALID_GRADES = new Set<Grade>(["A", "B", "C", "D", "F"]);

// ── LLM Provider 설정 ──────────────────────────────────────────────────────
// GEMINI_API_KEY가 있으면 Gemini, 없으면 Ollama(로컬) fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
// Gemini OpenAI-compatible endpoint
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:latest";

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
  // Ollama nomic-embed-text 모델로 임베딩 생성 (있으면 사용, 없으면 해시 폴백)
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text:latest", prompt: text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json() as { embedding?: number[] };
      if (data.embedding) return data.embedding;
    }
  } catch {
    /* fall through to hash fallback */
  }

  // 해시 기반 폴백 (768차원 — nomic-embed-text 기본 차원)
  const encoder = new TextEncoder();
  const buf = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const vector: number[] = [];
  for (let i = 0; i < 768; i++) {
    vector.push((hashArray[i % 32] / 255) * 2 - 1);
  }
  return vector;
}
