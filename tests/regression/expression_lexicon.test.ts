/**
 * Regression: 표현 사전 매처 (ADR-0004)
 *
 * 이 스위트가 지키는 것은 "정탐"보다 **오탐 0**이다. 2026-07 "무섭노" 사건처럼
 * 경상 방언을 커뮤니티 은어로 오인하면 서비스 자체가 가해자가 된다.
 *
 * Scope:
 *   - matchLexicon() / buildExpressionFlags() / loadLexicon() 순수 함수만. DB·LLM 없음.
 *   - 픽스처는 이 파일 안에서 정의한다 — data/lexicon/*.json 내용 변화에
 *     매처 회귀가 흔들리지 않도록(데이터 스키마 검증은 lexicon_data.test.ts).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CheckRequest, LexiconEntry } from "@noonchi/shared";

import {
  buildExpressionFlags,
  loadLexicon,
  matchLexicon,
  toExpressionFlag,
  TIER_DEFAULT_STATUS,
} from "../../apps/web/lib/expression-lexicon.js";

// ---------------------------------------------------------------------------
// 픽스처
// ---------------------------------------------------------------------------

const SOURCE = {
  label: "테스트 출처",
  url: "https://example.com/x",
  type: "news" as const,
  accessed: "2026-09-13",
};

function entry(overrides: Partial<LexiconEntry> & Pick<LexiconEntry, "key">): LexiconEntry {
  return {
    term: overrides.key,
    category: "community",
    tier: "hard",
    severity: "critical",
    status: "approved",
    patterns: [],
    meaning: "테스트용 의미",
    benign_usages: [],
    harmful_example: "공격 용례",
    benign_example: "정상 용례",
    note: "테스트용 안내 문구",
    sources: [SOURCE],
    ...overrides,
  } as LexiconEntry;
}

/** hard — 마케팅 카피에서 정상 용법이 사실상 없는 표현 */
const HARD_GENDER = entry({
  key: "gender.kimchinyeo",
  term: "김치녀",
  category: "gender",
  tier: "hard",
  severity: "critical",
  patterns: [{ type: "literal", value: "김치녀" }],
});

/**
 * contextual + cooccur — "-노" 어미 단독은 절대 플래그하지 않는다.
 * 노무현 관련 명사와 **같은 문장**에 공존할 때만 후보가 된다.
 */
const CONTEXTUAL_NO_ENDING = entry({
  key: "community.no-ending",
  term: "-노 어미",
  category: "community",
  tier: "contextual",
  severity: "medium",
  patterns: [{ type: "regex", value: "[가-힣]+노(?=[\\s.!?…]|$)" }],
  cooccur: ["노무현|봉하|부엉이바위"],
  benign_usages: ["경상 방언 감탄·의문 어미", "피아노 등 일반 명사"],
});

/**
 * contextual — 음식/지명과 표면형이 겹치는 표현. 복합어("홍어회")까지 잡아야 하므로
 * literal(어절 경계 + 조사) 대신 regex 패턴을 쓴다.
 */
const CONTEXTUAL_REGION = entry({
  key: "region.hongeo",
  term: "홍어",
  category: "region",
  tier: "contextual",
  severity: "medium",
  patterns: [{ type: "regex", value: "홍어" }],
  benign_usages: ["전라도 향토 음식"],
});

const WATCH_ENTRY = entry({
  key: "community.watch-sample",
  term: "감성팔이",
  tier: "watch",
  severity: "medium",
  patterns: [{ type: "literal", value: "감성팔이" }],
});

const FIXTURES: LexiconEntry[] = [
  HARD_GENDER,
  CONTEXTUAL_NO_ENDING,
  CONTEXTUAL_REGION,
  WATCH_ENTRY,
];

function req(overrides: Partial<CheckRequest>): CheckRequest {
  return { date: "2027-03-18", copy: "", ...overrides };
}

function matchedKeys(request: CheckRequest): string[] {
  return matchLexicon(request, FIXTURES).map((m) => m.entry.key);
}

// ---------------------------------------------------------------------------

