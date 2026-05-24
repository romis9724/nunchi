/**
 * Tests for assertDataCompleteness / checkDataCompleteness
 *
 * AC Sub-3: 데이터 품질(내용 완전성) 검증
 *   - related_keywords[] 빈 배열·빈 문자열 원소 불허
 *   - references[]       빈 배열·빈 문자열 label·url 불허
 *   - summary            빈 문자열 불허
 *
 * Uses Node.js built-in test runner (node:test) — no extra deps.
 * Run: tsx --test src/assertDataCompleteness.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertDataCompleteness,
  checkDataCompleteness,
} from "./assertDataCompleteness.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_EVENTS_DIR = resolve(__dirname, "../../../data/events");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal complete event record that satisfies all completeness checks */
function completeRecord(): Record<string, unknown> {
  return {
    slug: "gwangju-uprising-0518",
    date_type: "recurring",
    month: 5,
    day: 18,
    country: "KR",
    name: "5·18 광주민주화운동",
    category: "massacre",
    risk_level: "critical",
    summary: "1980년 5월 18일~27일, 전두환 신군부의 계엄군이 광주 시민을 진압했다.",
    related_keywords: ["탱크", "계엄", "발포"],
    related_motifs: ["탱크", "군복"],
    recommended_tone: "memorial",
    references: [
      {
        label: "5·18민주화운동기록관",
        url: "https://www.518archives.go.kr",
        type: "official",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// checkDataCompleteness — returns { valid, errors }
// ---------------------------------------------------------------------------

describe("checkDataCompleteness", () => {
  describe("valid complete records", () => {
    it("accepts a fully complete record", () => {
      const result = checkDataCompleteness(completeRecord());
      assert.equal(result.valid, true, result.errors.join("; "));
      assert.deepEqual(result.errors, []);
    });

    it("accepts a record with multiple keywords and references", () => {
      const rec = {
        ...completeRecord(),
        related_keywords: ["탱크", "계엄", "발포", "군부", "신군부"],
        references: [
          { label: "출처1", url: "https://example.com/1", type: "official" },
          { label: "출처2", url: "https://example.com/2", type: "wiki" },
        ],
      };
      const result = checkDataCompleteness(rec);
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── root value ─────────────────────────────────────────────────────────────
  describe("root value checks", () => {
    it("rejects null", () => {
      const result = checkDataCompleteness(null);
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it("rejects an array", () => {
      const result = checkDataCompleteness([]);
      assert.equal(result.valid, false);
    });

    it("rejects a string", () => {
      const result = checkDataCompleteness("event");
      assert.equal(result.valid, false);
    });

    it("rejects a number", () => {
      const result = checkDataCompleteness(42);
      assert.equal(result.valid, false);
    });
  });

  // ── related_keywords ───────────────────────────────────────────────────────
  describe("related_keywords", () => {
    it("rejects missing related_keywords", () => {
      const rec = completeRecord();
      delete rec.related_keywords;
      const result = checkDataCompleteness(rec);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("related_keywords")),
        `Expected related_keywords error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects empty related_keywords array", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: [],
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("related_keywords")),
        `Expected related_keywords error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects related_keywords with an empty string element", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: ["탱크", ""],
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("related_keywords[1]")),
        `Expected related_keywords[1] error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects related_keywords with a whitespace-only string element", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: ["  "],
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("related_keywords[0]")),
        `Expected related_keywords[0] error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects non-array related_keywords", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: "탱크",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("related_keywords")));
    });

    it("accepts related_keywords with a single non-empty string", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: ["탱크"],
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });

    it("reports errors for multiple empty-string elements", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: ["", ""],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.length >= 2, `Expected ≥2 errors, got: ${result.errors.join("; ")}`);
    });
  });

  // ── references ─────────────────────────────────────────────────────────────
  describe("references", () => {
    it("rejects missing references", () => {
      const rec = completeRecord();
      delete rec.references;
      const result = checkDataCompleteness(rec);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("references")),
        `Expected references error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects empty references array", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [],
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("references")),
        `Expected references error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects reference with empty label", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [{ label: "", url: "https://example.com", type: "official" }],
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("references[0].label")),
        `Expected references[0].label error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects reference with whitespace-only label", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [{ label: "   ", url: "https://example.com", type: "official" }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("references[0].label")));
    });

    it("rejects reference with empty url", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [{ label: "출처", url: "", type: "official" }],
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("references[0].url")),
        `Expected references[0].url error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects reference with whitespace-only url", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [{ label: "출처", url: "  ", type: "official" }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("references[0].url")));
    });

    it("rejects non-array references", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: "https://example.com",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("references")));
    });

    it("rejects reference entry that is not an object", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: ["https://example.com"],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("references[0]")));
    });

    it("collects errors for multiple invalid reference entries", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [
          { label: "", url: "", type: "official" },
          { label: "출처", url: "", type: "wiki" },
        ],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.length >= 3, `Expected ≥3 errors, got: ${result.errors.join("; ")}`);
    });

    it("accepts a reference with both non-empty label and url", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        references: [{ label: "위키피디아", url: "https://ko.wikipedia.org", type: "wiki" }],
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── summary ────────────────────────────────────────────────────────────────
  describe("summary", () => {
    it("rejects missing summary", () => {
      const rec = completeRecord();
      delete rec.summary;
      const result = checkDataCompleteness(rec);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("summary")),
        `Expected summary error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects empty string summary", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        summary: "",
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("summary")),
        `Expected summary error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects whitespace-only summary", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        summary: "   ",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("summary")));
    });

    it("rejects non-string summary (number)", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        summary: 1980,
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("summary")));
    });

    it("accepts a non-empty Korean summary string", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        summary: "1980년 광주 민주화 운동 — 계엄군이 시민을 진압했다.",
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── all three fields empty at once ─────────────────────────────────────────
  describe("multiple empty fields", () => {
    it("reports errors for all three fields when all are empty", () => {
      const result = checkDataCompleteness({
        ...completeRecord(),
        related_keywords: [],
        references: [],
        summary: "",
      });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("related_keywords")),
        `Missing related_keywords error: ${result.errors.join("; ")}`
      );
      assert.ok(
        result.errors.some((e) => e.includes("references")),
        `Missing references error: ${result.errors.join("; ")}`
      );
      assert.ok(
        result.errors.some((e) => e.includes("summary")),
        `Missing summary error: ${result.errors.join("; ")}`
      );
    });

    it("accumulates errors from an empty object", () => {
      const result = checkDataCompleteness({});
      assert.equal(result.valid, false);
      assert.ok(result.errors.length >= 3);
    });
  });
});

