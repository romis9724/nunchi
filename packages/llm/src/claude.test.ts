/**
 * Unit tests for parseReviewResponse (LLM 응답 파서)
 *
 * Run: tsx --test src/claude.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseReviewResponse } from "./claude.js";

const FULL_RESULT = {
  grade: "D",
  rationale: "5·18 전후 기간과 겹칩니다.",
  suggestions: ["날짜 조정", "컨셉 재검토"],
  expressionRisk: [
    {
      key: "region.hongeo",
      disposition: "benign",
      rationale: "음식 명칭으로 쓰였습니다.",
      alternative: "홍어 정식",
    },
  ],
};

describe("parseReviewResponse — JSON 추출", () => {
  it("parses a fenced ```json block", () => {
    const result = parseReviewResponse(
      "분석했습니다.\n```json\n" + JSON.stringify(FULL_RESULT) + "\n```\n끝."
    );

    assert.equal(result.grade, "D");
    assert.deepEqual(result.suggestions, ["날짜 조정", "컨셉 재검토"]);
    assert.equal(result.expressionRisk?.length, 1);
  });

  it("parses unfenced JSON containing nested objects (lazy-match regression)", () => {
    // 과거 fallback 정규식 `(\{[\s\S]*?\})` 은 중첩 객체의 첫 `}` 에서 끊겨
    // 파싱에 실패하고 C 등급으로 떨어졌다.
    const result = parseReviewResponse(
      "결과는 다음과 같습니다 " + JSON.stringify(FULL_RESULT)
    );

    assert.equal(result.grade, "D");
    assert.equal(result.rationale, FULL_RESULT.rationale);
    assert.deepEqual(result.expressionRisk, [FULL_RESULT.expressionRisk[0]]);
  });

  it("falls back to C when the response has no JSON at all", () => {
    const result = parseReviewResponse("죄송합니다. 판단할 수 없습니다.");

    assert.equal(result.grade, "C");
    assert.deepEqual(result.suggestions, []);
    assert.deepEqual(result.expressionRisk, []);
  });

  it("falls back to C when the JSON is malformed", () => {
    const result = parseReviewResponse('{"grade": "D", ');

    assert.equal(result.grade, "C");
    assert.deepEqual(result.expressionRisk, []);
  });
});

describe("parseReviewResponse — 기존 필드 동작 유지", () => {
  it("downgrades an unknown grade to C", () => {
    assert.equal(parseReviewResponse('{"grade":"S"}').grade, "C");
  });

  it("returns an empty array when suggestions is not an array", () => {
    assert.deepEqual(parseReviewResponse('{"grade":"B","suggestions":"없음"}').suggestions, []);
  });

  it("returns an empty rationale when the field is missing", () => {
    assert.equal(parseReviewResponse('{"grade":"B"}').rationale, "");
  });
});

describe("parseReviewResponse — expressionRisk 정규화", () => {
  it("returns an empty array when expressionRisk is missing or not an array", () => {
    assert.deepEqual(parseReviewResponse('{"grade":"B"}').expressionRisk, []);
    assert.deepEqual(
      parseReviewResponse('{"grade":"B","expressionRisk":"없음"}').expressionRisk,
      []
    );
  });

  it("normalizes an unknown disposition to uncertain", () => {
    const result = parseReviewResponse(
      '{"grade":"B","expressionRisk":[{"key":"a","disposition":"maybe","rationale":"r"}]}'
    );
    assert.deepEqual(result.expressionRisk, [
      { key: "a", disposition: "uncertain", rationale: "r" },
    ]);
  });

  it("drops entries without a usable key", () => {
    const result = parseReviewResponse(
      '{"grade":"B","expressionRisk":[{"disposition":"harmful"},{"key":"  "},"nope",null,{"key":"ok","disposition":"harmful"}]}'
    );
    assert.deepEqual(result.expressionRisk, [
      { key: "ok", disposition: "harmful", rationale: "" },
    ]);
  });

  it("omits alternative when it is blank or not a string", () => {
    const result = parseReviewResponse(
      '{"grade":"B","expressionRisk":[{"key":"a","disposition":"harmful","rationale":"r","alternative":"  "},{"key":"b","disposition":"harmful","rationale":"r","alternative":7}]}'
    );
    assert.deepEqual(result.expressionRisk, [
      { key: "a", disposition: "harmful", rationale: "r" },
      { key: "b", disposition: "harmful", rationale: "r" },
    ]);
  });

  it("keeps all three valid dispositions as-is", () => {
    const result = parseReviewResponse(
      '{"grade":"B","expressionRisk":[{"key":"a","disposition":"harmful","rationale":""},{"key":"b","disposition":"benign","rationale":""},{"key":"c","disposition":"uncertain","rationale":""}]}'
    );
    assert.deepEqual(
      result.expressionRisk?.map((r) => r.disposition),
      ["harmful", "benign", "uncertain"]
    );
  });
});
