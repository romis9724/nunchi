/**
 * Stage-0 (local, pure): generate-cases
 *
 * Verifies the case generator produces exactly two cases per event with the
 * right oracle shape, and spot-checks the deterministic toneToGrade oracle on
 * a few known events. No DB / LLM / network.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { toneToGrade } from "@noonchi/shared";

import { loadEvents } from "./classify-events.js";
import {
  EVAL_CAMPAIGN_PREFIX,
  generateCases,
  type EvalCase,
} from "./generate-cases.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = path.resolve(HERE, "../../../data/events");

function caseFor(cases: EvalCase[], slug: string, kind: EvalCase["kind"]): EvalCase {
  const found = cases.find((c) => c.eventSlug === slug && c.kind === kind);
  assert.ok(found, `no ${kind} case for ${slug}`);
  return found;
}

describe("generate-cases: cardinality", () => {
  const events = loadEvents(EVENTS_DIR);
  const cases = generateCases(events);

  it("produces exactly two cases per event", () => {
    assert.strictEqual(
      cases.length,
      events.length * 2,
      `expected ${events.length * 2} cases for ${events.length} events`,
    );
  });

  it("each event has one banned + one benign case", () => {
    for (const e of events) {
      const banned = cases.filter((c) => c.eventSlug === e.slug && c.kind === "banned");
      const benign = cases.filter((c) => c.eventSlug === e.slug && c.kind === "benign");
      assert.strictEqual(banned.length, 1, `${e.slug} banned count`);
      assert.strictEqual(benign.length, 1, `${e.slug} benign count`);
    }
  });

  it("every request carries the eval campaign prefix", () => {
    for (const c of cases) {
      assert.ok(
        c.request.campaignName?.startsWith(EVAL_CAMPAIGN_PREFIX),
        `case ${c.id} missing eval prefix`,
      );
    }
  });

  it("benign dates are 0-padded YYYY-MM-DD in 2025", () => {
    for (const c of cases.filter((x) => x.kind === "benign")) {
      assert.match(
        c.request.date,
        /^2025-\d{2}-\d{2}$/,
        `benign date malformed: ${c.request.date} (${c.eventSlug})`,
      );
    }
  });
});

describe("generate-cases: rule-covered banned oracle", () => {
  const cases = generateCases(loadEvents(EVENTS_DIR));

  it("5·18 banned → F/critical short-circuit oracle", () => {
    const c = caseFor(cases, "gwangju-uprising-0518", "banned");
    assert.strictEqual(c.oracle.ruleTriggered, true);
    assert.strictEqual(c.oracle.grade, "F");
    assert.strictEqual(c.oracle.riskScore, "critical");
    assert.strictEqual(c.oracle.matchedEventsEmpty, true);
    assert.ok(
      (c.oracle.flaggedKeywordsInclude ?? []).length === 1,
      "expected exactly one seeded critical keyword",
    );
    const seeded = c.oracle.flaggedKeywordsInclude?.[0] ?? "";
    assert.ok(
      c.request.copy.includes(seeded),
      `seeded term "${seeded}" not present in copy`,
    );
    assert.strictEqual(c.qualitative.applicable, false);
  });
});

describe("generate-cases: rule-gap banned oracle", () => {
  const cases = generateCases(loadEvents(EVENTS_DIR));

  it("a commercial (low-risk) event banned → 관대 밴드(거짓 under-flag 없음)", () => {
    const c = caseFor(cases, "pepero-day-1111", "banned");
    assert.strictEqual(c.oracle.ruleTriggered, false);
    assert.strictEqual(c.oracle.flaggedKeywordsEmpty, true);
    assert.strictEqual(c.oracle.matchedEventsInclude, "pepero-day-1111");
    assert.strictEqual(c.qualitative.applicable, true);
    // celebration+low → 기대 A → 밴드는 A 이상 전체. 상업 이벤트를 F/D로 강제하지 않는다.
    assert.deepStrictEqual(c.qualitative.llmShouldFlagGradeIn, ["A", "B", "C", "D", "F"]);
  });
});

describe("generate-cases: benign oracle + toneToGrade spot-checks", () => {
  const events = loadEvents(EVENTS_DIR);
  const cases = generateCases(events);

  const spotChecks = [
    "gwangju-uprising-0518", // avoid/memorial + critical → F
    "liberation-day-0815", // celebration-ish positive day
    "pepero-day-1111", // celebration + low → A
  ];

  for (const slug of spotChecks) {
    it(`benign matchedEventGrade matches toneToGrade for ${slug}`, () => {
      const event = events.find((e) => e.slug === slug);
      assert.ok(event, `missing event ${slug}`);
      const c = caseFor(cases, slug, "benign");
      const expected = toneToGrade(event.recommended_tone, event.risk_level);
      assert.deepStrictEqual(c.oracle.matchedEventGrade, {
        slug,
        grade: expected,
      });
      assert.strictEqual(c.oracle.ruleTriggered, false);
      assert.strictEqual(c.oracle.flaggedKeywordsEmpty, true);
    });
  }

  it("pepero-day benign grade is A (celebration + low)", () => {
    const c = caseFor(cases, "pepero-day-1111", "benign");
    assert.strictEqual(c.oracle.matchedEventGrade?.grade, "A");
  });
});
