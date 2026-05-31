/**
 * personalizeRationale — 공통 검토 결과에 사용자 업종·채널 맞춤 코멘트를 추가한다.
 *
 * 캐시 전략 B-2 준수:
 * - 공통 검토 결과(grade, rationale, suggestions)는 input_hash 캐시 그대로 유지.
 * - 이 함수는 캐시 조회 후 후처리로 호출되며, industries·channels만 LLM에 전달.
 * - company / brand / product_name은 전달하지 않아 개인정보 노출 최소화.
 */

import type { Grade } from "@nunchi/shared";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:latest";

export interface PersonalizeInput {
  grade: Grade;
  rationale: string;
  suggestions: string[];
  industries: string[];
  channels: string[];
}

function buildPersonalizePrompt(input: PersonalizeInput): string {
  const { grade, rationale, suggestions, industries, channels } = input;

  const suggestionText =
    suggestions.length > 0
      ? `\n**제안 대안**:\n${suggestions.map((s) => `- ${s}`).join("\n")}`
      : "";

  return `다음은 마케팅 캠페인 검토 결과입니다.

**등급**: ${grade}
**검토 내용**: ${rationale}${suggestionText}

이 마케터의 업종: ${industries.join(", ")}
이 마케터의 주요 채널: ${channels.join(", ")}

위 정보를 바탕으로, 해당 업종과 채널에서 이 검토 결과가 실제로 어떤 의미를 가지는지 **2-3문장**의 맞춤 코멘트를 작성하세요.

요구사항:
- 업종과 채널 특성을 반영한 실용적인 조언을 포함할 것
- 한국어로 작성할 것
- 코드 블록이나 마크다운 없이 순수 텍스트로만 반환할 것
- 너무 일반적이거나 모호한 내용은 피할 것`;
}

async function callGeminiPersonalize(input: PersonalizeInput): Promise<string> {
  const body = {
    model: GEMINI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "당신은 한국 마케터를 위한 브랜드 세이프티 어드바이저입니다. 간결하고 실용적인 맞춤 조언을 제공합니다.",
      },
      { role: "user", content: buildPersonalizePrompt(input) },
    ],
    temperature: 0.3,
    max_tokens: 256,
  };

  const res = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    if (res.status === 429) return "";
    throw new Error(`Gemini personalize error: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

async function callOllamaPersonalize(input: PersonalizeInput): Promise<string> {
  const body = {
    model: OLLAMA_MODEL,
    messages: [
      {
        role: "system",
        content:
          "당신은 한국 마케터를 위한 브랜드 세이프티 어드바이저입니다. 간결하고 실용적인 맞춤 조언을 제공합니다.",
      },
      { role: "user", content: buildPersonalizePrompt(input) },
    ],
    stream: false,
    options: { temperature: 0.3 },
  };

  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Ollama personalize error: ${res.status}`);

  const data = (await res.json()) as { message?: { content?: string } };
  return (data.message?.content ?? "").trim();
}

/**
 * 공통 검토 결과를 입력받아 업종·채널 맞춤 코멘트를 반환한다.
 *
 * - industries 또는 channels가 비어 있으면 "" 반환 (LLM 호출 불필요).
 * - LLM 오류 시 "" 반환 (맞춤 코멘트 없음, 서비스 중단 없음).
 */
export async function personalizeRationale(
  input: PersonalizeInput
): Promise<string> {
  if (input.industries.length === 0 || input.channels.length === 0) return "";

  try {
    if (GEMINI_API_KEY) {
      return await callGeminiPersonalize(input);
    }
    return await callOllamaPersonalize(input);
  } catch {
    return "";
  }
}