describe("matchLexicon — hard 정탐", () => {
  it("matches a hard term in the copy", () => {
    assert.deepEqual(matchedKeys(req({ copy: "김치녀" })), ["gender.kimchinyeo"]);
  });

  it("matches a hard term followed by plural + particle (김치녀들이)", () => {
    assert.deepEqual(
      matchedKeys(req({ copy: "김치녀들이 문제" })),
      ["gender.kimchinyeo"]
    );
  });

  it("matches a hard term with a quoting particle (김치녀라는)", () => {
    assert.deepEqual(
      matchedKeys(req({ copy: "김치녀라는 말" })),
      ["gender.kimchinyeo"]
    );
  });

  it("reports the field the term was found in", () => {
    const [nameHit] = matchLexicon(req({ campaignName: "김치녀 캠페인", copy: "봄 세일" }), FIXTURES);
    assert.equal(nameHit.field, "campaignName");

    const [assetHit] = matchLexicon(
      req({ copy: "봄 세일", assetKeywords: ["파스텔", "김치녀"] }),
      FIXTURES
    );
    assert.equal(assetHit.field, "assetKeywords");
  });

  it("returns at most one match per entry even when it appears in several fields", () => {
    const matches = matchLexicon(
      req({ campaignName: "김치녀", copy: "김치녀", assetKeywords: ["김치녀"] }),
      FIXTURES
    );
    assert.equal(matches.length, 1);
    assert.equal(matches[0].field, "campaignName");
  });
});

describe("matchLexicon — 부분어 오탐 방지", () => {
  it("does not match '김치 녀석' (띄어쓰기로 갈라진 부분어)", () => {
    assert.deepEqual(matchedKeys(req({ copy: "김치 녀석" })), []);
  });

  it("does not match '김치녀석' (뒤에 다른 음절이 붙은 경우)", () => {
    assert.deepEqual(matchedKeys(req({ copy: "김치녀석" })), []);
  });

  it("returns nothing for ordinary marketing copy", () => {
    assert.deepEqual(matchedKeys(req({ copy: "봄맞이 신상 출시" })), []);
  });
});

describe("matchLexicon — 방언 대조군(-노 어미)은 0건", () => {
  const dialectControls = ["무섭노", "그랬노", "어디 가노", "피아노 세일", "어디 가노?"];

  for (const copy of dialectControls) {
    it(`does not flag "${copy}"`, () => {
      assert.deepEqual(matchedKeys(req({ copy })), []);
    });
  }

  it("does not flag when the cooccur term sits in a different sentence", () => {
    assert.deepEqual(
      matchedKeys(req({ copy: "노무현 대통령 추모 주간입니다. 날씨가 춥노" })),
      []
    );
  });

  it("does not flag when the cooccur term sits in a different asset keyword", () => {
    assert.deepEqual(
      matchedKeys(req({ copy: "봄 세일", assetKeywords: ["봉하", "무섭노"] })),
      []
    );
  });

  it("flags when the ending and the cooccur term share one sentence", () => {
    assert.deepEqual(
      matchedKeys(req({ copy: "봉하마을 갔다 왔노" })),
      ["community.no-ending"]
    );
  });

  it("treats a line break inside the copy as a sentence boundary", () => {
    assert.deepEqual(
      matchedKeys(req({ copy: "노무현 대통령 추모 주간\n날씨가 춥노" })),
      []
    );
  });
});

describe("matchLexicon — 문장 분리는 소수점을 자르지 않는다", () => {
  const DECIMAL_COOCCUR = entry({
    key: "community.six-point-nine",
    term: "6.9",
    tier: "contextual",
    severity: "high",
    patterns: [{ type: "regex", value: "(?<![0-9])6\\.9(?![0-9%])" }],
    cooccur: ["남성|남자"],
    benign_usages: ["치수·비율 등 일반 수치"],
  });

  it("matches a decimal pattern whose cooccur term is in the same sentence", () => {
    assert.deepEqual(
      matchLexicon(req({ copy: "남성 평균은 6.9라는 조롱" }), [DECIMAL_COOCCUR]).map((m) => m.entry.key),
      ["community.six-point-nine"]
    );
  });

  it("still splits on a sentence-final period", () => {
    assert.deepEqual(
      matchLexicon(req({ copy: "남성용 신상 출시. 할인율 6.9" }), [DECIMAL_COOCCUR]),
      []
    );
  });
});

