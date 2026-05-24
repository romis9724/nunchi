/**
 * Regression: tone × risk_level → Grade mapping — Task #4 (Seed AC6)
 *
 * Verifies the `toneToGrade` mapping used by both the review-engine LLM
 * post-processing step and the /calendar Server Component. These scenarios
 * are the documented examples from ADR-0003 (five-grade-system) and
 * represent the contract callers depend on.
 *
 * Scope:
 *   - Pure function only — `toneToGrade(recommended_tone, risk_level)`
 *   - No Supabase, no LLM, no network
 *   - Both the "happy path" mappings (8·15 + celebration → A) AND the
 *     guard mappings that prevent celebration tones from being applied to
 *     high-risk events
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  toneToGrade,
  RISK_LEVEL_TO_GRADE,
  type Grade,
  type RecommendedTone,
  type RiskLevel,
} from "@nunchi/shared";

interface Case {
  name: string;
  tone: RecommendedTone;
  risk: RiskLevel;
  expect: Grade;
}

const cases: Case[] = [
  // -- celebration tone × non-high risk → A (the "this date is good for X" affordance) --
  {
    name: "8·15 광복절 (celebration + low) → A",
    tone: "celebration",
    risk: "low",
    expect: "A",
  },
  {
    name: "어린이날 (celebration + low) → A",
    tone: "celebration",
    risk: "low",
    expect: "A",
  },
  {
    name: "한글날 (celebration + medium) → A",
    tone: "celebration",
    risk: "medium",
    expect: "A",
  },

  // -- celebration on high-risk event is clamped to B (still positive but cautious) --
  {
    name: "celebration tone on a high-risk date → B (clamp)",
    tone: "celebration",
    risk: "high",
    expect: "B",
  },

  // -- avoid tone falls through to risk_level mapping --
  {
    name: "5·18 광주 (avoid + critical) → F",
    tone: "avoid",
    risk: "critical",
    expect: "F",
  },
  {
    name: "4·16 세월호 (avoid + critical) → F",
    tone: "avoid",
    risk: "critical",
    expect: "F",
  },
  {
    name: "4·3 제주 (avoid + critical) → F",
    tone: "avoid",
    risk: "critical",
    expect: "F",
  },

  // -- memorial tone follows risk_level mapping (commercial copy on memorial day is risky) --
  {
    name: "현충일 (memorial + critical) → F",
    tone: "memorial",
    risk: "critical",
    expect: "F",
  },
  {
    name: "노무현 서거 (memorial + high) → D",
    tone: "memorial",
    risk: "high",
    expect: "D",
  },
  {
    name: "박종철 (memorial + critical) → F",
    tone: "memorial",
    risk: "critical",
    expect: "F",
  },

  // -- neutral tone on medium / low risk dates → C / B --
  {
    name: "10·26 (neutral + high) → D",
    tone: "neutral",
    risk: "high",
    expect: "D",
  },
  {
    name: "6·10 항쟁 (neutral + medium) → C",
    tone: "neutral",
    risk: "medium",
    expect: "C",
  },
  {
    name: "스승의 날 (neutral + low) → B",
    tone: "neutral",
    risk: "low",
    expect: "B",
  },
];

describe("grade-mapping: toneToGrade scenarios from ADR-0003", () => {
  for (const c of cases) {
    it(c.name, () => {
      const got = toneToGrade(c.tone, c.risk);
      assert.strictEqual(
        got,
        c.expect,
        `toneToGrade("${c.tone}", "${c.risk}") = ${got}; expected ${c.expect}`,
      );
    });
  }
});

describe("grade-mapping: RISK_LEVEL_TO_GRADE base table is total and stable", () => {
  it("covers all four risk levels", () => {
    const levels: RiskLevel[] = ["critical", "high", "medium", "low"];
    for (const lvl of levels) {
      assert.ok(
        RISK_LEVEL_TO_GRADE[lvl] !== undefined,
        `RISK_LEVEL_TO_GRADE missing "${lvl}"`,
      );
    }
  });

  it("matches the documented critical→F / high→D / medium→C / low→B mapping", () => {
    assert.strictEqual(RISK_LEVEL_TO_GRADE.critical, "F");
    assert.strictEqual(RISK_LEVEL_TO_GRADE.high, "D");
    assert.strictEqual(RISK_LEVEL_TO_GRADE.medium, "C");
    assert.strictEqual(RISK_LEVEL_TO_GRADE.low, "B");
  });
});
