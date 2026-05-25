/**
 * 단위 테스트: tests/perf/options.js
 *
 * 검증 항목:
 *   1. stages 배열 — 길이 2, 각 항목의 duration('5m')·target(1000) 값
 *   2. thresholds 객체 — http_req_duration / http_req_failed 키 존재,
 *      각 표현식 문자열이 k6 threshold 형식("p(N)<ms" 또는 "rate<ratio")을 준수
 *   3. p95 임계값 5,000ms (SLA 정의 일치)
 *   4. error rate 임계값 0.01 미만
 *   5. arrivalRateParams — timeUnit '1m', preAllocatedVUs > 0, maxVUs > preAllocatedVUs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stages, thresholds, arrivalRateParams } from "./options.js";

// ──────────────────────────────────────────────────────────────
// 1. stages 배열 검증
// ──────────────────────────────────────────────────────────────
describe("stages: 구조 및 값 검증", () => {
  it("stages는 배열이어야 한다", () => {
    assert.ok(Array.isArray(stages), "stages는 Array 타입이어야 한다");
  });

  it("stages는 정확히 2개 항목을 포함해야 한다 (ramp-up + sustain)", () => {
    assert.strictEqual(stages.length, 2, `stages 길이는 2여야 한다 (got: ${stages.length})`);
  });

  it("stages[0] — ramp-up: duration '5m'", () => {
    assert.strictEqual(
      stages[0].duration,
      "5m",
      `stages[0].duration은 '5m'이어야 한다 (got: ${stages[0].duration})`,
    );
  });

  it("stages[0] — ramp-up: target 1000 (RPM 목표)", () => {
    assert.strictEqual(
      stages[0].target,
      1000,
      `stages[0].target은 1000이어야 한다 (got: ${stages[0].target})`,
    );
  });

  it("stages[1] — sustain: duration '5m'", () => {
    assert.strictEqual(
      stages[1].duration,
      "5m",
      `stages[1].duration은 '5m'이어야 한다 (got: ${stages[1].duration})`,
    );
  });

  it("stages[1] — sustain: target 1000 (RPM 유지)", () => {
    assert.strictEqual(
      stages[1].target,
      1000,
      `stages[1].target은 1000이어야 한다 (got: ${stages[1].target})`,
    );
  });

  it("stages 각 항목은 duration과 target 필드만 포함해야 한다", () => {
    for (let i = 0; i < stages.length; i++) {
      const keys = Object.keys(stages[i]);
      assert.ok(
        keys.includes("duration"),
        `stages[${i}]에 'duration' 필드가 없다 (keys: ${keys.join(", ")})`,
      );
      assert.ok(
        keys.includes("target"),
        `stages[${i}]에 'target' 필드가 없다 (keys: ${keys.join(", ")})`,
      );
      assert.strictEqual(typeof stages[i].duration, "string", `stages[${i}].duration은 string이어야 한다`);
      assert.strictEqual(typeof stages[i].target, "number", `stages[${i}].target은 number여야 한다`);
    }
  });

  it("stages 총 시간은 10분(5분 ramp-up + 5분 sustain)이어야 한다", () => {
    // duration 값이 모두 '5m' 형식이므로 파싱해서 합산
    const totalMinutes = stages.reduce((sum, s) => {
      const match = s.duration.match(/^(\d+)m$/);
      assert.ok(match, `duration '${s.duration}'은 '숫자m' 형식이어야 한다`);
      return sum + parseInt(match![1], 10);
    }, 0);
    assert.strictEqual(totalMinutes, 10, `총 테스트 시간은 10분이어야 한다 (got: ${totalMinutes}분)`);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. thresholds 구조 검증
// ──────────────────────────────────────────────────────────────
describe("thresholds: 최상위 구조 검증", () => {
  it("thresholds는 객체여야 한다", () => {
    assert.ok(
      thresholds !== null && typeof thresholds === "object" && !Array.isArray(thresholds),
      "thresholds는 plain object여야 한다",
    );
  });

  it("thresholds는 'http_req_duration' 키를 포함해야 한다", () => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(thresholds, "http_req_duration"),
      "thresholds에 'http_req_duration' 키가 없다",
    );
  });

  it("thresholds는 'http_req_failed' 키를 포함해야 한다", () => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(thresholds, "http_req_failed"),
      "thresholds에 'http_req_failed' 키가 없다",
    );
  });

  it("thresholds['http_req_duration']은 배열이어야 한다", () => {
    assert.ok(
      Array.isArray(thresholds.http_req_duration),
      "thresholds.http_req_duration은 배열이어야 한다",
    );
  });

  it("thresholds['http_req_failed']은 배열이어야 한다", () => {
    assert.ok(
      Array.isArray(thresholds.http_req_failed),
      "thresholds.http_req_failed은 배열이어야 한다",
    );
  });
});

// ──────────────────────────────────────────────────────────────
// 3. threshold 표현식 문자열 형식 검증
// ──────────────────────────────────────────────────────────────
/** k6 threshold 표현식 정규식 */
const PERCENTILE_EXPR_RE = /^p\(\d{1,3}\)<\d+$/;
const RATE_EXPR_RE = /^rate<[\d.]+$/;

