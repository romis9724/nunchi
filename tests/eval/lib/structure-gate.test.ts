/**
 * Stage-0 (local, pure): structure-gate
 *
 * Drives evaluateStructure with hand-built fake CheckResponses to prove the
 * hard-oracle pass/fail logic and the soft-warning separation. No DB / LLM.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { CheckResponse, MatchedEvent } from "@noonchi/shared";

import type { EvalCase } from "./generate-cases.js";
import { evaluateStructure } from "./structure-gate.js";

function matchedEvent(slug: string, grade: MatchedEvent["grade"]): MatchedEvent {
  return {
    id: slug,
    slug,
    name: slug,
    riskLevel: "low",
    grade,
    summary: "",
    recommendedTone: "neutral",
    references: [],
  };
}

function baseResponse(over: Partial<CheckResponse>): CheckResponse {
  return {
    grade: "C",
    riskScore: "caution",
    flaggedKeywords: [],
    matchedEvents: [],
    rationale: "",
    suggestions: [],
    ruleTriggered: false,
    cached: false,
    ...over,
  };
}

const ruleCoveredBanned: EvalCase = {
  id: "x::banned",
  eventSlug: "gwangju-uprising-0518",
  kind: "banned",
  request: { date: "2025-05-18", copy: "탱크 신상", assetKeywords: [] },
  oracle: {
    ruleTriggered: true,
    grade: "F",
    riskScore: "critical",
    flaggedKeywordsInclude: ["탱크"],
    matchedEventsEmpty: true,
  },
  qualitative: { applicable: false },
};

const benignCase: EvalCase = {
  id: "y::benign",
  eventSlug: "pepero-day-1111",
  kind: "benign",
  request: { date: "2025-11-11", copy: "신메뉴 출시 소식", assetKeywords: [] },
  oracle: {
    ruleTriggered: false,
    flaggedKeywordsEmpty: true,
    matchedEventsInclude: "pepero-day-1111",
    matchedEventGrade: { slug: "pepero-day-1111", grade: "A" },
  },
  qualitative: { applicable: true, mustIdentifyEvent: "빼빼로데이" },
};

const ruleGapBanned: EvalCase = {
  id: "z::banned",
  eventSlug: "pepero-day-1111",
  kind: "banned",
  request: { date: "2025-11-11", copy: "빼빼로 신상", assetKeywords: [] },
  oracle: {
    ruleTriggered: false,
    flaggedKeywordsEmpty: true,
    matchedEventsInclude: "pepero-day-1111",
  },
  qualitative: {
    applicable: true,
    mustIdentifyEvent: "빼빼로데이",
    llmShouldFlagGradeIn: ["F", "D", "C"],
  },
};

describe("structure-gate: rule-covered banned", () => {
  it("passes when engine forces F/critical with the flagged keyword", () => {
    const res = baseResponse({
      grade: "F",
      riskScore: "critical",
      flaggedKeywords: ["탱크"],
      matchedEvents: [],
      ruleTriggered: true,
    });
    const r = evaluateStructure(ruleCoveredBanned, res);
    assert.strictEqual(r.pass, true, JSON.stringify(r.failures));
    assert.deepStrictEqual(r.failures, []);
  });

  it("fails when rule did not trigger and grade is wrong", () => {
    const res = baseResponse({
      grade: "C",
      riskScore: "caution",
      flaggedKeywords: [],
      ruleTriggered: false,
    });
    const r = evaluateStructure(ruleCoveredBanned, res);
    assert.strictEqual(r.pass, false);
    assert.ok(r.failures.some((f) => f.includes("ruleTriggered")));
    assert.ok(r.failures.some((f) => f.includes("grade")));
    assert.ok(r.failures.some((f) => f.includes("flaggedKeywords")));
  });

  it("fails when matchedEvents is not empty on a rule short-circuit", () => {
    const res = baseResponse({
      grade: "F",
      riskScore: "critical",
      flaggedKeywords: ["탱크"],
      matchedEvents: [matchedEvent("gwangju-uprising-0518", "F")],
      ruleTriggered: true,
    });
    const r = evaluateStructure(ruleCoveredBanned, res);
    assert.strictEqual(r.pass, false);
    assert.ok(r.failures.some((f) => f.includes("matchedEvents expected empty")));
  });
});

describe("structure-gate: benign", () => {
  it("passes when the event is surfaced with the deterministic grade", () => {
    const res = baseResponse({
      grade: "A",
      riskScore: "safe",
      matchedEvents: [matchedEvent("pepero-day-1111", "A")],
    });
    const r = evaluateStructure(benignCase, res);
    assert.strictEqual(r.pass, true, JSON.stringify(r.failures));
  });

  it("fails when the matched event grade diverges from toneToGrade", () => {
    const res = baseResponse({
      grade: "A",
      matchedEvents: [matchedEvent("pepero-day-1111", "C")],
    });
    const r = evaluateStructure(benignCase, res);
    assert.strictEqual(r.pass, false);
    assert.ok(r.failures.some((f) => f.includes("matchedEventGrade")));
  });

  it("fails when the expected slug is absent from matchedEvents", () => {
    const res = baseResponse({
      grade: "A",
      matchedEvents: [matchedEvent("other-slug", "A")],
    });
    const r = evaluateStructure(benignCase, res);
    assert.strictEqual(r.pass, false);
    assert.ok(r.failures.some((f) => f.includes("matchedEvents missing slug")));
  });

  it("emits a soft warning (not a hard failure) when benign copy is graded F", () => {
    const res = baseResponse({
      grade: "F",
      riskScore: "critical",
      matchedEvents: [matchedEvent("pepero-day-1111", "A")],
    });
    const r = evaluateStructure(benignCase, res);
    assert.strictEqual(r.pass, true, "over-block must not hard-fail");
    assert.ok(r.softWarnings.some((w) => w.includes("over-block")));
  });
});

describe("structure-gate: rule-gap banned soft band", () => {
  it("warns when LLM grade falls outside the expected band", () => {
    const res = baseResponse({
      grade: "B",
      riskScore: "safe",
      matchedEvents: [matchedEvent("pepero-day-1111", "A")],
    });
    const r = evaluateStructure(ruleGapBanned, res);
    assert.strictEqual(r.pass, true, "band miss must not hard-fail");
    assert.ok(r.softWarnings.some((w) => w.includes("under-flag")));
  });

  it("no warning when LLM grade is inside the band", () => {
    const res = baseResponse({
      grade: "C",
      riskScore: "caution",
      matchedEvents: [matchedEvent("pepero-day-1111", "A")],
    });
    const r = evaluateStructure(ruleGapBanned, res);
    assert.strictEqual(r.pass, true);
    assert.deepStrictEqual(r.softWarnings, []);
  });
});
