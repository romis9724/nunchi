/**
 * Static validation test for migrations/002_add_grade_to_reviews.sql
 *
 * Verifies that the migration file contains:
 *  1. An ALTER TABLE reviews statement
 *  2. An ADD COLUMN clause for "grade"
 *  3. A column type of TEXT (or equivalent)
 *  4. A CHECK constraint that restricts values to F, D, C, B, A
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(__dirname, "../../migrations/002_add_grade_to_reviews.sql");

function normalizeSql(sql: string): string {
  // Collapse whitespace and convert to uppercase for easier matching
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim().toUpperCase();
}

describe("migrations/002_add_grade_to_reviews.sql", () => {
  let sql: string;
  let normalized: string;

  it("file exists and is non-empty", () => {
    sql = readFileSync(MIGRATION_PATH, "utf-8");
    assert.ok(sql.trim().length > 0, "Migration file must not be empty");
    normalized = normalizeSql(sql);
  });

  it("contains ALTER TABLE reviews", () => {
    normalized = normalizeSql(readFileSync(MIGRATION_PATH, "utf-8"));
    assert.match(
      normalized,
      /ALTER TABLE\s+REVIEWS/,
      "Must contain ALTER TABLE reviews"
    );
  });

  it("adds a grade column", () => {
    normalized = normalizeSql(readFileSync(MIGRATION_PATH, "utf-8"));
    assert.match(
      normalized,
      /ADD COLUMN(\s+IF NOT EXISTS)?\s+GRADE/,
      "Must ADD COLUMN grade (with optional IF NOT EXISTS)"
    );
  });

  it("specifies TEXT type for grade column", () => {
    normalized = normalizeSql(readFileSync(MIGRATION_PATH, "utf-8"));
    assert.match(
      normalized,
      /GRADE\s+TEXT/,
      "grade column must be of type TEXT"
    );
  });

  it("includes CHECK constraint with all five grades F, D, C, B, A", () => {
    normalized = normalizeSql(readFileSync(MIGRATION_PATH, "utf-8"));
    assert.match(normalized, /CHECK\s*\(/, "Must include a CHECK constraint");
    for (const grade of ["'F'", "'D'", "'C'", "'B'", "'A'"]) {
      assert.ok(
        normalized.includes(grade),
        `CHECK constraint must include grade ${grade}`
      );
    }
  });

  it("CHECK constraint contains exactly the five permitted grades", () => {
    // Extract the check constraint body
    const raw = readFileSync(MIGRATION_PATH, "utf-8").toUpperCase();
    const match = raw.match(/CHECK\s*\(([^)]+)\)/);
    assert.ok(match, "Could not find CHECK(...) block in migration");

    const checkBody = match[1];
    const found = [...checkBody.matchAll(/'([A-Z])'/g)].map((m) => m[1]);
    const expected = new Set(["F", "D", "C", "B", "A"]);
    const actual = new Set(found);

    assert.deepEqual(
      actual,
      expected,
      `CHECK constraint must contain exactly {F,D,C,B,A}, got {${[...actual].join(",")}}`
    );
  });
});