describe("thresholds: http_req_duration 표현식 형식 검증", () => {
  it("http_req_duration의 모든 표현식은 'p(N)<ms' 형식이어야 한다", () => {
    for (const expr of thresholds.http_req_duration) {
      assert.match(
        expr,
        PERCENTILE_EXPR_RE,
        `표현식 '${expr}'은 'p(N)<ms' 형식(예: p(95)<5000)이어야 한다`,
      );
    }
  });

  it("http_req_duration에 p(50) 임계값이 있어야 한다", () => {
    const hasP50 = thresholds.http_req_duration.some((e) => e.startsWith("p(50)<"));
    assert.ok(hasP50, "http_req_duration에 p(50) 임계값이 없다");
  });

  it("http_req_duration에 p(95) 임계값이 있어야 한다 (SLA)", () => {
    const hasP95 = thresholds.http_req_duration.some((e) => e.startsWith("p(95)<"));
    assert.ok(hasP95, "http_req_duration에 p(95) 임계값이 없다");
  });

  it("http_req_duration에 p(99) 임계값이 있어야 한다", () => {
    const hasP99 = thresholds.http_req_duration.some((e) => e.startsWith("p(99)<"));
    assert.ok(hasP99, "http_req_duration에 p(99) 임계값이 없다");
  });

  it("p(95) 임계값은 정확히 5,000ms여야 한다 (SLA)", () => {
    const p95Expr = thresholds.http_req_duration.find((e) => e.startsWith("p(95)<"));
    assert.ok(p95Expr, "p(95) 임계값 표현식을 찾을 수 없다");
    const ms = parseInt(p95Expr!.replace("p(95)<", ""), 10);
    assert.strictEqual(ms, 5000, `p(95) 임계값은 5000ms여야 한다 (got: ${ms}ms)`);
  });

  it("p(50) 임계값은 5,000ms보다 작아야 한다 (p50 < p95 순서 논리)", () => {
    const p50Expr = thresholds.http_req_duration.find((e) => e.startsWith("p(50)<"));
    const p95Expr = thresholds.http_req_duration.find((e) => e.startsWith("p(95)<"));
    assert.ok(p50Expr && p95Expr, "p50/p95 표현식이 모두 존재해야 비교 가능");
    const p50ms = parseInt(p50Expr!.replace("p(50)<", ""), 10);
    const p95ms = parseInt(p95Expr!.replace("p(95)<", ""), 10);
    assert.ok(p50ms < p95ms, `p50(${p50ms}ms)은 p95(${p95ms}ms)보다 작아야 한다`);
  });

  it("p(95) 임계값은 p(99) 임계값보다 작아야 한다", () => {
    const p95Expr = thresholds.http_req_duration.find((e) => e.startsWith("p(95)<"));
    const p99Expr = thresholds.http_req_duration.find((e) => e.startsWith("p(99)<"));
    assert.ok(p95Expr && p99Expr, "p95/p99 표현식이 모두 존재해야 비교 가능");
    const p95ms = parseInt(p95Expr!.replace("p(95)<", ""), 10);
    const p99ms = parseInt(p99Expr!.replace("p(99)<", ""), 10);
    assert.ok(p95ms < p99ms, `p95(${p95ms}ms)은 p99(${p99ms}ms)보다 작아야 한다`);
  });
});

describe("thresholds: http_req_failed 표현식 형식 검증", () => {
  it("http_req_failed의 모든 표현식은 'rate<ratio' 형식이어야 한다", () => {
    for (const expr of thresholds.http_req_failed) {
      assert.match(
        expr,
        RATE_EXPR_RE,
        `표현식 '${expr}'은 'rate<ratio' 형식(예: rate<0.01)이어야 한다`,
      );
    }
  });

  it("error rate 임계값은 0.01(1%) 미만이어야 한다", () => {
    for (const expr of thresholds.http_req_failed) {
      const ratio = parseFloat(expr.replace("rate<", ""));
      assert.ok(
        ratio <= 0.01,
        `error rate 임계값 ${ratio}은 0.01 이하여야 한다 (표현식: '${expr}')`,
      );
    }
  });

  it("http_req_failed에 최소 1개 임계값이 있어야 한다", () => {
    assert.ok(
      thresholds.http_req_failed.length >= 1,
      "http_req_failed에 최소 1개의 임계값이 있어야 한다",
    );
  });
});

// ──────────────────────────────────────────────────────────────
// 4. arrivalRateParams 검증
// ──────────────────────────────────────────────────────────────
describe("arrivalRateParams: ramping-arrival-rate 파라미터 검증", () => {
  it("timeUnit은 '1m'이어야 한다 (RPM 기준)", () => {
    assert.strictEqual(
      arrivalRateParams.timeUnit,
      "1m",
      `timeUnit은 '1m'이어야 한다 (got: '${arrivalRateParams.timeUnit}')`,
    );
  });

  it("preAllocatedVUs는 양의 정수여야 한다", () => {
    assert.ok(
      Number.isInteger(arrivalRateParams.preAllocatedVUs) && arrivalRateParams.preAllocatedVUs > 0,
      `preAllocatedVUs는 양의 정수여야 한다 (got: ${arrivalRateParams.preAllocatedVUs})`,
    );
  });

  it("maxVUs는 preAllocatedVUs보다 크거나 같아야 한다", () => {
    assert.ok(
      arrivalRateParams.maxVUs >= arrivalRateParams.preAllocatedVUs,
      `maxVUs(${arrivalRateParams.maxVUs})는 preAllocatedVUs(${arrivalRateParams.preAllocatedVUs}) 이상이어야 한다`,
    );
  });
});
