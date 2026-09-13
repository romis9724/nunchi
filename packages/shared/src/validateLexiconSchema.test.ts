/**
 * Unit tests for validateLexiconEntries (ADR-0004 표현 사전 스키마)
 *
 * Run: tsx --test src/validateLexiconSchema.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validateLexiconEntries } from "./validateLexiconSchema.js";

/** 통과해야 하는 기준 항목. 각 테스트는 스프레드로 한 필드만 망가뜨린다. */
const VALID_ENTRY = {
  key: "community.example",
  term: "예시어",
  category: "community",
  tier: "hard",
  severity: "critical",
  status: "approved",
  patterns: [{ type: "literal", value: "예시어" }],
  meaning: "예시 설명",
  benign_usages: [],
  harmful_example: "공격 용례",
  benign_example: "정상 용례",
  note: "마케팅 카피에 사용하지 않기를 권고합니다.",
  sources: [
    {
      label: "한겨레",
      url: "https://example.com/a",
      type: "news",
      accessed: "2026-09-13",
    },
  ],
} as const;

function errorsFor(overrides: Record<string, unknown>): string[] {
  return validateLexiconEntries([{ ...VALID_ENTRY, ...overrides }]);
}

describe("validateLexiconEntries — 정상 케이스", () => {
  it("returns no errors for a fully valid entry", () => {
    assert.deepEqual(validateLexiconEntries([VALID_ENTRY]), []);
  });

  it("returns no errors for an empty array", () => {
    assert.deepEqual(validateLexiconEntries([]), []);
  });

  it("accepts a contextual entry with benign_usages and cooccur", () => {
    const errors = errorsFor({
      key: "community.contextual",
      tier: "contextual",
      severity: "medium",
      benign_usages: ["음식으로서의 용법"],
      cooccur: ["노무현|봉하"],
      patterns: [{ type: "regex", value: "[가-힣]+노(?=[\\s.!?…]|$)" }],
    });
    assert.deepEqual(errors, []);
  });
});

describe("validateLexiconEntries — benign_example", () => {
  it("allows an empty benign_example for hard tier (no benign usage by definition)", () => {
    assert.deepEqual(
      errorsFor({ tier: "hard", severity: "high", benign_example: "", benign_usages: [] }),
      []
    );
  });

  it("allows an empty harmful_example for watch tier (disputed origin)", () => {
    assert.deepEqual(
      errorsFor({ tier: "watch", severity: "medium", harmful_example: "" }),
      []
    );
  });

  it("rejects an empty harmful_example for hard tier", () => {
    const errors = errorsFor({ tier: "hard", severity: "high", harmful_example: "" });
    assert.ok(errors.some((e) => e.includes("harmful_example")));
  });

  it("rejects an empty benign_example for contextual tier", () => {
    const errors = errorsFor({
      tier: "contextual",
      severity: "high",
      benign_usages: ["정상 용법"],
      benign_example: "",
    });
    assert.ok(errors.some((e) => e.includes("benign_example")));
  });
});

describe("validateLexiconEntries — 필드 타입", () => {
  it("rejects a non-object entry", () => {
    const errors = validateLexiconEntries(["nope"]);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /must be an object/);
  });

  it("rejects an empty note", () => {
    assert.ok(errorsFor({ note: "  " }).some((e) => /\.note /.test(e)));
  });

  it("rejects an empty meaning", () => {
    assert.ok(errorsFor({ meaning: "" }).some((e) => /\.meaning /.test(e)));
  });

  it("rejects an unknown category", () => {
    assert.ok(errorsFor({ category: "politics" }).some((e) => /\.category /.test(e)));
  });

  it("rejects an unknown tier", () => {
    assert.ok(errorsFor({ tier: "soft" }).some((e) => /\.tier /.test(e)));
  });

  it("uses the label option in error messages", () => {
    const errors = validateLexiconEntries([{ ...VALID_ENTRY, note: "" }], {
      label: "community.json",
    });
    assert.ok(errors.some((e) => e.startsWith("community.json[0].")));
  });
});

describe("validateLexiconEntries — key 유니크", () => {
  it("flags a duplicated key within one batch", () => {
    const errors = validateLexiconEntries([VALID_ENTRY, VALID_ENTRY]);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /duplicated/);
  });
});

describe("validateLexiconEntries — patterns", () => {
  it("requires at least one pattern", () => {
    assert.ok(errorsFor({ patterns: [] }).some((e) => /non-empty array/.test(e)));
  });

  it("rejects a regex pattern that does not compile", () => {
    const errors = errorsFor({ patterns: [{ type: "regex", value: "([" }] });
    assert.ok(errors.some((e) => /not a valid RegExp/.test(e)));
  });

  it("does not compile literal patterns as regex", () => {
    assert.deepEqual(errorsFor({ patterns: [{ type: "literal", value: "([" }] }), []);
  });

  it("rejects a cooccur entry that does not compile", () => {
    const errors = errorsFor({
      tier: "contextual",
      severity: "medium",
      benign_usages: ["정상"],
      cooccur: ["*bad("],
    });
    assert.ok(errors.some((e) => /cooccur\[0\] is not a valid RegExp/.test(e)));
  });
});

describe("validateLexiconEntries — 승인 규칙", () => {
  it("rejects an approved entry sourced only from wiki", () => {
    const errors = errorsFor({
      sources: [
        {
          label: "나무위키",
          url: "https://example.com/w",
          type: "wiki",
          accessed: "2026-09-13",
        },
      ],
    });
    assert.ok(errors.some((e) => /non-wiki source/.test(e)));
  });

  it("allows a draft entry sourced only from wiki", () => {
    const errors = errorsFor({
      status: "draft",
      sources: [
        {
          label: "나무위키",
          url: "https://example.com/w",
          type: "wiki",
          accessed: "2026-09-13",
        },
      ],
    });
    assert.deepEqual(errors, []);
  });

  it("requires benign_usages for contextual tier", () => {
    const errors = errorsFor({ tier: "contextual", severity: "medium", benign_usages: [] });
    assert.ok(errors.some((e) => /benign_usages must contain at least one/.test(e)));
  });
});

describe("validateLexiconEntries — severity × tier", () => {
  it("rejects hard + medium", () => {
    assert.ok(
      errorsFor({ tier: "hard", severity: "medium" }).some((e) =>
        /not allowed for tier "hard"/.test(e)
      )
    );
  });

  it("rejects watch + critical", () => {
    assert.ok(
      errorsFor({ tier: "watch", severity: "critical" }).some((e) =>
        /not allowed for tier "watch"/.test(e)
      )
    );
  });

  it("accepts watch + medium", () => {
    assert.deepEqual(errorsFor({ tier: "watch", severity: "medium" }), []);
  });
});
