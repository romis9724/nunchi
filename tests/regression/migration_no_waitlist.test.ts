/**
 * Migration-file scanner — Sub-AC 3a
 *
 * Reads every SQL file in the Supabase migrations directory and asserts that
 * no statement creates, alters, or seeds a `waitlist` table or column.
 *
 * The test fails if any migration file contains SQL that:
 *   - CREATE TABLE [IF NOT EXISTS] waitlist
 *   - ALTER TABLE waitlist
 *   - ADD COLUMN [IF NOT EXISTS] waitlist
 *   - INSERT INTO waitlist
 *   - Any column definition named "waitlist"
 *
 * Run: tsx --test regression/migration_no_waitlist.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, "../../migrations");

/**
 * Strip SQL line comments and normalize whitespace for reliable matching.
 */
function normalizeSql(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ") // remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, " ") // remove block comments
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Collect all .sql files in a directory (non-recursive, flat scan).
 */
function collectSqlFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((name) => extname(name).toLowerCase() === ".sql")
      .map((name) => join(dir, name))
      .filter((filePath) => statSync(filePath).isFile())
      .sort();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Patterns that indicate waitlist table/column creation, alteration, or seeding
// ---------------------------------------------------------------------------

/**
 * Returns true if the normalised SQL contains any statement that creates,
 * alters, or seeds a `waitlist` table or column.
 */
function containsWaitlistStatement(normalized: string): boolean {
  // CREATE TABLE [IF NOT EXISTS] waitlist
  if (/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?WAITLIST(\s|;|$|\()/.test(normalized)) {
    return true;
  }

  // ALTER TABLE waitlist
  if (/ALTER\s+TABLE\s+(IF\s+EXISTS\s+)?WAITLIST(\s|;|$)/.test(normalized)) {
    return true;
  }

  // INSERT INTO waitlist
  if (/INSERT\s+(IGNORE\s+)?INTO\s+WAITLIST(\s|;|$|\()/.test(normalized)) {
    return true;
  }

  // UPSERT INTO waitlist (non-standard but defensive)
  if (/UPSERT\s+INTO\s+WAITLIST(\s|;|$|\()/.test(normalized)) {
    return true;
  }

  // ADD COLUMN [IF NOT EXISTS] waitlist (adding a column named waitlist)
  if (/ADD\s+COLUMN\s+(IF\s+NOT\s+EXISTS\s+)?WAITLIST(\s|;|$)/.test(normalized)) {
    return true;
  }

  // DROP TABLE waitlist and recreate is still a seed concern — but
  // the AC targets CREATE / ALTER / seed only, so we stop here.

  return false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("migrations/ — no waitlist table or column", () => {
  it("migrations directory exists and is accessible", () => {
    let accessible = false;
    try {
      readdirSync(MIGRATIONS_DIR);
      accessible = true;
    } catch {
      accessible = false;
    }
    assert.ok(
      accessible,
      `Migrations directory must exist at: ${MIGRATIONS_DIR}`
    );
  });

  it("collects at least one .sql migration file", () => {
    const files = collectSqlFiles(MIGRATIONS_DIR);
    assert.ok(
      files.length > 0,
      "Expected at least one .sql file in the migrations directory"
    );
  });

  it("no migration file creates, alters, or seeds a waitlist table", () => {
    const files = collectSqlFiles(MIGRATIONS_DIR);
    const violations: string[] = [];

    for (const filePath of files) {
      const sql = readFileSync(filePath, "utf-8");
      const normalized = normalizeSql(sql);

      if (containsWaitlistStatement(normalized)) {
        violations.push(filePath);
      }
    }

    assert.deepEqual(
      violations,
      [],
      `The following migration files contain waitlist table/column statements (none allowed):\n${violations.join("\n")}`
    );
  });

  it("no migration file references the word 'waitlist' in a DML or DDL context", () => {
    // Broader check: any waitlist keyword in a SQL statement context
    // (ignores pure comments which have already been stripped by normalizeSql)
    const files = collectSqlFiles(MIGRATIONS_DIR);
    const violations: { file: string; context: string }[] = [];

    for (const filePath of files) {
      const sql = readFileSync(filePath, "utf-8");
      const normalized = normalizeSql(sql);

      // Look for any occurrence of WAITLIST as a SQL identifier
      // (word boundary ensures we don't match e.g. "nowaitlist")
      const match = normalized.match(/\bWAITLIST\b/);
      if (match) {
        const idx = normalized.indexOf("WAITLIST");
        const context = normalized.slice(Math.max(0, idx - 40), idx + 50).trim();
        violations.push({ file: filePath, context });
      }
    }

    assert.deepEqual(
      violations,
      [],
      `The following migration files reference 'waitlist' in SQL:\n${violations
        .map((v) => `  ${v.file}: "...${v.context}..."`)
        .join("\n")}`
    );
  });
});
