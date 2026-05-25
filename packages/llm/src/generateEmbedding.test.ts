/**
 * Unit tests for generateEmbedding() and generateEmbeddingWithFallback()
 *
 * Sub-AC 1: generateEmbedding()가 OLLAMA_BASE_URL과 OLLAMA_EMBED_MODEL 환경변수를
 *   읽어 Ollama nomic-embed-text API를 호출하고 768차원 number[] 배열을 반환하는지
 *   단위 테스트로 검증 (Ollama HTTP 응답 mock 포함)
 *
 * Sub-AC 3b: generateEmbedding() / generateEmbeddingWithFallback() —
 *   GEMINI_API_KEY 미설정 시 Gemini 코드 경로가 명확한 에러를 throw하거나
 *   graceful degradation을 수행하는 단위 테스트
 *   (환경변수 언셋 후 함수 호출 → 에러 타입/메시지 또는 fallback 반환값 검증)
 *
 * Run: tsx --test src/generateEmbedding.test.ts
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { generateEmbedding } from "./claude.js";
import { generateEmbeddingWithFallback } from "./embeddingOrchestrator.js";
import { GeminiConfigError } from "./geminiEmbedClient.js";

// ── 768-dim mock vector ─────────────────────────────────────────────────────
const MOCK_EMBEDDING_768 = Array.from({ length: 768 }, (_, i) => (i / 768) * 2 - 1);

// ── fetch mock helpers ──────────────────────────────────────────────────────
type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let _savedFetch: FetchImpl | undefined;

function setMockFetch(impl: FetchImpl): void {
  _savedFetch = globalThis.fetch as FetchImpl | undefined;
  (globalThis as Record<string, unknown>).fetch = impl;
}

function restoreFetch(): void {
  if (_savedFetch !== undefined) {
    (globalThis as Record<string, unknown>).fetch = _savedFetch;
    _savedFetch = undefined;
  }
}

// ── env-var save / restore ──────────────────────────────────────────────────
const _origBase = process.env.OLLAMA_BASE_URL;
const _origModel = process.env.OLLAMA_EMBED_MODEL;

function restoreEnv(): void {
  if (_origBase === undefined) {
    delete process.env.OLLAMA_BASE_URL;
  } else {
    process.env.OLLAMA_BASE_URL = _origBase;
  }
  if (_origModel === undefined) {
    delete process.env.OLLAMA_EMBED_MODEL;
  } else {
    process.env.OLLAMA_EMBED_MODEL = _origModel;
  }
}

// ── tests ───────────────────────────────────────────────────────────────────

describe("generateEmbedding", () => {
  afterEach(() => {
    restoreFetch();
    restoreEnv();
  });

  it("OLLAMA_BASE_URL 환경변수를 읽어 Ollama /api/embeddings 엔드포인트를 호출한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://test-ollama:11434";
    process.env.OLLAMA_EMBED_MODEL = "nomic-embed-text:latest";

    let capturedUrl: string | undefined;

    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ embedding: MOCK_EMBEDDING_768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await generateEmbedding("테스트 텍스트");

    assert.ok(capturedUrl !== undefined, "fetch가 호출되어야 합니다");
    assert.ok(
      capturedUrl.startsWith("http://test-ollama:11434"),
      `URL이 OLLAMA_BASE_URL로 시작해야 합니다. 실제값: ${capturedUrl}`
    );
    assert.ok(
      capturedUrl.includes("/api/embeddings"),
      `URL에 /api/embeddings가 포함되어야 합니다. 실제값: ${capturedUrl}`
    );
  });

  it("OLLAMA_EMBED_MODEL 환경변수를 읽어 요청 body의 model 필드에 포함한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_EMBED_MODEL = "nomic-embed-text:test-model";

    let capturedBody: { model?: string; prompt?: string } | undefined;

    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string) as { model?: string; prompt?: string };
      return new Response(JSON.stringify({ embedding: MOCK_EMBEDDING_768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await generateEmbedding("모델 환경변수 테스트");

    assert.ok(capturedBody !== undefined, "요청 body가 캡처되어야 합니다");
    assert.equal(
      capturedBody.model,
      "nomic-embed-text:test-model",
      `model 필드가 OLLAMA_EMBED_MODEL 값이어야 합니다. 실제값: ${capturedBody.model}`
    );
  });

  it("Ollama 응답에서 768차원 number[] 배열을 반환한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_EMBED_MODEL = "nomic-embed-text:latest";

    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: MOCK_EMBEDDING_768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await generateEmbedding("768차원 검증 테스트");

    assert.equal(result.length, 768, `768차원을 반환해야 합니다. 실제값: ${result.length}`);
    assert.ok(
      result.every((x) => typeof x === "number"),
      "모든 요소가 number 타입이어야 합니다"
    );
    assert.deepEqual(result, MOCK_EMBEDDING_768);
  });

  it("Ollama 연결 실패(예외 발생) 시 768차원 해시 폴백 벡터를 반환한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_EMBED_MODEL = "nomic-embed-text:latest";

    setMockFetch(async () => {
      throw new Error("Connection refused — Ollama not running");
    });

    const result = await generateEmbedding("폴백 테스트");

    assert.equal(result.length, 768, `폴백도 768차원이어야 합니다. 실제값: ${result.length}`);
    assert.ok(
      result.every((x) => typeof x === "number"),
      "폴백 벡터의 모든 요소가 number 타입이어야 합니다"
    );
  });

  it("Ollama 응답 embedding이 null일 때 해시 폴백을 사용한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_EMBED_MODEL = "nomic-embed-text:latest";

    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await generateEmbedding("빈 응답 폴백 테스트");

    assert.equal(result.length, 768, `null embedding 시 폴백도 768차원이어야 합니다`);
  });

  it("OLLAMA_EMBED_MODEL 미설정 시 기본값 nomic-embed-text:latest를 사용한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    delete process.env.OLLAMA_EMBED_MODEL;

    let capturedBody: { model?: string } | undefined;

    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string) as { model?: string };
      return new Response(JSON.stringify({ embedding: MOCK_EMBEDDING_768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await generateEmbedding("기본값 테스트");

    assert.equal(
      capturedBody?.model,
      "nomic-embed-text:latest",
      `기본 모델명은 nomic-embed-text:latest여야 합니다. 실제값: ${capturedBody?.model}`
    );
  });

  it("입력 텍스트를 Ollama 요청 body의 prompt 필드에 포함한다", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_EMBED_MODEL = "nomic-embed-text:latest";

    const inputText = "5·18 광주민주화운동 관련 카피 텍스트";
    let capturedBody: { prompt?: string } | undefined;

    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string) as { prompt?: string };
      return new Response(JSON.stringify({ embedding: MOCK_EMBEDDING_768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await generateEmbedding(inputText);

    assert.equal(
      capturedBody?.prompt,
      inputText,
      `prompt 필드에 입력 텍스트가 그대로 전달되어야 합니다`
    );
  });

  // ── Sub-AC 3a: OLLAMA_BASE_URL 미설정 시 Ollama 코드 경로 검증 ───────────────

  it("OLLAMA_BASE_URL 미설정 시 기본 localhost 엔드포인트를 시도하고 실패하면 768차원 해시 폴백을 반환한다 (Sub-AC 3a)", async () => {
    // Given: OLLAMA_BASE_URL 환경변수가 설정되지 않음
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OLLAMA_EMBED_MODEL;

    let capturedUrl: string | undefined;

    // Ollama가 로컬에서 실행되지 않는 상황 시뮬레이션 (기본 localhost 호출 실패)
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      throw new Error("connect ECONNREFUSED 127.0.0.1:11434");
    });

    // When: generateEmbedding 호출 (OLLAMA_BASE_URL 없음)
    const result = await generateEmbedding("OLLAMA_BASE_URL 미설정 graceful degradation 테스트");

    // Then: Ollama 코드 경로가 실제로 시도됨 — 기본 localhost:11434로 fetch 호출
    assert.ok(
      capturedUrl !== undefined,
      "fetch가 호출되어야 합니다 (Ollama 코드 경로가 진입되었음을 확인)"
    );
    assert.ok(
      capturedUrl.includes("11434"),
      `OLLAMA_BASE_URL 미설정 시 기본 localhost:11434를 시도해야 합니다. 실제 URL: ${capturedUrl}`
    );
    assert.ok(
      capturedUrl.includes("/api/embeddings"),
      `URL에 /api/embeddings가 포함되어야 합니다. 실제 URL: ${capturedUrl}`
    );

    // Then: graceful degradation — 768차원 해시 폴백 반환 (서비스 중단 없음)
    assert.equal(
      result.length,
      768,
      `OLLAMA_BASE_URL 미설정 시 폴백도 768차원이어야 합니다. 실제값: ${result.length}`
    );
    assert.ok(
      result.every((x) => typeof x === "number"),
      "폴백 벡터의 모든 요소가 number 타입이어야 합니다"
    );
    // 폴백 벡터는 해시 기반이므로 입력에 따라 결정론적이어야 함
    assert.ok(
      result.some((x) => x !== 0),
      "폴백 벡터는 모두 0이 아닌 해시 기반 값이어야 합니다"
    );
  });

  it("OLLAMA_BASE_URL 미설정 시 Ollama 서버가 에러(HTTP 500) 응답해도 768차원 해시 폴백을 반환한다 (Sub-AC 3a)", async () => {
    // Given: OLLAMA_BASE_URL 환경변수가 설정되지 않음
    delete process.env.OLLAMA_BASE_URL;

    setMockFetch(async () => {
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    });

    // When
    const result = await generateEmbedding("HTTP 에러 폴백 테스트");

    // Then: graceful degradation — 에러를 throw하지 않고 768차원 폴백 반환
    assert.equal(
      result.length,
      768,
      `HTTP 500 오류 시에도 폴백은 768차원이어야 합니다. 실제값: ${result.length}`
    );
    assert.ok(
      result.every((x) => typeof x === "number"),
      "폴백 벡터의 모든 요소가 number 타입이어야 합니다"
    );
  });
});

// ── Sub-AC 3b: GEMINI_API_KEY 미설정 시 Gemini 코드 경로 검증 ────────────────────

/**
 * Save/restore for GEMINI_API_KEY environment variable.
 * Using separate save/restore to keep tests isolated.
 */
