/**
 * k6 부하 테스트 옵션 모듈
 *
 * POST /api/check 엔드포인트에 대한 1000 RPM 부하 시나리오 정의.
 * ramping-arrival-rate executor 기준:
 *   - ramp-up 5분: 0 RPM → 1000 RPM
 *   - sustain 5분: 1000 RPM 유지
 *
 * 이 모듈은 k6 스크립트(check.k6.js)와 Node.js 단위 테스트 양쪽에서
 * import 가능하도록 ESM export 형태로 작성한다.
 *
 * SLA: p95 < 5,000ms (검토 엔진 응답 시간 기준)
 */

/**
 * ramping-arrival-rate stages 배열.
 *
 * duration: k6 시간 표기법 — '5m' = 5분.
 * target: 해당 단계 종료 시 목표 RPS(requests per second 가 아닌 RPM).
 *         timeUnit: '1m' 과 함께 사용할 경우 1분당 요청 수를 뜻한다.
 *
 * @type {Array<{duration: string, target: number}>}
 */
export const stages = [
  /** 0 RPM → 1000 RPM: 5분에 걸쳐 선형 증가 */
  { duration: "5m", target: 1000 },
  /** 1000 RPM 유지: 5분 지속 */
  { duration: "5m", target: 1000 },
];

/**
 * k6 thresholds 객체.
 *
 * http_req_duration: 응답 시간 분위수 임계값
 *   - p(50) < 2000ms  — 중앙값 2초 이내
 *   - p(95) < 5000ms  — SLA: 95번째 백분위 5초 이내
 *   - p(99) < 10000ms — 99번째 백분위 10초 이내 (서킷브레이커 기준)
 *
 * http_req_failed: 에러율 임계값
 *   - rate < 0.01     — 요청 실패율 1% 미만
 *
 * 표현식 형식: k6 threshold 문법 — "메트릭 연산자 값"
 *   p(N)<ms, rate<비율
 *
 * @type {Record<string, string[]>}
 */
export const thresholds = {
  /** 응답 시간 분위수 임계값 */
  http_req_duration: [
    "p(50)<2000",
    "p(95)<5000",
    "p(99)<10000",
  ],
  /** 요청 실패율 임계값 */
  http_req_failed: [
    "rate<0.01",
  ],
};

/**
 * ramping-arrival-rate 시나리오 파라미터.
 *
 * preAllocatedVUs: 시나리오 시작 시 미리 생성할 VU 수.
 *   1000 RPM / 60 ≈ 16.7 RPS, 평균 응답 200ms → 동시 VU ≈ 4.
 *   여유분 포함 50 VU 사전 할당.
 * maxVUs: 최대 VU 상한. 지연이 길어져도 VU가 무한 증가하지 않도록 제한.
 * timeUnit: stages[*].target 해석 단위. '1m' = 분당 요청 수 (RPM).
 *
 * @type {{ preAllocatedVUs: number, maxVUs: number, timeUnit: string }}
 */
export const arrivalRateParams = {
  preAllocatedVUs: 50,
  maxVUs: 200,
  timeUnit: "1m",
};
