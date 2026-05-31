/**
 * Integration test: Sub-AC 5c
 *
 * Verifies that after applying migrations/002_add_grade_to_reviews.sql the
 * DB-level CHECK constraint on the `grade` column is live:
 *  • Valid values (F, D, C, B, A) INSERT successfully.
 *  • Out-of-range values (G, X, '', null-like string 'null') are rejected by
 *    PostgreSQL with a check-constraint violation (SQLSTATE 23514).
 *
 * Isolation strategy: a unique schema is created per run and dropped in the
 * `after` cleanup hook — no state leaks into other schemas or test runs.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Connection — prefer TEST_DATABASE_URL, fall back to local Unix socket
// ---------------------------------------------------------------------------
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://localhost/postgres?host=/tmp`;

const MIGRATION_PATH = resolve(
  __dirname,
  "../../migrations/002_add_grade_to_reviews.sql"
);

// Unique schema per run to guarantee isolation
const SCHEMA = `noonchi_grade_constraint_test_${Date.now()}`;

const pool = new Pool({ connectionString: TEST_DB_URL });

// ---------------------------------------------------------------------------
// Minimal DDL — reviews table *without* the grade column (pre-migration state)
// ---------------------------------------------------------------------------
const CREATE_SCHEMA = `CREATE SCHEMA "${SCHEMA}";`;

const CREATE_REVIEWS = `
  CREATE TABLE "${SCHEMA}".reviews (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash     TEXT NOT NULL UNIQUE,
    date           DATE NOT NULL,
    campaign_name  TEXT,
    copy           TEXT NOT NULL,
    asset_keywords TEXT[]   NOT NULL DEFAULT '{}',
    risk_score     TEXT     NOT NULL CHECK (risk_score IN ('safe', 'caution', 'danger', 'critical')),
    flagged_keywords TEXT[] NOT NULL DEFAULT '{}',
    matched_events JSONB    NOT NULL DEFAULT '[]',
    suggestions    TEXT[]   NOT NULL DEFAULT '{}',
    llm_rationale  TEXT     NOT NULL,
    rule_triggered BOOLEAN  NOT NULL DEFAULT FALSE,
    cached_until   TIMESTAMPTZ NOT NULL,
    reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const DROP_SCHEMA = `DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE;`;

// ---------------------------------------------------------------------------
// Helper: insert a row with a given grade value.
// Returns null on success, or the PostgreSQL error code on failure.
// ---------------------------------------------------------------------------
async function tryInsert(grade: string | null): Promise<null | string> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL search_path TO "${SCHEMA}", public`);
    await client.query(
      `INSERT INTO reviews
         (input_hash, date, copy, risk_score, llm_rationale, cached_until, grade)
       VALUES
         ($1, NOW()::DATE, 'test copy', 'safe', 'test rationale', NOW() + INTERVAL '7 days', $2)`,
      [`hash-${Date.now()}-${Math.random()}`, grade]
    );
    await client.query("COMMIT");
    return null; // success
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    // pg errors carry a `code` property (SQLSTATE)
    if (err && typeof err === "object" && "code" in err) {
      return (err as { code: string }).code;
    }
    throw err; // unexpected error — re-throw
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("grade column CHECK constraint — Sub-AC 5c", () => {
  // ---- Setup: create schema + table, then apply migration ----------------
  before(async () => {
    await pool.query(CREATE_SCHEMA);
    await pool.query(CREATE_REVIEWS);

    // Apply the migration inside a transaction scoped to our test schema
    const migrationSql = readFileSync(MIGRATION_PATH, "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`SET LOCAL search_path TO "${SCHEMA}", public`);
      await client.query(migrationSql);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  after(async () => {
    await pool.query(DROP_SCHEMA);
    await pool.end();
  });

  // ---- Valid grades: every permitted value must INSERT without error ------

  for (const validGrade of ["F", "D", "C", "B", "A"]) {
    it(`INSERT with grade='${validGrade}' succeeds`, async () => {
      const errorCode = await tryInsert(validGrade);
      assert.equal(
        errorCode,
        null,
        `Inserting valid grade '${validGrade}' must succeed (got SQLSTATE ${errorCode})`
      );
    });
  }

  // ---- NULL grade is allowed (column is nullable) ------------------------
  it("INSERT with grade=NULL succeeds (column is nullable)", async () => {
    const errorCode = await tryInsert(null);
    assert.equal(
      errorCode,
      null,
      "Inserting NULL grade must succeed because the column has no NOT NULL constraint"
    );
  });

  // ---- Invalid grades: must be rejected by CHECK constraint (23514) ------

  for (const invalidGrade of ["G", "X", "Z", "f", "a", "", "DANGER", "0"]) {
    it(`INSERT with grade='${invalidGrade}' is rejected (SQLSTATE 23514)`, async () => {
      const errorCode = await tryInsert(invalidGrade);
      assert.equal(
        errorCode,
        "23514",
        `Inserting invalid grade '${invalidGrade}' must fail with SQLSTATE 23514 (check_violation), got: ${errorCode}`
      );
    });
  }
});
