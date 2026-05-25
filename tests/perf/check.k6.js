/**
 * k6 부하 테스트 메인 스크립트 — POST /api/check
 *
 * 사용법:
 *   # 로컬 개발 서버 대상 (기본값: http://localhost:3000)
 *   k6 run tests/perf/check.k6.js
 *
 *   # preview / staging 환경 대상
 *   k6 run -e BASE_URL=https://preview.example.com tests/perf/check.k6.js
 *
 *   # dry-run (syntax 검증만, 실제 요청 없음)
 *   k6 run --dry-run tests/perf/check.k6.js
 *
 * SLA 기준: p95 < 5,000ms (검토 엔진 응답 시간)
 * 시나리오: ramping-arrival-rate — 0 RPM → 1,000 RPM (5분 ramp-up + 5분 sustain)
 *
 * 페이로드 가중치:
 *   cache_hit     60% — reviews 캐시 즉시 반환
 *   rule_matching 20% — 고위험 키워드 규칙 매칭
 *   llm_call      20% — LLM 평가 경로 (가장 느림, SLA 핵심 대상)
 */

import http from "k6/http";
import { check } from "k6";

import { selectWeightedPayload } from "./fixtures/payloads.js";
import { stages, thresholds, arrivalRateParams } from "./options.js";

/**
 * k6 테스트 옵션.
 *
 * scenarios: ramping-arrival-rate executor 사용.
 *   - 분당 요청 수(RPM)를 단계적으로 증가시켜 실제 트래픽 패턴을 재현한다.
 *   - timeUnit: '1m' → stages[*].target이 RPM(requests per minute) 단위임.
 *
 * thresholds: SLA 위반 시 k6 exit code 99로 종료.
 *   - CI/CD 파이프라인에서 임계값 초과를 빌드 실패로 처리 가능.
 *
 * @type {import('k6/options').Options}
 */
export const options = {
  scenarios: {
    check_endpoint: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: arrivalRateParams.timeUnit,
      preAllocatedVUs: arrivalRateParams.preAllocatedVUs,
      maxVUs: arrivalRateParams.maxVUs,
      stages,
    },
  },
  thresholds,
};

/**
 * k6 default 함수 — 매 VU 반복마다 실행.
 *
 * 1. 가중치 기반으로 시나리오 페이로드를 선택 (60/20/20 비율).
 * 2. POST /api/check 에 JSON 바디를 전송.
 * 3. 응답 상태 코드와 바디를 검증.
 *
 * check() 실패는 테스트를 중단시키지 않지만,
 * thresholds의 http_req_failed rate가 올라 SLA 위반 시 비빌드 실패로 이어진다.
 */
export default function () {
  const payload = selectWeightedPayload();

  const response = http.post(payload.url, payload.body, {
    headers: {
      "Content-Type": "application/json",
    },
    tags: {
      scenario_type: payload.type,
    },
  });

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response has riskGrade": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.riskGrade !== undefined || body.grade !== undefined;
      } catch {
        return false;
      }
    },
  });
}