const _origGeminiKey = process.env.GEMINI_API_KEY;

function restoreGeminiEnv(): void {
  if (_origGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = _origGeminiKey;
  }
}

describe("generateEmbeddingWithFallback — Gemini 코드 경로 (Sub-AC 3b)", () => {
  afterEach(() => {
    restoreFetch();
    restoreEnv();
    restoreGeminiEnv();
  });

  it(
    "GEMINI_API_KEY 미설정 + Ollama 연결 실패 시 GeminiConfigError를 throw한다 (Sub-AC 3b)",
    async () => {
      // Given: Ollama 연결 불가 (Ollama down 시뮬레이션)
      delete process.env.OLLAMA_BASE_URL;
      delete process.env.OLLAMA_EMBED_MODEL;

      // Ollama fetch → 네트워크 오류 (→ orchestrateEmbedding이 Gemini로 전환)
      setMockFetch(async (input) => {
        const url = String(input);
        if (url.includes("11434")) {
          throw new Error("connect ECONNREFUSED 127.0.0.1:11434 — Ollama not running");
        }
        // Gemini fetch should not be reached since GEMINI_API_KEY check is first
        throw new Error("Unexpected fetch call in test");
      });

      // GEMINI_API_KEY 미설정 (Gemini 코드 경로 진입 시 GeminiConfigError)
      delete process.env.GEMINI_API_KEY;

      // When & Then: Gemini 코드 경로에서 GeminiConfigError를 throw해야 함
      await assert.rejects(
        () => generateEmbeddingWithFallback("GEMINI_API_KEY 미설정 에러 테스트"),
        (err: unknown) => {
          assert.ok(
            err instanceof GeminiConfigError,
            `Ollama 실패 + GEMINI_API_KEY 미설정 시 GeminiConfigError여야 합니다. ` +
              `실제: ${String((err as Error)?.constructor?.name)}`
          );
          assert.ok(
            (err as Error).message.includes("GEMINI_API_KEY"),
            `에러 메시지에 'GEMINI_API_KEY'가 포함되어야 합니다. 실제: ${(err as Error).message}`
          );
          return true;
        }
      );
    }
  );

  it(
    "GEMINI_API_KEY 빈 문자열 설정 시에도 Ollama 실패 → GeminiConfigError를 throw한다 (Sub-AC 3b)",
    async () => {
      // Given: GEMINI_API_KEY 빈 문자열 (falsy — API 키 없는 것과 동일)
      process.env.GEMINI_API_KEY = "";
      delete process.env.OLLAMA_BASE_URL;

      setMockFetch(async () => {
        throw new Error("connect ECONNREFUSED — Ollama not running");
      });

      // When & Then: 빈 문자열도 키 없는 것으로 처리되어 GeminiConfigError
      await assert.rejects(
        () => generateEmbeddingWithFallback("빈 GEMINI_API_KEY 에러 테스트"),
        (err: unknown) => {
          assert.ok(
            err instanceof GeminiConfigError,
            `빈 GEMINI_API_KEY도 GeminiConfigError여야 합니다. ` +
              `실제: ${String((err as Error)?.constructor?.name)}`
          );
          return true;
        }
      );
    }
  );

  it(
    "GEMINI_API_KEY 미설정 시 GeminiConfigError를 캐치해 빈 배열로 graceful degradation한다 (Sub-AC 3b)",
    async () => {
      // Given: Ollama down + GEMINI_API_KEY 미설정
      delete process.env.OLLAMA_BASE_URL;
      delete process.env.GEMINI_API_KEY;

      setMockFetch(async () => {
        throw new Error("connect ECONNREFUSED — Ollama not running");
      });

      // When: review-engine 패턴 — GeminiConfigError를 잡아 빈 배열 반환
      const result: number[] = await generateEmbeddingWithFallback(
        "graceful degradation 테스트"
      ).catch(() => []);

      // Then: 빈 배열 반환 — 시스템 전체가 멈추지 않아야 함
      assert.ok(
        Array.isArray(result),
        "catch 후 배열이어야 합니다"
      );
      assert.equal(
        result.length,
        0,
        `GeminiConfigError catch → 빈 배열 반환이어야 합니다. 실제: ${result.length}`
      );
    }
  );

  it(
    "GEMINI_API_KEY 미설정 시 에러 이름이 GeminiConfigError이고 메시지에 GEMINI_API_KEY가 포함된다 (Sub-AC 3b)",
    async () => {
      // Given
      delete process.env.OLLAMA_BASE_URL;
      delete process.env.GEMINI_API_KEY;

      setMockFetch(async () => {
        throw new Error("connect ECONNREFUSED — Ollama not running");
      });

      // When
      let caughtError: unknown;
      try {
        await generateEmbeddingWithFallback("에러 타입/메시지 검증 테스트");
      } catch (err) {
        caughtError = err;
      }

      // Then: 에러 타입과 메시지 모두 명확해야 함
      assert.ok(caughtError !== undefined, "에러가 발생해야 합니다");
      assert.ok(
        caughtError instanceof GeminiConfigError,
        `에러 클래스가 GeminiConfigError여야 합니다. 실제: ${String((caughtError as Error)?.constructor?.name)}`
      );
      assert.equal(
        (caughtError as Error).name,
        "GeminiConfigError",
        `error.name이 'GeminiConfigError'여야 합니다. 실제: ${(caughtError as Error).name}`
      );
      assert.ok(
        (caughtError as Error).message.includes("GEMINI_API_KEY"),
        `메시지에 'GEMINI_API_KEY'가 포함되어야 합니다. 실제: ${(caughtError as Error).message}`
      );
    }
  );
});
