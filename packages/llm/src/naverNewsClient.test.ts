/**
 * Unit tests for naverNewsClient — Sub-AC 14a
 *
 * 네이버 뉴스 API HTTP 클라이언트를 검증:
 *   1. HTTP 성공 — 날짜 범위 내 기사 배열 반환 (happy path)
 *   2. HTTP 오류 — 401, 403, 429, 500 상태 코드 시 NaverHttpError throw
 *   3. 빈 결과 케이스 — items가 빈 배열이거나 날짜 범위에 해당 없음
 *   4. NaverConfigError — 환경변수 누락 시
 *   5. NaverNetworkError — fetch() 자체 실패 시
 *   6. NaverFormatError — 응답 형식 오류 시
 *
 * HTTP 레이어는 globalThis.fetch 교체로 목(mock) 처리 — 실제 네트워크 호출 없음.
 *
 * Run: pnpm --filter @noonchi/llm test:naver-news
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  fetchNaverNews,
  NaverConfigError,
  NaverNetworkError,
  NaverHttpError,
  NaverFormatError,
  type NaverNewsItem,
} from "./naverNewsClient.js";

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
const _origClientId = process.env.NAVER_CLIENT_ID;
const _origClientSecret = process.env.NAVER_CLIENT_SECRET;

function setNaverEnv(): void {
  process.env.NAVER_CLIENT_ID = "test-client-id";
  process.env.NAVER_CLIENT_SECRET = "test-client-secret";
}

function restoreEnv(): void {
  if (_origClientId === undefined) {
    delete process.env.NAVER_CLIENT_ID;
  } else {
    process.env.NAVER_CLIENT_ID = _origClientId;
  }
  if (_origClientSecret === undefined) {
    delete process.env.NAVER_CLIENT_SECRET;
  } else {
    process.env.NAVER_CLIENT_SECRET = _origClientSecret;
  }
}

// ── 네이버 API 응답 빌더 ──────────────────────────────────────────────────────────
function makeNaverResponse(items: NaverNewsItem[]): Response {
  return new Response(
    JSON.stringify({
      lastBuildDate: "Thu, 28 May 2026 12:00:00 +0900",
      total: items.length,
      start: 1,
      display: items.length,
      items,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function makeNewsItem(
  overrides: Partial<NaverNewsItem> & { pubDate: string }
): NaverNewsItem {
  return {
    title: "테스트 뉴스 제목",
    originallink: "https://news.example.com/article1",
    link: "https://n.news.naver.com/article1",
    description: "테스트 뉴스 설명",
    ...overrides,
  };
}

// ── 테스트 날짜 범위 ────────────────────────────────────────────────────────────
const FROM = new Date("2026-05-01T00:00:00+09:00");
const TO = new Date("2026-05-31T23:59:59+09:00");

// ── tests ──────────────────────────────────────────────────────────────────────

describe("fetchNaverNews — 네이버 뉴스 API 클라이언트 (Sub-AC 14a)", () => {
  afterEach(() => {
    restoreFetch();
    restoreEnv();
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. HTTP 성공 케이스
  // ══════════════════════════════════════════════════════════════════════════════

  it("날짜 범위 내 기사를 배열로 반환한다 (happy path)", async () => {
    setNaverEnv();

    const inRangeItems: NaverNewsItem[] = [
      makeNewsItem({ pubDate: "Mon, 18 May 2026 09:00:00 +0900", title: "5·18 관련 기사" }),
      makeNewsItem({ pubDate: "Fri, 15 May 2026 15:30:00 +0900", title: "5·15 기사" }),
    ];

    setMockFetch(async () => makeNaverResponse(inRangeItems));

    const result = await fetchNaverNews({
      keywords: ["5·18", "광주"],
      from: FROM,
      to: TO,
    });

    assert.equal(result.length, 2, `2개 기사를 반환해야 합니다. 실제값: ${result.length}`);
    assert.ok(
      result.every((item) => typeof item.title === "string"),
      "모든 항목에 title 문자열이 있어야 합니다"
    );
    assert.ok(
      result.every((item) => typeof item.pubDate === "string"),
      "모든 항목에 pubDate 문자열이 있어야 합니다"
    );
  });

  it("키워드 배열을 공백으로 조인하여 query 파라미터로 전달한다", async () => {
    setNaverEnv();

    let capturedUrl: string | undefined;

    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return makeNaverResponse([]);
    });

    await fetchNaverNews({
      keywords: ["5·18", "광주민주화운동"],
      from: FROM,
      to: TO,
    });

    assert.ok(capturedUrl !== undefined, "fetch가 호출되어야 합니다");
    assert.ok(
      capturedUrl.includes("query="),
      `URL에 query 파라미터가 포함되어야 합니다. 실제값: ${capturedUrl}`
    );
    // URLSearchParams encodes spaces as '+'; parse via URL object for correct decoding
    const parsedQuery = new URL(capturedUrl).searchParams.get("query");
    assert.equal(
      parsedQuery,
      "5·18 광주민주화운동",
      `query 파라미터가 조인된 키워드와 일치해야 합니다. 실제값: ${parsedQuery}`
    );
  });

  it("X-Naver-Client-Id, X-Naver-Client-Secret 헤더를 전달한다", async () => {
    process.env.NAVER_CLIENT_ID = "my-naver-id";
    process.env.NAVER_CLIENT_SECRET = "my-naver-secret";

    let capturedHeaders: Record<string, string> | undefined;

    setMockFetch(async (_input, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return makeNaverResponse([]);
    });

    await fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO });

    assert.ok(capturedHeaders !== undefined, "헤더가 캡처되어야 합니다");
    assert.equal(
      capturedHeaders["X-Naver-Client-Id"],
      "my-naver-id",
      "X-Naver-Client-Id 헤더가 올바르게 설정되어야 합니다"
    );
    assert.equal(
      capturedHeaders["X-Naver-Client-Secret"],
      "my-naver-secret",
      "X-Naver-Client-Secret 헤더가 올바르게 설정되어야 합니다"
    );
  });

  it("옵션으로 전달된 clientId/clientSecret을 환경변수보다 우선 사용한다", async () => {
    process.env.NAVER_CLIENT_ID = "env-id-should-be-overridden";
    process.env.NAVER_CLIENT_SECRET = "env-secret-should-be-overridden";

    let capturedHeaders: Record<string, string> | undefined;

    setMockFetch(async (_input, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return makeNaverResponse([]);
    });

    await fetchNaverNews(
      { keywords: ["테스트"], from: FROM, to: TO },
      { clientId: "override-id", clientSecret: "override-secret" }
    );

    assert.equal(capturedHeaders?.["X-Naver-Client-Id"], "override-id");
    assert.equal(capturedHeaders?.["X-Naver-Client-Secret"], "override-secret");
  });

  it("날짜 범위를 벗어난 기사는 필터링하여 제외한다", async () => {
    setNaverEnv();

    const items: NaverNewsItem[] = [
      makeNewsItem({ pubDate: "Mon, 18 May 2026 09:00:00 +0900", title: "범위 내 기사" }),
      makeNewsItem({ pubDate: "Sat, 01 Apr 2026 10:00:00 +0900", title: "4월 기사 (범위 외)" }),
      makeNewsItem({ pubDate: "Wed, 03 Jun 2026 08:00:00 +0900", title: "6월 기사 (범위 외)" }),
    ];

    setMockFetch(async () => makeNaverResponse(items));

    const result = await fetchNaverNews({ keywords: ["뉴스"], from: FROM, to: TO });

    assert.equal(result.length, 1, "범위 내 기사 1개만 반환해야 합니다");
    assert.equal(result[0].title, "범위 내 기사");
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. 빈 결과 케이스
  // ══════════════════════════════════════════════════════════════════════════════

  it("API가 빈 items 배열을 반환하면 빈 배열을 반환한다", async () => {
    setNaverEnv();

    setMockFetch(async () => makeNaverResponse([]));

    const result = await fetchNaverNews({ keywords: ["없는키워드xyz123"], from: FROM, to: TO });

    assert.ok(Array.isArray(result), "빈 배열을 반환해야 합니다");
    assert.equal(result.length, 0, "기사 수가 0이어야 합니다");
  });

  it("모든 기사가 날짜 범위를 벗어난 경우 빈 배열을 반환한다", async () => {
    setNaverEnv();

    const outOfRangeItems: NaverNewsItem[] = [
      makeNewsItem({ pubDate: "Mon, 01 Jun 2026 09:00:00 +0900", title: "6월 기사" }),
      makeNewsItem({ pubDate: "Tue, 02 Jun 2026 10:00:00 +0900", title: "6월 기사 2" }),
    ];

    setMockFetch(async () => makeNaverResponse(outOfRangeItems));

    const result = await fetchNaverNews({ keywords: ["뉴스"], from: FROM, to: TO });

    assert.ok(Array.isArray(result), "빈 배열을 반환해야 합니다");
    assert.equal(result.length, 0, "모든 기사가 필터링되어야 합니다");
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. NaverConfigError — 환경변수 누락
  // ══════════════════════════════════════════════════════════════════════════════

  it("NAVER_CLIENT_ID가 없으면 NaverConfigError를 throw한다", async () => {
    delete process.env.NAVER_CLIENT_ID;
    process.env.NAVER_CLIENT_SECRET = "some-secret";

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverConfigError,
          `NaverConfigError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("NAVER_CLIENT_ID"),
          `메시지에 'NAVER_CLIENT_ID'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("NAVER_CLIENT_SECRET이 없으면 NaverConfigError를 throw한다", async () => {
    process.env.NAVER_CLIENT_ID = "some-id";
    delete process.env.NAVER_CLIENT_SECRET;

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverConfigError,
          `NaverConfigError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("NAVER_CLIENT_SECRET"),
          `메시지에 'NAVER_CLIENT_SECRET'이 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("두 환경변수가 모두 없으면 NaverConfigError를 throw한다", async () => {
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.NAVER_CLIENT_SECRET;

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(err instanceof NaverConfigError);
        return true;
      }
    );
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. NaverNetworkError — 네트워크 오류
  // ══════════════════════════════════════════════════════════════════════════════

  it("fetch가 ECONNREFUSED로 실패하면 NaverNetworkError를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverNetworkError,
          `NaverNetworkError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("network error"),
          `메시지에 'network error'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("AbortError(타임아웃)를 NaverNetworkError로 감싸서 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["타임아웃"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverNetworkError,
          `AbortError도 NaverNetworkError로 감싸져야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        return true;
      }
    );
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. NaverHttpError — HTTP 오류 상태
  // ══════════════════════════════════════════════════════════════════════════════

  it("401 응답 시 NaverHttpError(status=401)를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ errorCode: "024", errorMessage: "Not Authorized" }),
        { status: 401 }
      );
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverHttpError,
          `NaverHttpError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.equal((err as NaverHttpError).status, 401);
        return true;
      }
    );
  });

  it("403 응답 시 NaverHttpError(status=403)를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response("Forbidden", { status: 403 });
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(err instanceof NaverHttpError);
        assert.equal((err as NaverHttpError).status, 403);
        return true;
      }
    );
  });

  it("429 응답 시 NaverHttpError(status=429)를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response("Rate limit exceeded", { status: 429 });
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(err instanceof NaverHttpError);
        assert.equal((err as NaverHttpError).status, 429);
        assert.ok(
          (err as Error).message.includes("429"),
          `메시지에 '429'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("500 응답 시 NaverHttpError(status=500)를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response("Internal Server Error", { status: 500 });
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(err instanceof NaverHttpError);
        assert.equal((err as NaverHttpError).status, 500);
        return true;
      }
    );
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. NaverFormatError — 응답 형식 오류
  // ══════════════════════════════════════════════════════════════════════════════

  it("응답 body에 items 배열이 없으면 NaverFormatError를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ total: 0, start: 1, display: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverFormatError,
          `NaverFormatError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        assert.ok(
          (err as Error).message.includes("items"),
          `메시지에 'items'가 포함되어야 합니다. 실제: ${(err as Error).message}`
        );
        return true;
      }
    );
  });

  it("응답 body가 유효하지 않은 JSON이면 NaverFormatError를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response("not valid json }{", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(
          err instanceof NaverFormatError,
          `NaverFormatError여야 합니다. 실제: ${String((err as Error)?.constructor?.name)}`
        );
        return true;
      }
    );
  });

  it("items가 배열이 아닌 값(null)이면 NaverFormatError를 throw한다", async () => {
    setNaverEnv();

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ total: 0, items: null }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    await assert.rejects(
      () => fetchNaverNews({ keywords: ["테스트"], from: FROM, to: TO }),
      (err: unknown) => {
        assert.ok(err instanceof NaverFormatError);
        return true;
      }
    );
  });
});
