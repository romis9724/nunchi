/**
 * 단위 테스트: tests/perf/fixtures/payloads.js
 *
 * 각 페이로드 객체를 import하여 k6 POST 요청에 필요한 필수 필드의
 * 존재 여부와 타입을 검증한다.
 *
 * 검증 항목:
 *   - url      : string, http(s):// 로 시작
 *   - method   : "POST" 리터럴
 *   - body     : string, 파싱 가능한 JSON, CheckRequest 필수 필드(date, copy) 포함
 *   - type     : 알려진 시나리오 식별자 ("cache_hit" | "rule_matching" | "llm_call")
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cacheHitPayload,
  ruleMatchingPayload,
  llmCallPayload,
  ALL_PAYLOADS,
  PAYLOAD_WEIGHTS,
  selectWeightedPayload,
} from "./payloads.js";

type ScenarioType = "cache_hit" | "rule_matching" | "llm_call";

interface K6Payload {
  url: string;
  method: string;
  body: string;
  type: ScenarioType;
}

const KNOWN_TYPES: ScenarioType[] = ["cache_hit", "rule_matching", "llm_call"];

function assertPayload(payload: unknown, expectedType: ScenarioType): void {
  assert.ok(payload !== null && typeof payload === "object", "페이로드는 객체여야 한다");

  const p = payload as K6Payload;

  // url 검증
  assert.strictEqual(typeof p.url, "string", `url은 string 타입이어야 한다 (type=${expectedType})`);
  assert.ok(p.url.length > 0, `url은 빈 문자열이면 안 된다 (type=${expectedType})`);
  assert.ok(
    p.url.startsWith("http://") || p.url.startsWith("https://"),
    `url은 http(s):// 로 시작해야 한다 (got: ${p.url})`,
  );

  // method 검증
  assert.strictEqual(typeof p.method, "string", `method는 string 타입이어야 한다 (type=${expectedType})`);
  assert.strictEqual(p.method, "POST", `method는 정확히 "POST" 이어야 한다 (got: ${p.method})`);

  // body 검증: JSON 파싱 가능 + CheckRequest 필수 필드
  assert.strictEqual(typeof p.body, "string", `body는 string 타입이어야 한다 (type=${expectedType})`);
  assert.ok(p.body.length > 0, `body는 빈 문자열이면 안 된다 (type=${expectedType})`);

  let parsed: unknown;
  assert.doesNotThrow(
    () => { parsed = JSON.parse(p.body); },
    `body는 유효한 JSON이어야 한다 (type=${expectedType})`,
  );

  const req = parsed as Record<string, unknown>;
  assert.strictEqual(typeof req.date, "string", `body.date는 string 타입이어야 한다 (type=${expectedType})`);
  assert.ok(req.date.length > 0, `body.date는 빈 문자열이면 안 된다`);
  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(req.date as string),
    `body.date는 YYYY-MM-DD 형식이어야 한다 (got: ${req.date})`,
  );

  assert.strictEqual(typeof req.copy, "string", `body.copy는 string 타입이어야 한다 (type=${expectedType})`);
  assert.ok((req.copy as string).trim().length > 0, `body.copy는 공백만으로 구성되면 안 된다`);

  // type 식별자 검증
  assert.strictEqual(typeof p.type, "string", `type은 string 타입이어야 한다`);
  assert.ok(
    KNOWN_TYPES.includes(p.type as ScenarioType),
    `type은 알려진 식별자(${KNOWN_TYPES.join(" | ")}) 중 하나여야 한다 (got: ${p.type})`,
  );
  assert.strictEqual(p.type, expectedType, `type 식별자가 예상 값과 일치해야 한다`);
}

describe("payloads fixtures: 필수 필드 존재·타입 검증", () => {
  it("cacheHitPayload — 필수 필드 검증", () => {
    assertPayload(cacheHitPayload, "cache_hit");
  });

  it("ruleMatchingPayload — 필수 필드 검증", () => {
    assertPayload(ruleMatchingPayload, "rule_matching");
  });

  it("llmCallPayload — 필수 필드 검증", () => {
    assertPayload(llmCallPayload, "llm_call");
  });
});

describe("payloads fixtures: 시나리오별 의미 검증", () => {
  it("cacheHitPayload — 고위험 키워드 없는 안전한 카피", () => {
    const req = JSON.parse(cacheHitPayload.body) as Record<string, unknown>;
    // cache_hit는 안전한 카피여야 캐시 재사용 시나리오로 의미 있음
    const combined = `${req.campaignName ?? ""} ${req.copy ?? ""} ${(req.assetKeywords as string[] | undefined ?? []).join(" ")}`;
    const CRITICAL_TRIGGERS = ["탱크", "세월호", "발포", "신군부", "이태원", "욱일기", "위안부", "강제징용"];
    for (const kw of CRITICAL_TRIGGERS) {
      assert.ok(!combined.includes(kw), `cache_hit 페이로드에 고위험 키워드 "${kw}"가 포함되어서는 안 된다`);
    }
  });

  it("ruleMatchingPayload — body에 룰 트리거 키워드 포함", () => {
    const req = JSON.parse(ruleMatchingPayload.body) as Record<string, unknown>;
    const combined = `${req.campaignName ?? ""} ${req.copy ?? ""} ${(req.assetKeywords as string[] | undefined ?? []).join(" ")}`;
    // 탱크 키워드가 포함되어야 rule-matching 경로로 진입 가능
    assert.ok(combined.includes("탱크"), "rule_matching 페이로드는 '탱크' 키워드를 포함해야 한다");
  });

  it("llmCallPayload — 고위험 키워드 없이 비어있지 않은 카피", () => {
    const req = JSON.parse(llmCallPayload.body) as Record<string, unknown>;
    const combined = `${req.campaignName ?? ""} ${req.copy ?? ""}`;
    const IMMEDIATE_CRITICAL = ["탱크", "세월호", "발포", "신군부", "욱일기"];
    for (const kw of IMMEDIATE_CRITICAL) {
      assert.ok(!combined.includes(kw), `llm_call 페이로드에 즉각 차단 키워드 "${kw}"가 포함되면 안 된다`);
    }
    assert.ok(combined.trim().length > 0, "llm_call 페이로드의 카피는 비어있으면 안 된다");
  });
});

describe("selectWeightedPayload: 통계적 가중치 분포 검증 (N=1000)", () => {
  it("N=1000회 실행 시 각 페이로드 선택 빈도가 기대 비율 ±5% 이내여야 한다", () => {
    const N = 1000;
    const TOLERANCE = 0.05;

    // 카운터 초기화
    const counts: Record<ScenarioType, number> = {
      cache_hit: 0,
      rule_matching: 0,
      llm_call: 0,
    };

    // N회 선택 실행
    for (let i = 0; i < N; i++) {
      const selected = selectWeightedPayload();
      counts[selected.type as ScenarioType] += 1;
    }

    // 각 시나리오 빈도 검증
    const orderedTypes: ScenarioType[] = ["cache_hit", "rule_matching", "llm_call"];
    for (let i = 0; i < orderedTypes.length; i++) {
      const type = orderedTypes[i];
      const expectedWeight = PAYLOAD_WEIGHTS[i];
      const actualRatio = counts[type] / N;
      const diff = Math.abs(actualRatio - expectedWeight);

      assert.ok(
        diff <= TOLERANCE,
        [
          `"${type}" 선택 빈도 ${(actualRatio * 100).toFixed(2)}%가`,
          `기대값 ${(expectedWeight * 100).toFixed(0)}% ±${(TOLERANCE * 100).toFixed(0)}% 범위를 벗어났다`,
          `(실제=${counts[type]}/${N}, diff=${(diff * 100).toFixed(2)}%)`,
        ].join(" "),
      );
    }
  });

  it("PAYLOAD_WEIGHTS 합계가 정확히 1.0이어야 한다", () => {
    const sum = PAYLOAD_WEIGHTS.reduce((acc, w) => acc + w, 0);
    assert.ok(
      Math.abs(sum - 1.0) < 1e-9,
      `PAYLOAD_WEIGHTS 합계는 1.0이어야 한다 (got: ${sum})`,
    );
  });

  it("PAYLOAD_WEIGHTS와 ALL_PAYLOADS 길이가 일치해야 한다", () => {
    assert.strictEqual(
      PAYLOAD_WEIGHTS.length,
      ALL_PAYLOADS.length,
      `PAYLOAD_WEIGHTS 길이(${PAYLOAD_WEIGHTS.length})와 ALL_PAYLOADS 길이(${ALL_PAYLOADS.length})가 달라서는 안 된다`,
    );
  });

  it("selectWeightedPayload 반환값은 ALL_PAYLOADS 중 하나여야 한다", () => {
    for (let i = 0; i < 100; i++) {
      const selected = selectWeightedPayload();
      assert.ok(
        ALL_PAYLOADS.includes(selected as (typeof ALL_PAYLOADS)[number]),
        `selectWeightedPayload()가 ALL_PAYLOADS에 없는 객체를 반환했다 (type=${(selected as { type: string }).type})`,
      );
    }
  });
});

describe("payloads fixtures: ALL_PAYLOADS 배열 검증", () => {
  it("ALL_PAYLOADS는 정확히 3개 항목을 포함해야 한다", () => {
    assert.strictEqual(ALL_PAYLOADS.length, 3, `ALL_PAYLOADS 길이는 3이어야 한다 (got: ${ALL_PAYLOADS.length})`);
  });

  it("ALL_PAYLOADS의 type 식별자는 모두 유일해야 한다", () => {
    const types = ALL_PAYLOADS.map((p) => p.type);
    const uniqueTypes = new Set(types);
    assert.strictEqual(
      uniqueTypes.size,
      ALL_PAYLOADS.length,
      `ALL_PAYLOADS type 식별자에 중복이 있다: ${JSON.stringify(types)}`,
    );
  });

  it("ALL_PAYLOADS는 3종 식별자를 모두 포함해야 한다", () => {
    const types = new Set(ALL_PAYLOADS.map((p) => p.type));
    for (const expected of KNOWN_TYPES) {
      assert.ok(types.has(expected), `ALL_PAYLOADS에 "${expected}" 시나리오가 없다`);
    }
  });

  it("ALL_PAYLOADS 각 항목은 필수 필드를 모두 갖춰야 한다", () => {
    for (const payload of ALL_PAYLOADS) {
      assertPayload(payload, payload.type);
    }
  });
});