describe("matchLexicon — contextual 티어", () => {
  it("matches '홍어회 세트' as contextual, not hard", () => {
    const matches = matchLexicon(req({ copy: "홍어회 세트" }), FIXTURES);
    assert.deepEqual(matches.map((m) => m.entry.key), ["region.hongeo"]);
    assert.equal(matches[0].entry.tier, "contextual");
  });
});

describe("toExpressionFlag", () => {
  it("maps a tier to its default display status", () => {
    assert.deepEqual(TIER_DEFAULT_STATUS, {
      hard: "harmful",
      contextual: "uncertain",
      watch: "informational",
    });
  });

  it("carries term, note and sources, and never leaks internal examples", () => {
    const [match] = matchLexicon(req({ copy: "김치녀" }), FIXTURES);
    const flag = toExpressionFlag(match, "harmful");

    assert.equal(flag.key, "gender.kimchinyeo");
    assert.equal(flag.term, "김치녀");
    assert.equal(flag.status, "harmful");
    assert.equal(flag.field, "copy");
    assert.equal(flag.note, HARD_GENDER.note);
    assert.deepEqual(flag.sources, [{ label: SOURCE.label, url: SOURCE.url }]);
    assert.equal(flag.rationale, undefined);
  });

  it("prefers the LLM alternative over the lexicon default", () => {
    const [match] = matchLexicon(req({ copy: "홍어회 세트" }), FIXTURES);
    const flag = toExpressionFlag(match, "uncertain", {
      rationale: "음식 명칭으로 쓰였습니다.",
      alternative: "홍어 정식",
    });

    assert.equal(flag.rationale, "음식 명칭으로 쓰였습니다.");
    assert.equal(flag.alternative, "홍어 정식");
  });
});

describe("buildExpressionFlags — 티어별 판정 반영", () => {
  const hardMatch = matchLexicon(req({ copy: "김치녀" }), FIXTURES);
  const contextualMatch = matchLexicon(req({ copy: "홍어회 세트" }), FIXTURES);
  const watchMatch = matchLexicon(req({ copy: "감성팔이" }), FIXTURES);

  it("keeps a hard match harmful even when the model calls it benign", () => {
    const flags = buildExpressionFlags(hardMatch, [
      { key: "gender.kimchinyeo", disposition: "benign", rationale: "인용입니다." },
    ]);
    assert.equal(flags.length, 1);
    assert.equal(flags[0].status, "harmful");
    assert.equal(flags[0].rationale, "인용입니다.");
  });

  it("drops a contextual match the model judged benign", () => {
    const flags = buildExpressionFlags(contextualMatch, [
      { key: "region.hongeo", disposition: "benign", rationale: "음식 명칭입니다." },
    ]);
    assert.deepEqual(flags, []);
  });

  it("promotes a contextual match the model judged harmful", () => {
    const flags = buildExpressionFlags(contextualMatch, [
      { key: "region.hongeo", disposition: "harmful", rationale: "지역 비하 맥락입니다." },
    ]);
    assert.equal(flags[0].status, "harmful");
  });

  it("falls back to uncertain for a contextual match with no verdict", () => {
    assert.equal(buildExpressionFlags(contextualMatch)[0].status, "uncertain");
    assert.equal(
      buildExpressionFlags(contextualMatch, [
        { key: "other.key", disposition: "harmful", rationale: "다른 항목" },
      ])[0].status,
      "uncertain"
    );
  });

  it("keeps a watch match informational regardless of the verdict", () => {
    const flags = buildExpressionFlags(watchMatch, [
      { key: "community.watch-sample", disposition: "harmful", rationale: "r" },
    ]);
    assert.equal(flags[0].status, "informational");
  });

  it("returns an empty array when nothing matched", () => {
    assert.deepEqual(buildExpressionFlags([], []), []);
  });
});

describe("loadLexicon", () => {
  it("returns only approved entries by default", () => {
    assert.ok(loadLexicon().every((e) => e.status === "approved"));
  });

  it("includes draft entries when asked, and never fewer than the approved set", () => {
    const withDraft = loadLexicon({ includeDraft: true });
    assert.ok(withDraft.every((e) => e.status === "approved" || e.status === "draft"));
    assert.ok(withDraft.length >= loadLexicon().length);
  });
});