// ---------------------------------------------------------------------------
// assertDataCompleteness — throws on failure
// ---------------------------------------------------------------------------

describe("assertDataCompleteness", () => {
  describe("does not throw for complete records", () => {
    it("passes for a complete record without throwing", () => {
      assert.doesNotThrow(() => {
        assertDataCompleteness(completeRecord());
      });
    });

    it("passes with optional label parameter", () => {
      assert.doesNotThrow(() => {
        assertDataCompleteness(completeRecord(), "0518-gwangju-uprising.json");
      });
    });
  });

  describe("throws for incomplete records", () => {
    it("throws when related_keywords is empty", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            related_keywords: [],
          }),
        /related_keywords/
      );
    });

    it("throws when references is empty", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            references: [],
          }),
        /references/
      );
    });

    it("throws when summary is empty string", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            summary: "",
          }),
        /summary/
      );
    });

    it("throws when summary is whitespace only", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            summary: "   ",
          }),
        /summary/
      );
    });

    it("includes all violations in the thrown error message", () => {
      let thrown: Error | undefined;
      try {
        assertDataCompleteness({
          ...completeRecord(),
          related_keywords: [],
          references: [],
          summary: "",
        });
      } catch (err) {
        thrown = err as Error;
      }
      assert.ok(thrown !== undefined, "Expected an error to be thrown");
      assert.ok(
        thrown!.message.includes("related_keywords"),
        `Error message should mention related_keywords: ${thrown!.message}`
      );
      assert.ok(
        thrown!.message.includes("references"),
        `Error message should mention references: ${thrown!.message}`
      );
      assert.ok(
        thrown!.message.includes("summary"),
        `Error message should mention summary: ${thrown!.message}`
      );
    });

    it("includes the label in the thrown error message when provided", () => {
      let thrown: unknown = undefined;
      try {
        assertDataCompleteness(
          { ...completeRecord(), related_keywords: [] },
          "test-event.json"
        );
      } catch (err) {
        thrown = err;
      }
      assert.ok(thrown instanceof Error, "Expected Error to be thrown");
      assert.ok(
        (thrown as Error).message.includes("test-event.json"),
        `Error should include label: ${(thrown as Error).message}`
      );
    });

    it("throws for null input", () => {
      assert.throws(() => assertDataCompleteness(null), Error);
    });

    it("throws for array input", () => {
      assert.throws(() => assertDataCompleteness([]), Error);
    });

    it("throws when a keyword element is an empty string", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            related_keywords: ["탱크", ""],
          }),
        /related_keywords\[1\]/
      );
    });

    it("throws when a reference label is empty", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            references: [{ label: "", url: "https://example.com", type: "official" }],
          }),
        /references\[0\]\.label/
      );
    });

    it("throws when a reference url is empty", () => {
      assert.throws(
        () =>
          assertDataCompleteness({
            ...completeRecord(),
            references: [{ label: "출처", url: "", type: "official" }],
          }),
        /references\[0\]\.url/
      );
    });
  });

  // ── real event files ────────────────────────────────────────────────────────
  describe("real event files pass completeness check", () => {
    const realFiles = [
      "0518-gwangju-uprising.json",
      "0416-sewol-ferry.json",
      "0815-liberation-day.json",
      "0625-korean-war.json",
      "0403-jeju-uprising.json",
      "1026-assassination.json",
      "1212-coup.json",
      "0301-independence-movement.json",
      "0128-comfort-women.json",
      "1029-itaewon.json",
    ];

    for (const filename of realFiles) {
      it(`${filename} passes assertDataCompleteness`, () => {
        const absPath = join(DATA_EVENTS_DIR, filename);
        const content = readFileSync(absPath, "utf-8");
        const data = JSON.parse(content) as unknown;
        assert.doesNotThrow(
          () => assertDataCompleteness(data, filename),
          `${filename} should pass completeness check`
        );
      });
    }
  });
});
