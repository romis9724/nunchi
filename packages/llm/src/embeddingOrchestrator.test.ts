/**
 * Unit tests for embeddingOrchestrator — Sub-AC 2c
 *
 * Verifies that orchestrateEmbedding():
 *   1. Ollama 네트워크 오류(OllamaNetworkError) 발생 시
 *      자동으로 Gemini 클라이언트로 전환하여 768차원 embedding을 반환한다
 *   2. Ollama 비정상 응답(OllamaFormatError) 발생 시
 *      자동으로 Gemini 클라이언트로 전환하여 768차원 embedding을 반환한다
 *   3. Gemini 클라이언트가 원래 텍스트와 동일한 인수로 호출된다
 *   4. Ollama 성공 시 Gemini를 호출하지 않고 Ollama 결과를 반환한다
 *   5. 두 클라이언트 모두 실패하면 마지막 에러를 propagate한다
 *
 * 두 클라이언트 모두 mock 함수로 주입 — 실제 네트워크 호출 없음.
 *
 * Run: pnpm --filter @noonchi/llm test:orchestrator
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orchestrateEmbedding } from "./embeddingOrchestrator.js";
import { OllamaNetworkError, OllamaFormatError } from "./ollamaEmbedClient.js";

// ── 768-dim mock vector ─────────────────────────────────────────────────────
const MOCK_GEMINI_VEC_768 = Array.from(
  { length: 768 },
  (_, i) => (i / 768) * 2 - 1
);
const MOCK_OLLAMA_VEC_768 = Array.from(
  { length: 768 },
  (_, i) => i / 768
);

// ── tests ───────────────────────────────────────────────────────────────────

describe("orchestrateEmbedding — Ollama→Gemini fallback (Sub-AC 2c)", () => {
  // ── Case 1: Ollama network error → Gemini fallback ──────────────────────────
  it("Ollama 네트워크 오류 발생 시 자동으로 Gemini로 전환하여 768차원 임베딩을 반환한다", async () => {
    const mockOllama = async (_text: string): Promise<number[]> => {
      throw new OllamaNetworkError(
        "connect ECONNREFUSED 127.0.0.1:11434 — Ollama not running"
      );
    };
    const mockGemini = async (_text: string): Promise<number[]> => {
      return [...MOCK_GEMINI_VEC_768];
    };

    const result = await orchestrateEmbedding(
      "5·18 광주민주화운동 기념일 텍스트",
      mockOllama,
      mockGemini
    );

    assert.equal(
      result.length,
      768,
      `768차원을 반환해야 합니다. 실제: ${result.length}`
    );
    assert.ok(
      result.every((x) => typeof x === "number"),
      "모든 요소가 number 타입이어야 합니다"
    );
    assert.deepEqual(result, MOCK_GEMINI_VEC_768, "Gemini 벡터와 일치해야 합니다");
  });

  // ── Case 2: Ollama abnormal response (format error) → Gemini fallback ──────
  it("Ollama 비정상 응답(OllamaFormatError) 발생 시 자동으로 Gemini로 전환하여 768차원 임베딩을 반환한다", async () => {
    const mockOllama = async (_text: string): Promise<number[]> => {
      throw new OllamaFormatError(
        "Ollama response missing 'embedding' array. Got: {}"
      );
    };
    const mockGemini = async (_text: string): Promise<number[]> => {
      return [...MOCK_GEMINI_VEC_768];
    };

    const result = await orchestrateEmbedding(
      "4·16 세월호 참사 관련 캠페인 카피",
      mockOllama,
      mockGemini
    );

    assert.equal(
      result.length,
      768,
      `비정상 응답 시에도 768차원을 반환해야 합니다. 실제: ${result.length}`
    );
    assert.ok(
      result.every((x) => typeof x === "number"),
      "모든 요소가 number 타입이어야 합니다"
    );
    assert.deepEqual(result, MOCK_GEMINI_VEC_768, "Gemini 벡터와 일치해야 합니다");
  });

  // ── Case 2b: Ollama network error via AbortError (timeout) ─────────────────
  it("Ollama AbortError(타임아웃) 발생 시 자동으로 Gemini로 전환한다", async () => {
    const mockOllama = async (_text: string): Promise<number[]> => {
      throw new OllamaNetworkError("The operation was aborted — timeout");
    };
    const mockGemini = async (_text: string): Promise<number[]> => {
      return [...MOCK_GEMINI_VEC_768];
    };

    const result = await orchestrateEmbedding(
      "타임아웃 폴백 테스트",
      mockOllama,
      mockGemini
    );

    assert.equal(result.length, 768);
    assert.deepEqual(result, MOCK_GEMINI_VEC_768);
  });

  // ── Case 3: Gemini receives the same original text ──────────────────────────
  it("Gemini 클라이언트가 Ollama에 전달된 것과 동일한 텍스트로 호출된다", async () => {
    const mockOllama = async (_text: string): Promise<number[]> => {
      throw new OllamaNetworkError("Ollama down");
    };

    let geminiCalledWith: string | undefined;
    const mockGemini = async (text: string): Promise<number[]> => {
      geminiCalledWith = text;
      return [...MOCK_GEMINI_VEC_768];
    };

    const inputText = "탱크 시리즈 — 책상에 탁! 광주민주화운동 연상 텍스트";
    await orchestrateEmbedding(inputText, mockOllama, mockGemini);

    assert.equal(
      geminiCalledWith,
      inputText,
      `Gemini에 전달된 텍스트가 원래 입력과 동일해야 합니다. 실제: ${geminiCalledWith}`
    );
  });

  // ── Case 4: Ollama succeeds → Gemini not called ─────────────────────────────
  it("Ollama 성공 시 Gemini를 호출하지 않고 Ollama 결과를 그대로 반환한다", async () => {
    let geminiCalled = false;
    const mockOllama = async (_text: string): Promise<number[]> => {
      return [...MOCK_OLLAMA_VEC_768];
    };
    const mockGemini = async (_text: string): Promise<number[]> => {
      geminiCalled = true;
      return [...MOCK_GEMINI_VEC_768];
    };

    const result = await orchestrateEmbedding(
      "Ollama 정상 동작 텍스트",
      mockOllama,
      mockGemini
    );

    assert.equal(geminiCalled, false, "Ollama 성공 시 Gemini가 호출되면 안 됩니다");
    assert.equal(result.length, 768, "Ollama 결과도 768차원이어야 합니다");
    assert.deepEqual(result, MOCK_OLLAMA_VEC_768, "Ollama 벡터와 일치해야 합니다");
  });

  // ── Case 5: Both fail → propagates Gemini error ─────────────────────────────
  it("두 클라이언트 모두 실패하면 Gemini 에러를 propagate한다", async () => {
    const mockOllama = async (_text: string): Promise<number[]> => {
      throw new OllamaNetworkError("Ollama down");
    };
    const geminiError = new Error("Gemini API quota exhausted");
    const mockGemini = async (_text: string): Promise<number[]> => {
      throw geminiError;
    };

    await assert.rejects(
      () =>
        orchestrateEmbedding(
          "두 클라이언트 모두 실패 테스트",
          mockOllama,
          mockGemini
        ),
      (err: unknown) => {
        assert.strictEqual(
          err,
          geminiError,
          "Gemini 에러가 그대로 propagate되어야 합니다"
        );
        return true;
      }
    );
  });

  // ── Edge: Ollama format error (HTTP 500 → OllamaHttpError) also triggers fallback
  it("Ollama HTTP 오류 에러도 Gemini fallback을 트리거한다", async () => {
    const mockOllama = async (_text: string): Promise<number[]> => {
      // Any error (not just Network/Format) should fall through to Gemini
      throw new Error("Ollama HTTP 500 Internal Server Error");
    };
    const mockGemini = async (_text: string): Promise<number[]> => {
      return [...MOCK_GEMINI_VEC_768];
    };

    const result = await orchestrateEmbedding(
      "HTTP 오류 폴백 테스트",
      mockOllama,
      mockGemini
    );

    assert.equal(result.length, 768);
    assert.deepEqual(result, MOCK_GEMINI_VEC_768);
  });
});
