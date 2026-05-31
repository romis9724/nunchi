/**
 * naverNewsClient — 네이버 뉴스 검색 API HTTP 클라이언트 (Sub-AC 14a)
 *
 * 날짜 범위·키워드를 인자로 받아 네이버 뉴스 검색 API를 호출하고
 * 원시 기사 배열(NaverNewsItem[])을 반환하는 단일 함수.
 *
 * Constraints:
 * - NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수 사용
 * - 날짜 필터링: 응답 items의 pubDate를 파싱하여 from/to 범위 내 기사만 반환
 * - 항상 throw on failure; 상위 호출자가 try/catch로 처리
 */

const NAVER_NEWS_API_URL = "https://openapi.naver.com/v1/search/news.json";

/** 네이버 뉴스 검색 API 단일 기사 항목 */
export interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

/** fetchNaverNews 입력 파라미터 */
export interface NaverNewsParams {
  /** 검색 키워드 배열; 공백으로 조인되어 쿼리로 전달됨 */
  keywords: string[];
  /** 날짜 범위 시작 (포함) */
  from: Date;
  /** 날짜 범위 끝 (포함) */
  to: Date;
  /** 페이지 당 결과 수 (1-100, 기본값 100) */
  display?: number;
}

/** fetchNaverNews 클라이언트 옵션 */
export interface NaverNewsClientOptions {
  /** 네이버 개발자 센터 Client ID (기본값: NAVER_CLIENT_ID 환경변수) */
  clientId?: string;
  /** 네이버 개발자 센터 Client Secret (기본값: NAVER_CLIENT_SECRET 환경변수) */
  clientSecret?: string;
  /** 요청 타임아웃(ms) (기본값: 15000) */
  timeoutMs?: number;
}

/**
 * 네이버 뉴스 검색 API를 호출하여 날짜 범위 내 원시 기사 배열을 반환한다.
 *
 * Throws:
 *  - NaverConfigError    NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 누락 시
 *  - NaverNetworkError   fetch() 자체 실패 시 (연결 거부, 타임아웃, DNS 오류)
 *  - NaverHttpError      HTTP 오류 상태 (4xx / 5xx) 수신 시
 *  - NaverFormatError    응답 본문이 유효하지 않거나 items 배열 누락 시
 */
export async function fetchNaverNews(
  params: NaverNewsParams,
  options: NaverNewsClientOptions = {}
): Promise<NaverNewsItem[]> {
  const clientId = options.clientId ?? process.env.NAVER_CLIENT_ID;
  const clientSecret = options.clientSecret ?? process.env.NAVER_CLIENT_SECRET;
  const display = params.display ?? 100;
  const timeoutMs = options.timeoutMs ?? 15_000;

  // ── 0. Config validation ──────────────────────────────────────────────────────
  if (!clientId) {
    throw new NaverConfigError(
      "NAVER_CLIENT_ID is required for Naver News API"
    );
  }
  if (!clientSecret) {
    throw new NaverConfigError(
      "NAVER_CLIENT_SECRET is required for Naver News API"
    );
  }

  // ── 1. Build request URL ──────────────────────────────────────────────────────
  const query = params.keywords.join(" ");
  const url = new URL(NAVER_NEWS_API_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("sort", "date");

  // ── 2. Network call ───────────────────────────────────────────────────────────
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new NaverNetworkError(
      `Naver News API network error: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  // ── 3. HTTP status ────────────────────────────────────────────────────────────
  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable body)");
    throw new NaverHttpError(
      `Naver News API HTTP error: ${res.status} ${errText}`,
      res.status
    );
  }

  // ── 4. JSON parsing ───────────────────────────────────────────────────────────
  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    throw new NaverFormatError(
      `Naver News API response JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  // ── 5. Shape validation ───────────────────────────────────────────────────────
  const items = (data as Record<string, unknown>)?.items;
  if (!Array.isArray(items)) {
    throw new NaverFormatError(
      `Naver News API response missing 'items' array. Got: ${JSON.stringify(data)}`
    );
  }

  // ── 6. Date range filtering ───────────────────────────────────────────────────
  const fromMs = params.from.getTime();
  const toMs = params.to.getTime();

  return (items as NaverNewsItem[]).filter((item) => {
    const pubMs = new Date(item.pubDate).getTime();
    return !isNaN(pubMs) && pubMs >= fromMs && pubMs <= toMs;
  });
}

// ── Typed error classes ────────────────────────────────────────────────────────

/** NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 누락 시 발생 */
export class NaverConfigError extends Error {
  override readonly name = "NaverConfigError";
  constructor(message: string) {
    super(message);
  }
}

/** fetch() 자체 실패 시 발생 (네트워크 불가, 타임아웃, DNS) */
export class NaverNetworkError extends Error {
  override readonly name = "NaverNetworkError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/** 네이버 API가 4xx / 5xx HTTP 상태를 반환할 때 발생 */
export class NaverHttpError extends Error {
  override readonly name = "NaverHttpError";
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** 응답 본문이 유효하지 않거나 items 배열이 없을 때 발생 */
export class NaverFormatError extends Error {
  override readonly name = "NaverFormatError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
