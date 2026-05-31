/**
 * Unit tests for validateEventSchema / validateEventData
 *
 * Covers every required field listed in Sub-AC 1:
 *   id(slug), date(date_type+month), country, name, category, risk_level,
 *   related_keywords, related_motifs, recommended_tone, summary, references
 *
 * Uses Node.js built-in test runner (node:test) — no extra deps needed.
 * Run: tsx --test src/validateEventSchema.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateEventSchema,
  validateEventData,
} from "./validateEventSchema.js";

// ---------------------------------------------------------------------------
// Module-level path resolution for real event files
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_EVENTS_DIR = resolve(__dirname, "../../../data/events");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid event record that satisfies all required fields */
function validRecord(): Record<string, unknown> {
  return {
    slug: "0518-gwangju",
    date_type: "recurring",
    month: 5,
    day: 18,
    country: "KR",
    name: "5·18 광주민주화운동",
    category: "massacre",
    risk_level: "critical",
    summary: "1980년 광주 민주화 운동.",
    related_keywords: ["탱크", "계엄"],
    related_motifs: ["탱크"],
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

/** Write `obj` to a temp file and return its path */
const TEMP_DIR = join(tmpdir(), `noonchi-test-${process.pid}`);

function writeTempJson(obj: unknown, name = "event.json"): string {
  mkdirSync(TEMP_DIR, { recursive: true });
  const filePath = join(TEMP_DIR, name);
  writeFileSync(filePath, JSON.stringify(obj), "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// validateEventData — in-memory validation
// ---------------------------------------------------------------------------

describe("validateEventData", () => {
  describe("root value checks", () => {
    it("rejects null", () => {
      const result = validateEventData(null);
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it("rejects an array", () => {
      const result = validateEventData([]);
      assert.equal(result.valid, false);
    });

    it("rejects a string", () => {
      const result = validateEventData("event");
      assert.equal(result.valid, false);
    });
  });

  describe("valid record", () => {
    it("accepts a complete valid record", () => {
      const result = validateEventData(validRecord());
      assert.equal(result.valid, true, result.errors.join("; "));
      assert.deepEqual(result.errors, []);
    });
  });

  // ── id / slug ──────────────────────────────────────────────────────────────
  describe("id (slug)", () => {
    it("rejects missing slug", () => {
      const rec = validRecord();
      delete rec.slug;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("slug")),
        `Expected slug error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects whitespace-only slug", () => {
      const result = validateEventData({ ...validRecord(), slug: "  " });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("slug")));
    });

    it("rejects numeric slug", () => {
      const result = validateEventData({ ...validRecord(), slug: 518 });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("slug")));
    });
  });

  // ── date: date_type ────────────────────────────────────────────────────────
  describe("date (date_type)", () => {
    it("rejects missing date_type", () => {
      const rec = validRecord();
      delete rec.date_type;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("date_type")));
    });

    it("rejects invalid date_type value", () => {
      const result = validateEventData({
        ...validRecord(),
        date_type: "weekly",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("date_type")));
    });

    it("accepts date_type=fixed", () => {
      const result = validateEventData({ ...validRecord(), date_type: "fixed" });
      assert.equal(result.valid, true, result.errors.join("; "));
    });

    it("accepts date_type=recurring", () => {
      const result = validateEventData({ ...validRecord(), date_type: "recurring" });
      assert.equal(result.valid, true, result.errors.join("; "));
    });

    it("accepts date_type=range", () => {
      const result = validateEventData({ ...validRecord(), date_type: "range" });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── date: month ────────────────────────────────────────────────────────────
  describe("date (month)", () => {
    it("rejects missing month", () => {
      const rec = validRecord();
      delete rec.month;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("month")));
    });

    it("rejects month 0", () => {
      const result = validateEventData({ ...validRecord(), month: 0 });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("month")));
    });

    it("rejects month 13", () => {
      const result = validateEventData({ ...validRecord(), month: 13 });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("month")));
    });

    it("rejects float month (5.5)", () => {
      const result = validateEventData({ ...validRecord(), month: 5.5 });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("month")));
    });

    it("rejects string month", () => {
      const result = validateEventData({ ...validRecord(), month: "5" });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("month")));
    });

    it("accepts month=1 (January)", () => {
      const result = validateEventData({ ...validRecord(), month: 1 });
      assert.equal(result.valid, true, result.errors.join("; "));
    });

    it("accepts month=12 (December)", () => {
      const result = validateEventData({ ...validRecord(), month: 12 });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── country ────────────────────────────────────────────────────────────────
  describe("country", () => {
    it("rejects missing country", () => {
      const rec = validRecord();
      delete rec.country;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("country")));
    });

    it("rejects empty country", () => {
      const result = validateEventData({ ...validRecord(), country: "" });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("country")));
    });

    it("accepts country=KR", () => {
      const result = validateEventData({ ...validRecord(), country: "KR" });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── name ───────────────────────────────────────────────────────────────────
  describe("name", () => {
    it("rejects missing name", () => {
      const rec = validRecord();
      delete rec.name;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("name")));
    });

    it("rejects whitespace-only name", () => {
      const result = validateEventData({ ...validRecord(), name: "   " });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("'name'")));
    });

    it("accepts Korean name", () => {
      const result = validateEventData({
        ...validRecord(),
        name: "5·18 광주민주화운동",
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── category ───────────────────────────────────────────────────────────────
  describe("category", () => {
    it("rejects missing category", () => {
      const rec = validRecord();
      delete rec.category;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("category")));
    });

    it("rejects unknown category value", () => {
      const result = validateEventData({
        ...validRecord(),
        category: "unknown_category",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("category")));
    });

    const validCategories = [
      "massacre",
      "disaster",
      "political",
      "social",
      "memorial",
      "independence",
      "labor",
      "human_rights",
      "celebration",
      "commercial",
    ];

    for (const cat of validCategories) {
      it(`accepts category=${cat}`, () => {
        const result = validateEventData({ ...validRecord(), category: cat });
        assert.equal(
          result.valid,
          true,
          `category="${cat}" should be valid; errors: ${result.errors.join("; ")}`
        );
      });
    }
  });

  // ── risk_level ─────────────────────────────────────────────────────────────
  describe("risk_level", () => {
    it("rejects missing risk_level", () => {
      const rec = validRecord();
      delete rec.risk_level;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("risk_level")));
    });

    it("rejects invalid risk_level value 'extreme'", () => {
      const result = validateEventData({
        ...validRecord(),
        risk_level: "extreme",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("risk_level")));
    });

    for (const lvl of ["critical", "high", "medium", "low"]) {
      it(`accepts risk_level=${lvl}`, () => {
        const result = validateEventData({ ...validRecord(), risk_level: lvl });
        assert.equal(
          result.valid,
          true,
          `risk_level="${lvl}" should be valid; errors: ${result.errors.join("; ")}`
        );
      });
    }
  });

  // ── related_keywords ───────────────────────────────────────────────────────
  describe("related_keywords", () => {
    it("rejects missing related_keywords", () => {
      const rec = validRecord();
      delete rec.related_keywords;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("related_keywords")));
    });

    it("rejects string related_keywords (not an array)", () => {
      const result = validateEventData({
        ...validRecord(),
        related_keywords: "탱크",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("related_keywords")));
    });

    it("rejects array with non-string element", () => {
      const result = validateEventData({
        ...validRecord(),
        related_keywords: ["탱크", 518],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("related_keywords")));
    });

    it("accepts an empty array", () => {
      const result = validateEventData({
        ...validRecord(),
        related_keywords: [],
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });

    it("accepts an array of strings", () => {
      const result = validateEventData({
        ...validRecord(),
        related_keywords: ["탱크", "계엄", "발포"],
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── related_motifs ─────────────────────────────────────────────────────────
  describe("related_motifs", () => {
    it("rejects missing related_motifs", () => {
      const rec = validRecord();
      delete rec.related_motifs;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("related_motifs")));
    });

    it("rejects non-array related_motifs", () => {
      const result = validateEventData({
        ...validRecord(),
        related_motifs: "탱크",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("related_motifs")));
    });

    it("accepts an empty array", () => {
      const result = validateEventData({
        ...validRecord(),
        related_motifs: [],
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── recommended_tone ───────────────────────────────────────────────────────
  describe("recommended_tone", () => {
    it("rejects missing recommended_tone", () => {
      const rec = validRecord();
      delete rec.recommended_tone;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("recommended_tone")));
    });

    it("rejects invalid recommended_tone 'happy'", () => {
      const result = validateEventData({
        ...validRecord(),
        recommended_tone: "happy",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("recommended_tone")));
    });

    for (const tone of ["avoid", "memorial", "neutral", "celebration"]) {
      it(`accepts recommended_tone=${tone}`, () => {
        const result = validateEventData({
          ...validRecord(),
          recommended_tone: tone,
        });
        assert.equal(
          result.valid,
          true,
          `recommended_tone="${tone}" should be valid; errors: ${result.errors.join("; ")}`
        );
      });
    }
  });

  // ── summary ────────────────────────────────────────────────────────────────
  describe("summary", () => {
    it("rejects missing summary", () => {
      const rec = validRecord();
      delete rec.summary;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("summary")));
    });

    it("rejects empty summary", () => {
      const result = validateEventData({ ...validRecord(), summary: "" });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("summary")));
    });

    it("accepts a non-empty summary", () => {
      const result = validateEventData({
        ...validRecord(),
        summary: "사건 요약 텍스트.",
      });
      assert.equal(result.valid, true, result.errors.join("; "));
    });
  });

  // ── references ─────────────────────────────────────────────────────────────
  describe("references", () => {
    it("rejects missing references", () => {
      const rec = validRecord();
      delete rec.references;
      const result = validateEventData(rec);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("references")));
    });

    it("rejects non-array references", () => {
      const result = validateEventData({
        ...validRecord(),
        references: "https://example.com",
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("references")));
    });

    it("rejects empty references array", () => {
      const result = validateEventData({ ...validRecord(), references: [] });
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes("references")),
        `Expected references error, got: ${result.errors.join("; ")}`
      );
    });

    it("rejects reference with missing label", () => {
      const result = validateEventData({
        ...validRecord(),
        references: [{ url: "https://example.com", type: "official" }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("label")));
    });

    it("rejects reference with missing url", () => {
      const result = validateEventData({
        ...validRecord(),
        references: [{ label: "출처", type: "official" }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("url")));
    });

    it("rejects reference with invalid type 'newspaper'", () => {
      const result = validateEventData({
        ...validRecord(),
        references: [
          { label: "출처", url: "https://example.com", type: "newspaper" },
        ],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("type")));
    });

    for (const type of ["official", "academic", "media", "wiki"]) {
      it(`accepts reference.type=${type}`, () => {
        const result = validateEventData({
          ...validRecord(),
          references: [{ label: "출처", url: "https://example.com", type }],
        });
        assert.equal(
          result.valid,
          true,
          `reference.type="${type}" should be valid; errors: ${result.errors.join("; ")}`
        );
      });
    }

    it("collects errors for multiple bad reference entries", () => {
      const result = validateEventData({
        ...validRecord(),
        references: [
          { label: "", url: "https://example.com", type: "official" },
          { label: "출처", url: "", type: "official" },
        ],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.length >= 2);
    });
  });

  // ── all required fields missing at once ────────────────────────────────────
  describe("all required fields missing", () => {
    it("accumulates errors for every required field", () => {
      const result = validateEventData({});
      assert.equal(result.valid, false);

      const requiredFields = [
        "slug",
        "date_type",
        "month",
        "country",
        "name",
        "category",
        "risk_level",
        "related_keywords",
        "related_motifs",
        "recommended_tone",
        "summary",
        "references",
      ];

      for (const field of requiredFields) {
        assert.ok(
          result.errors.some((e) => e.includes(field)),
          `Expected error for '${field}'; got: ${result.errors.join(" | ")}`
        );
      }
    });
  });
});

// ---------------------------------------------------------------------------
// validateEventSchema — file I/O tests
// ---------------------------------------------------------------------------

describe("validateEventSchema", () => {
  describe("file I/O handling", () => {
    it("returns error for non-existent file", () => {
      const result = validateEventSchema("/non/existent/path/event.json");
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors[0].includes("Cannot read"));
    });

    it("returns error for malformed JSON", () => {
      const filePath = writeTempJson("{}" /* placeholder */, "bad-json.txt");
      writeFileSync(filePath, "{ not valid json }", "utf-8");
      const result = validateEventSchema(filePath);
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it("returns valid=true for a correct event JSON file", () => {
      const filePath = writeTempJson(validRecord(), "valid-event.json");
      const result = validateEventSchema(filePath);
      assert.equal(result.valid, true, result.errors.join("; "));
    });

    it("returns valid=false for a file missing slug and risk_level", () => {
      const bad = { ...validRecord() };
      delete (bad as Record<string, unknown>).slug;
      delete (bad as Record<string, unknown>).risk_level;
      const filePath = writeTempJson(bad, "missing-fields.json");
      const result = validateEventSchema(filePath);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("slug")));
      assert.ok(result.errors.some((e) => e.includes("risk_level")));
    });
  });

  describe("real event files pass validation", () => {
    const realFiles = [
      "0518-gwangju-uprising.json",
      "0416-sewol-ferry.json",
      "0815-liberation-day.json",
      "0625-korean-war.json",
      "0403-jeju-uprising.json",
    ];

    for (const filename of realFiles) {
      it(`${filename} is schema-valid`, () => {
        const absPath = join(DATA_EVENTS_DIR, filename);
        const result = validateEventSchema(absPath);
        assert.equal(
          result.valid,
          true,
          `${filename}: ${result.errors.join("; ")}`
        );
      });
    }
  });
});
