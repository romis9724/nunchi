/**
 * Regression: critical keyword scenarios — Task #4 (Seed AC6)
 *
 * Verifies that historically-grounded campaign-copy + date combinations
 * still trip the in-memory CRITICAL_KEYWORDS rule and short-circuit to
 * F-grade without any LLM or DB round-trip. These are the "must never
 * regress" cases that justify Nunchi's existence.
 *
 * Scope:
 *   - matchCriticalKeywords() pure function only
 *   - No Supabase, no LLM
 *   - Asserts both POSITIVE matches (term present → caught) and
 *     NEGATIVE controls (innocent copy → not caught)
 *
 * Out of scope:
 *   - Whole-pipeline integration (date-based event fetch + LLM rationale).
 *     Those require live Supabase + Gemini and are deferred to a separate
 *     integration suite gated by env (GEMINI_API_KEY + SUPABASE_*).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CRITICAL_KEYWORDS,
  matchCriticalKeywords,
} from "../../apps/web/lib/critical-keywords.js";

interface Scenario {
  name: string;
  input: { copy: string; assetKeywords?: string[]; campaignName?: string };
  expectMatches: string[]; // ALL terms that must appear (order-insensitive)
  expectAtLeastOneSlug?: string; // optional: ensure the matched terms trace to this event slug
}

const positiveScenarios: Scenario[] = [
  {
    name: "5·18 + 탱크데이 카피 → 탱크 매칭",
    input: { copy: "신상 탱크데이 시리즈 출시!" },
    expectMatches: ["탱크"],
    expectAtLeastOneSlug: "gwangju-uprising-0518",
  },
  {
    name: "5·18 + 박종철 (책상 탁) 카피 → 책상 탁 + 박종철 매칭",
    input: {
      campaignName: "투명함을 다시 — 책상 탁",
      copy: "투명한 책상에 탁! 놓아두는 새 디자인",
    },
    // The substring rule is case-insensitive but exact; "책상에 탁" appears in copy,
    // "책상 탁" is the keyword variant that should also match against the campaignName.
    expectMatches: ["책상 탁", "책상에 탁"],
    expectAtLeastOneSlug: "gwangju-uprising-0518",
  },
  {
    name: "4·16 + 세월호 인용 카피 → 세월호 매칭",
    input: { copy: "세월호를 기억합니다 — 새로운 출항" },
    expectMatches: ["세월호"],
    expectAtLeastOneSlug: "sewol-ferry-0416",
  },
  {
    name: "10·29 + 이태원 압사 언급 → 이태원 + 압사 매칭",
    input: { copy: "이태원에서의 새 출발, 압사 같은 줄에 서지 마세요" },
    expectMatches: ["이태원", "압사"],
    expectAtLeastOneSlug: "itaewon-disaster-1029",
  },
  {
    name: "8·15 + 위안부 강제징용 언급 (광복 시즌의 잘못된 톤) → 위안부 + 강제징용 매칭",
    input: { copy: "광복 80주년 — 위안부 할머니, 강제징용 청년의 이야기" },
    expectMatches: ["위안부", "강제징용"],
    expectAtLeastOneSlug: "liberation-day-0815",
  },
  {
    name: "5·18 + 신군부 군사적 표현 → 신군부 + 발포 매칭",
    input: { copy: "신군부의 발포 — 새 게임 출시" },
    expectMatches: ["신군부", "발포"],
    expectAtLeastOneSlug: "gwangju-uprising-0518",
  },
  {
    name: "비주얼 키워드만으로도 매칭 (탱크 in assetKeywords)",
    input: { copy: "혁신의 새 시대", assetKeywords: ["탱크", "탄약"] },
    expectMatches: ["탱크"],
    expectAtLeastOneSlug: "gwangju-uprising-0518",
  },
  {
    name: "캠페인명만으로도 매칭 (욱일기 in campaignName)",
    input: { campaignName: "욱일기 새 디자인 컬렉션", copy: "여름 신상" },
    expectMatches: ["욱일기"],
    expectAtLeastOneSlug: "liberation-day-0815",
  },
];

const negativeScenarios: Scenario[] = [
  {
    name: "8·15 + 광복 톤 카피 (긍정 매칭) → 룰 매칭 0건 (LLM/등급 로직에 맡김)",
    input: { copy: "광복절 기념 — 독립의 정신을 잇는 신상품" },
    expectMatches: [],
  },
  {
    name: "평일 + 신상 카피 → 룰 매칭 0건",
    input: { copy: "봄 신상 컬렉션 — 화사한 컬러" },
    expectMatches: [],
  },
  {
    name: "어린이날 캠페인 → 룰 매칭 0건",
    input: { copy: "아이들을 위한 안전한 신상 — 어린이날 한정", campaignName: "패밀리 시리즈" },
    expectMatches: [],
  },
];

describe("critical-events: positive scenarios (must catch)", () => {
  for (const s of positiveScenarios) {
    it(s.name, () => {
      const got = matchCriticalKeywords(s.input);
      // Order-insensitive set check
      for (const kw of s.expectMatches) {
        assert.ok(
          got.includes(kw),
          `expected match "${kw}" not in ${JSON.stringify(got)}`,
        );
      }
      assert.ok(
        got.length > 0,
        "expected at least one rule match, got none — F-grade short-circuit would not fire",
      );
      if (s.expectAtLeastOneSlug) {
        const slugs = new Set(
          got.flatMap((kw) => CRITICAL_KEYWORDS[kw] ?? []),
        );
        assert.ok(
          slugs.has(s.expectAtLeastOneSlug),
          `expected slug "${s.expectAtLeastOneSlug}" reachable from matched terms ${JSON.stringify(got)}; reachable=${JSON.stringify([...slugs])}`,
        );
      }
    });
  }
});

describe("critical-events: negative controls (must NOT catch)", () => {
  for (const s of negativeScenarios) {
    it(s.name, () => {
      const got = matchCriticalKeywords(s.input);
      assert.deepStrictEqual(
        got,
        [],
        `expected no rule match, but got ${JSON.stringify(got)} — would falsely fire F-grade`,
      );
    });
  }
});

describe("critical-events: data integrity", () => {
  it("every CRITICAL_KEYWORDS entry maps to at least one slug", () => {
    for (const [term, slugs] of Object.entries(CRITICAL_KEYWORDS)) {
      assert.ok(
        Array.isArray(slugs) && slugs.length > 0,
        `keyword "${term}" has no slug mapping — silent break risk`,
      );
    }
  });

  it("no keyword term is empty / whitespace-only", () => {
    for (const term of Object.keys(CRITICAL_KEYWORDS)) {
      assert.ok(term.trim().length > 0, `empty keyword in CRITICAL_KEYWORDS`);
    }
  });
});
