/**
 * Unit tests for geminiEmbedClient — Sub-AC 2b
 *
 * Verifies that the Gemini HTTP client:
 *   1. Returns a 768-dim Float array when called with GEMINI_API_KEY (happy path)
 *   2. Reads GEMINI_API_KEY env var and passes it as ?key= query param
 *   3. Throws GeminiConfigError when GEMINI_API_KEY is absent
 *   4. Throws GeminiNetworkError on network-level fetch failures
 *   5. Throws GeminiHttpError on 4xx / 5xx HTTP status codes (e.g. 400, 429, 500)
 *   6. Throws GeminiFormatError when response body is malformed or
 *      lacks the `embedding.values` array field
 *   7. Throws GeminiDimError when the embedding dimension ≠ 768
 *
 * HTTP layer is mocked by replacing globalThis.fetch — no real network calls.
 *
 * Run: pnpm --filter @nunchi/llm test:gemini-client
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  geminiEmbed,
  GeminiConfigError,
  GeminiNetworkError,
  GeminiHttpError,
  GeminiFormatError,
  GeminiDimError,
} from "./geminiEmbedClient.js";

// ── 768-dim helper ─────────────────────────────────────────────────────────────
const make768FloatVec = (): number[] =>
  Array.from({ length: 768 }, (_, i) => (i / 768) * 2 - 1);

// ── fetch mock helpers ─────────────────────────────────────────────────────────
type FetchImpl = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

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

// ── env-var save / restore ─────────────────────────────────────────────────────
const _origApiKey = process.env.GEMINI_API_KEY;

function restoreEnv(): void {
  if (_origApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = _origApiKey;
  }
}

// ── Gemini API response builder ────────────────────────────────────────────────
function makeGeminiResponse(values: number[]): Response {
  return new Response(
    JSON.stringify({ embedding: { values } }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe("geminiEmbed — Gemini 임베딩 클라이언트 (Sub-AC 2b)", () => {
  afterEach(() => {
    restoreFetch();
    restoreEnv();
  });

  // ── 1. Happy path — 768차원 Float 배열 반환 ────────────────────────────────────
  it("GEMINI_API_KEY로 호출 시 768차원 Float 배열을 반환한다", async () => {
    process.env.GEMINI_API_KEY = "test-api-key-abc123";
    const vec768 = make768FloatVec();

    setMockFetch(async () => makeGeminiResponse(vec768));

    const result = await geminiEmbed("5·18 광주민주화운동 텍스트");

    assert.equal(
      result.length,
      768,
      `768차원을 반환해야 합니다. 실제값: ${result.length}`
    );
    assert.ok(
      result.every((x) => typeof x === "number"),
      "모든 요소가 number(float) 타입이어야 합니다"
    );
    assert.deepEqual(result, vec768, "반환 벡터가 응답 values와 일치해야 합니다");
  });

  // ── 2. GEMINI_API_KEY 환경변수를 ?key= 쿼리 파라미터로 전달 ───────────────────
  it("GEMINI_API_KEY 환경변수를 ?key= 쿼리 파라미터에 포함한다", async () => {
    const testApiKey = "MY_SECRET_GEMINI_KEY_XYZ";
    process.env.GEMINI_API_KEY = testApiKey;
    const vec768 = make768FloatVec();

    let capturedUrl: string | undefined;

    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return makeGeminiResponse(vec768);
    });

    await geminiEmbed("API 키 전달 검증 텍스트");

    assert.ok(capturedUrl !== undefined, "fetch가 호출되어야 합니다");
    assert.ok(
      capturedUrl.includes(`key=${testApiKey}`),
      `URL에 key=${testApiKey}가 포함되어야 합니다. 실제값: ${capturedUrl}`
    );
  });

  it("옵션으로 전달된 apiKey를 GEMINI_API_KEY 환경변수보다 우선 사용한다", async () => {
    process.env.GEMINI_API_KEY = "env-key-should-be-overridden";
    const overrideKey = "option-override-key-999";
    const vec768 = make768FloatVec();

    let capturedUrl: string | undefined;

    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return makeGeminiResponse(vec768);
    });

    await geminiEmbed("옵션 키 우선순위 테스트", { apiKey: overrideKey });

    assert.ok(
      capturedUrl?.includes(`key=${overrideKey}`),
      `URL에 오버라이드 키가 포함되어야 합니다. 실제값: ${capturedUrl}`
    );
    assert.ok(
      !capturedUrl?.includes("env-key-should-be-overridden"),
      "환경변수 키가 URL에 노출되면 안 됩니다"
    );
  });

  it("text-embedding-004 모델 엔드포인트 URL을 호출한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const vec768 = make768FloatVec();

    let capturedUrl: string | undefined;

    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return makeGeminiResponse(vec768);
    });

    await geminiEmbed("모델 URL 검증 텍스트");

    assert.ok(
      capturedUrl?.includes("text-embedding-004"),
      `URL에 text-embedding-004가 포함되어야 합니다. 실제값: ${capturedUrl}`
    );
    assert.ok(
      capturedUrl?.includes("embedContent"),
      `URL에 embedContent 액션이 포함되어야 합니다. 실제값: ${capturedUrl}`
    );
  });

  it("요청 body의 content.parts[0].text에 입력 텍스트를 포함한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const vec768 = make768FloatVec();
    const inputText = "4·16 세월호 참사 기념일 관련 캠페인 카피";

    let capturedBody: unknown;

    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return makeGeminiResponse(vec768);
    });

    await geminiEmbed(inputText);

    const body = capturedBody as {
      content?: { parts?: { text?: string }[] };
    };
    assert.equal(
      body?.content?.parts?.[0]?.text,
      inputText,
      `요청 body에 입력 텍스트가 그대로 전달되어야 합니다`
    );
  });

  // ── 3. GEMINI_API_KEY 없을 때 GeminiConfigError ────────────────────────────────
  it("GEMINI_API_KEY가 없으면 GeminiConfigError를 throw한다", async () => {
    delete process.env.GEMINI_API_KEY;

    await assert.rejects(
      () => geminiEmbed("키 없음 테스트"),
      (err: unknown) => {
        assert.ok(
          err instanceof GeminiConfigError,
          `GeminiConfigError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("GEMINI_API_KEY"),
          `에러 메시지에 'GEMINI_API_KEY'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("apiKey 옵션도 없고 환경변수도 없으면 GeminiConfigError를 throw한다", async () => {
    delete process.env.GEMINI_API_KEY;

    await assert.rejects(
      () => geminiEmbed("명시적 키 없음", { apiKey: undefined }),
      (err: unknown) => {
        assert.ok(err instanceof GeminiConfigError);
        return true;
      }
    );
  });

  // ── 4. Network errors → GeminiNetworkError ────────────────────────────────────
  it("fetch 자체가 실패(ECONNREFUSED)할 때 GeminiNetworkError를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    await assert.rejects(
      () => geminiEmbed("네트워크 오류 테스트"),
      (err: unknown) => {
        assert.ok(
          err instanceof GeminiNetworkError,
          `GeminiNetworkError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("network error"),
          `에러 메시지에 'network error'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("AbortError(타임아웃)를 GeminiNetworkError로 감싸서 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    });

    await assert.rejects(
      () => geminiEmbed("타임아웃 테스트"),
      (err: unknown) => {
        assert.ok(
          err instanceof GeminiNetworkError,
          `AbortError도 GeminiNetworkError로 감싸져야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        return true;
      }
    );
  });

  // ── 5. HTTP error status → GeminiHttpError ────────────────────────────────────
  it("Gemini API가 400을 반환하면 GeminiHttpError(status=400)를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ error: { message: "Bad Request" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => geminiEmbed("400 에러 테스트"),
      (err: unknown) => {
        assert.ok(
          err instanceof GeminiHttpError,
          `GeminiHttpError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.equal(
          (err as GeminiHttpError).status,
          400,
          "status 프로퍼티가 400이어야 합니다"
        );
        return true;
      }
    );
  });

  it("Gemini API가 429를 반환하면 GeminiHttpError(status=429)를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response("Rate limit exceeded", { status: 429 });
    });

    await assert.rejects(
      () => geminiEmbed("쿼터 초과 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiHttpError);
        assert.equal((err as GeminiHttpError).status, 429);
        assert.ok(
          (err as Error).message.includes("429"),
          `메시지에 '429'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("Gemini API가 500을 반환하면 GeminiHttpError(status=500)를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response("Internal Server Error", { status: 500 });
    });

    await assert.rejects(
      () => geminiEmbed("서버 오류 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiHttpError);
        assert.equal((err as GeminiHttpError).status, 500);
        return true;
      }
    );
  });

  it("Gemini API가 401을 반환하면 GeminiHttpError(status=401)를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "invalid-key";

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ error: { message: "API key not valid" } }),
        { status: 401 }
      );
    });

    await assert.rejects(
      () => geminiEmbed("인증 실패 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiHttpError);
        assert.equal((err as GeminiHttpError).status, 401);
        return true;
      }
    );
  });

  // ── 6. Malformed response → GeminiFormatError ─────────────────────────────────
  it("응답 body에 embedding 필드가 없으면 GeminiFormatError를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ result: "no embedding here" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => geminiEmbed("embedding 필드 없음 테스트"),
      (err: unknown) => {
        assert.ok(
          err instanceof GeminiFormatError,
          `GeminiFormatError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("embedding"),
          `에러 메시지에 'embedding'이 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("응답 body의 embedding.values가 배열이 아니면 GeminiFormatError를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ embedding: { values: "not an array" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => geminiEmbed("values 타입 오류 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiFormatError);
        return true;
      }
    );
  });

  it("embedding이 null이면 GeminiFormatError를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ embedding: null }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => geminiEmbed("null embedding 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiFormatError);
        return true;
      }
    );
  });

  it("응답 body 자체가 유효하지 않은 JSON이면 GeminiFormatError를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => {
      return new Response("not valid json }{", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => geminiEmbed("invalid JSON 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiFormatError);
        return true;
      }
    );
  });

  // ── 7. Dimension mismatch → GeminiDimError ────────────────────────────────────
  it("embedding.values 차원이 768이 아니면 GeminiDimError를 throw한다 (실제 100차원)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const wrongDimVec = Array.from({ length: 100 }, (_, i) => i / 100);

    setMockFetch(async () => makeGeminiResponse(wrongDimVec));

    await assert.rejects(
      () => geminiEmbed("차원 불일치 테스트"),
      (err: unknown) => {
        assert.ok(
          err instanceof GeminiDimError,
          `GeminiDimError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.equal(
          (err as GeminiDimError).actualDim,
          100,
          "actualDim이 100이어야 합니다"
        );
        assert.equal(
          (err as GeminiDimError).expectedDim,
          768,
          "expectedDim이 768이어야 합니다"
        );
        assert.ok(
          (err as Error).message.includes("768"),
          `메시지에 '768'이 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("embedding.values 차원이 1536이면 GeminiDimError를 throw한다 (OpenAI 차원 혼용 방지)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const openAiVec = Array.from({ length: 1536 }, (_, i) => i / 1536);

    setMockFetch(async () => makeGeminiResponse(openAiVec));

    await assert.rejects(
      () => geminiEmbed("OpenAI 차원 혼용 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiDimError);
        assert.equal((err as GeminiDimError).actualDim, 1536);
        assert.equal((err as GeminiDimError).expectedDim, 768);
        return true;
      }
    );
  });

  it("빈 values 배열(0차원)이면 GeminiDimError를 throw한다", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    setMockFetch(async () => makeGeminiResponse([]));

    await assert.rejects(
      () => geminiEmbed("빈 배열 테스트"),
      (err: unknown) => {
        assert.ok(err instanceof GeminiDimError);
        assert.equal((err as GeminiDimError).actualDim, 0);
        return true;
      }
    );
  });

  it("expectedDim 옵션으로 커스텀 차원을 검증할 수 있다", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    // 가상의 256차원 Gemini 모델 시나리오
    const vec256 = Array.from({ length: 256 }, (_, i) => i / 256);

    setMockFetch(async () => makeGeminiResponse(vec256));

    const result = await geminiEmbed("커스텀 차원 테스트", { expectedDim: 256 });

    assert.equal(result.length, 256, "커스텀 expectedDim 256으로 반환되어야 합니다");
  });
});
