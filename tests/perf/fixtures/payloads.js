/**
 * k6 부하 테스트 페이로드 픽스처
 *
 * POST /api/check 엔드포인트에 대한 3종 시나리오 페이로드를 정의한다.
 * 각 객체는 k6 http.post() 호출에 바로 사용 가능한 형태로 구성된다.
 *
 * 시나리오:
 *   cache_hit     — 동일한 입력을 두 번 보내면 reviews 테이블에서 즉시 반환.
 *                   p95 latency가 가장 낮아야 한다.
 *   rule_matching — 고위험 키워드(탱크) 포함. LLM 호출 없이 F-grade 즉시 반환.
 *                   cache_hit < rule_matching < llm_call 순으로 빨라야 한다.
 *   llm_call      — 안전한 카피. 룰 매칭 통과 → Gemini LLM 호출 경로 진입.
 *                   가장 느린 경로이며, SLA p95 < 5,000ms 검증 대상이다.
 *
 * BASE_URL 우선순위:
 *   1. 환경 변수 __ENV.BASE_URL (k6 실행 시 -e BASE_URL=... 로 주입)
 *   2. process.env.BASE_URL (Node.js 단위 테스트 실행 시)
 *   3. 기본값 http://localhost:3000
 */

const BASE_URL =
  (typeof __ENV !== "undefined" && __ENV.BASE_URL) ||
  (typeof process !== "undefined" && process.env.BASE_URL) ||
  "http://localhost:3000";

const ENDPOINT = `${BASE_URL}/api/check`;

/**
 * @typedef {Object} K6Payload
 * @property {string} url       - 요청 대상 URL
 * @property {string} method    - HTTP 메서드 (항상 "POST")
 * @property {string} body      - JSON.stringify 된 CheckRequest 바디
 * @property {string} type      - 시나리오 식별자 ("cache_hit" | "rule_matching" | "llm_call")
 */

/**
 * cache_hit 시나리오: 한 번 검토된 동일 입력의 재요청.
 * Supabase reviews 테이블 캐시(TTL 7일)에서 즉시 반환.
 *
 * @type {K6Payload}
 */
export const cacheHitPayload = {
  url: ENDPOINT,
  method: "POST",
  body: JSON.stringify({
    date: "2027-05-05",
    campaignName: "어린이날 캐릭터 컬렉션",
    copy: "아이들을 위한 안전하고 따뜻한 신상품",
    assetKeywords: ["어린이", "캐릭터", "선물"],
  }),
  type: "cache_hit",
};

/**
 * rule_matching 시나리오: 고위험 키워드 포함 입력.
 * matchCriticalKeywords() 에서 즉시 F-grade 반환 (LLM 호출 없음).
 *
 * @type {K6Payload}
 */
export const ruleMatchingPayload = {
  url: ENDPOINT,
  method: "POST",
  body: JSON.stringify({
    date: "2027-05-18",
    campaignName: "탱크데이 텀블러",
    copy: "탱크처럼 단단한 신소재 텀블러 — 5·18 특별 에디션",
    assetKeywords: ["탱크", "군복"],
  }),
  type: "rule_matching",
};

/**
 * llm_call 시나리오: 안전한 카피로 LLM 평가 경로 진입.
 * 룰 매칭 통과 → Supabase 이벤트 조회 → Gemini API 호출.
 * p95 < 5,000ms SLA 검증의 핵심 시나리오.
 *
 * @type {K6Payload}
 */
export const llmCallPayload = {
  url: ENDPOINT,
  method: "POST",
  body: JSON.stringify({
    date: "2027-08-15",
    campaignName: "광복절 기념 한정판",
    copy: "대한민국 독립의 정신을 담은 리미티드 에디션 컬렉션",
    assetKeywords: ["태극기", "한복", "독립"],
  }),
  type: "llm_call",
};

/** 세 시나리오 배열 (k6 랜덤 선택 등에 활용) */
export const ALL_PAYLOADS = [cacheHitPayload, ruleMatchingPayload, llmCallPayload];

/**
 * 각 시나리오 페이로드 선택 가중치.
 * 순서: [cache_hit, rule_matching, llm_call]
 * 합계: 1.0
 *
 * cache_hit을 가장 많이(60%) 선택해 캐시 히트율을 현실적으로 모사하고,
 * rule_matching / llm_call 은 각 20%씩 배분한다.
 *
 * @type {number[]}
 */
export const PAYLOAD_WEIGHTS = [0.6, 0.2, 0.2];

/**
 * 가중치 배열을 기반으로 페이로드를 무작위 선택하는 함수.
 *
 * 누적 분포(CDF) 방식을 사용한다:
 *   1. [0, 1) 범위 난수 r 생성
 *   2. 가중치를 순서대로 누적하다가 r < 누적값이 되는 순간 해당 페이로드 반환
 *
 * k6 스크립트와 Node.js 테스트 양쪽에서 호환 가능하도록 Math.random()을 사용.
 * (k6 환경에서는 Math.random이 표준으로 지원됨)
 *
 * @param {K6Payload[]} [payloads=ALL_PAYLOADS]  - 선택 대상 페이로드 배열
 * @param {number[]}    [weights=PAYLOAD_WEIGHTS] - 각 페이로드에 대응하는 가중치 배열 (합계 1.0)
 * @returns {K6Payload} 가중치에 따라 선택된 페이로드
 *
 * @example
 * // 기본 가중치 [0.6, 0.2, 0.2] 사용
 * const payload = selectWeightedPayload();
 *
 * @example
 * // 커스텀 가중치 지정
 * const payload = selectWeightedPayload(ALL_PAYLOADS, [0.5, 0.3, 0.2]);
 */
export function selectWeightedPayload(payloads = ALL_PAYLOADS, weights = PAYLOAD_WEIGHTS) {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < payloads.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) {
      return payloads[i];
    }
  }
  // 부동소수점 오차(예: 0.9999... < 1.0 실패) 방어: 마지막 항목 반환
  return payloads[payloads.length - 1];
}
