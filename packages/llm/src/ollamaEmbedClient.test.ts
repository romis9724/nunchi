/**
 * Unit tests for ollamaEmbedClient — Sub-AC 2a
 *
 * Verifies that the Ollama HTTP client:
 *   1. Throws OllamaNetworkError on network-level fetch failures
 *   2. Throws OllamaHttpError on 4xx / 5xx HTTP status codes
 *   3. Throws OllamaFormatError when the response body is malformed or
 *      lacks the `embedding` array field
 *   4. Throws OllamaDimError when the embedding dimension ≠ 768
 *   5. Returns a 768-dim number[] on a well-formed 200 response
 *
 * HTTP layer is mocked by replacing globalThis.fetch — no real network calls.
 *
 * Run: pnpm --filter @nunchi/llm test:ollama-client
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  ollamaEmbed,
  OllamaNetworkError,
  OllamaHttpError,
  OllamaFormatError,
  OllamaDimError,
} from "./ollamaEmbedClient.js";

// ── 768-dim helper ────────────────────────────────────────────────────────────
const make768Vec = () => Array.from({ length: 768 }, (_, i) => i / 768);

// ── fetch mock helpers ────────────────────────────────────────────────────────
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

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ollamaEmbed — Ollama HTTP 클라이언트 에러 처리 (Sub-AC 2a)", () => {
  afterEach(() => {
    restoreFetch();
  });

  // ── 1. Network-level failure ─────────────────────────────────────────────────
  it("fetch 자체가 실패(ECONNREFUSED)할 때 OllamaNetworkError를 throw한다", async () => {
    setMockFetch(async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:11434");
    });

    await assert.rejects(
      () => ollamaEmbed("test", { baseUrl: "http://localhost:11434" }),
      (err: unknown) => {
        assert.ok(
          err instanceof OllamaNetworkError,
          `OllamaNetworkError여야 하는데 ${String(err?.constructor?.name)} 발생`
        );
        assert.ok(
          (err as Error).message.includes("network error"),
          `에러 메시지에 'network error'가 포함돼야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("fetch 타임아웃 AbortError를 OllamaNetworkError로 감싸서 throw한다", async () => {
    setMockFetch(async () => {
      const err = new DOMException("The operation was aborted", "AbortError");
      throw err;
    });

    await assert.rejects(
      () => ollamaEmbed("timeout test", { baseUrl: "http://localhost:11434" }),
      (err: unknown) => {
        assert.ok(
          err instanceof OllamaNetworkError,
          `AbortError도 OllamaNetworkError로 감싸져야 합니다. 실제: ${String(err?.constructor?.name)}`
        );
        return true;
      }
    );
  });

  it("DNS 해결 실패도 OllamaNetworkError로 throw한다", async () => {
    setMockFetch(async () => {
      throw new TypeError("Failed to fetch"); // 브라우저/Node 네트워크 오류 패턴
    });

    await assert.rejects(
      () => ollamaEmbed("dns test", { baseUrl: "http://no-such-host:11434" }),
      (err: unknown) => {
        assert.ok(err instanceof OllamaNetworkError);
        return true;
      }
    );
  });

  // ── 2. HTTP error status ─────────────────────────────────────────────────────
  it("Ollama 서버가 500을 반환하면 OllamaHttpError(status=500)를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("server error test"),
      (err: unknown) => {
        assert.ok(
          err instanceof OllamaHttpError,
          `OllamaHttpError여야 합니다. 실제: ${String(err?.constructor?.name)}`
        );
        assert.equal(
          (err as OllamaHttpError).status,
          500,
          "status 프로퍼티가 500이어야 합니다"
        );
        assert.ok(
          (err as Error).message.includes("500"),
          `메시지에 '500'이 포함돼야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("Ollama 서버가 404를 반환하면 OllamaHttpError(status=404)를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response("model not found", { status: 404 });
    });

    await assert.rejects(
      () => ollamaEmbed("not found test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaHttpError);
        assert.equal((err as OllamaHttpError).status, 404);
        return true;
      }
    );
  });

  it("Ollama 서버가 503을 반환하면 OllamaHttpError(status=503)를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response("Service Unavailable", { status: 503 });
    });

    await assert.rejects(
      () => ollamaEmbed("unavailable test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaHttpError);
        assert.equal((err as OllamaHttpError).status, 503);
        return true;
      }
    );
  });

  // ── 3. Format / shape errors ─────────────────────────────────────────────────
  it("응답 body에 embedding 필드가 없으면 OllamaFormatError를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response(JSON.stringify({ result: "no embedding here" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("missing field test"),
      (err: unknown) => {
        assert.ok(
          err instanceof OllamaFormatError,
          `OllamaFormatError여야 합니다. 실제: ${String(err?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("embedding"),
          `메시지에 'embedding'이 포함돼야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("응답 body의 embedding이 null이면 OllamaFormatError를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("null embedding test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaFormatError);
        return true;
      }
    );
  });

  it("응답 body의 embedding이 배열이 아닌 객체면 OllamaFormatError를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ embedding: { not: "an array" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => ollamaEmbed("object embedding test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaFormatError);
        return true;
      }
    );
  });

  it("응답 body 자체가 유효하지 않은 JSON이면 OllamaFormatError를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response("this is not json }{", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("invalid json test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaFormatError);
        return true;
      }
    );
  });

  // ── 4. Dimension mismatch ─────────────────────────────────────────────────────
  it("embedding 차원이 768이 아니면 OllamaDimError를 throw한다 (실제 100차원)", async () => {
    const wrongDimVec = Array.from({ length: 100 }, (_, i) => i / 100);

    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: wrongDimVec }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("dim mismatch test"),
      (err: unknown) => {
        assert.ok(
          err instanceof OllamaDimError,
          `OllamaDimError여야 합니다. 실제: ${String(err?.constructor?.name)}`
        );
        assert.equal(
          (err as OllamaDimError).actualDim,
          100,
          "actualDim이 100이어야 합니다"
        );
        assert.equal(
          (err as OllamaDimError).expectedDim,
          768,
          "expectedDim이 768이어야 합니다"
        );
        assert.ok(
          (err as Error).message.includes("768"),
          `메시지에 '768'이 포함돼야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("embedding 차원이 1536이면 OllamaDimError를 throw한다 (OpenAI 차원 오류 검출)", async () => {
    const openAiVec = Array.from({ length: 1536 }, (_, i) => i / 1536);

    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: openAiVec }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("openai dim test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaDimError);
        assert.equal((err as OllamaDimError).actualDim, 1536);
        return true;
      }
    );
  });

  it("빈 embedding 배열(0차원)이면 OllamaDimError를 throw한다", async () => {
    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => ollamaEmbed("empty vec test"),
      (err: unknown) => {
        assert.ok(err instanceof OllamaDimError);
        assert.equal((err as OllamaDimError).actualDim, 0);
        return true;
      }
    );
  });

  // ── 5. Happy path ─────────────────────────────────────────────────────────────
  it("정상 응답(200, 768차원)이면 number[] 배열을 반환한다", async () => {
    const vec768 = make768Vec();

    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: vec768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await ollamaEmbed("happy path test");

    assert.equal(result.length, 768, "768차원을 반환해야 합니다");
    assert.ok(
      result.every((x) => typeof x === "number"),
      "모든 요소가 number여야 합니다"
    );
    assert.deepEqual(result, vec768, "반환 벡터가 응답 값과 일치해야 합니다");
  });

  it("커스텀 baseUrl로 올바른 URL을 호출한다", async () => {
    const vec768 = make768Vec();
    let capturedUrl: string | undefined;

    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ embedding: vec768 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await ollamaEmbed("url test", {
      baseUrl: "http://custom-ollama:12345",
      model: "nomic-embed-text:latest",
    });

    assert.ok(
      capturedUrl?.startsWith("http://custom-ollama:12345"),
      `URL이 커스텀 baseUrl로 시작해야 합니다. 실제: ${capturedUrl}`
    );
    assert.ok(
      capturedUrl?.includes("/api/embeddings"),
      `URL에 /api/embeddings가 포함돼야 합니다. 실제: ${capturedUrl}`
    );
  });

  it("expectedDim 옵션으로 커스텀 차원을 검증할 수 있다", async () => {
    // 256차원 모델을 사용하는 커스텀 시나리오
    const vec256 = Array.from({ length: 256 }, (_, i) => i / 256);

    setMockFetch(async () => {
      return new Response(JSON.stringify({ embedding: vec256 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await ollamaEmbed("custom dim test", { expectedDim: 256 });

    assert.equal(result.length, 256, "커스텀 expectedDim 256으로 반환돼야 합니다");
  });
});
