/**
 * Integration test: Sub-AC 5b
 *
 * Applies migrations/002_add_grade_to_reviews.sql to a real PostgreSQL test
 * database, then confirms via information_schema that the `grade` column was
 * actually added to the `reviews` table.
 *
 * Isolation strategy: a unique schema is created per test run and dropped
 * in the `after` cleanup hook, so no state leaks into other schemas/runs.
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
// Connection — prefer TEST_DATABASE_URL, fall back to local socket
// ---------------------------------------------------------------------------
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://localhost/postgres?host=/tmp`;

const MIGRATION_PATH = resolve(
  __dirname,
  "../../migrations/002_add_grade_to_reviews.sql"
);

// Unique schema name per run to guarantee isolation
const SCHEMA = `nunchi_migration_test_${Date.now()}`;

const pool = new Pool({ connectionString: TEST_DB_URL });

// ---------------------------------------------------------------------------
// Minimal DDL for the reviews table *without* the grade column.
// This reproduces the pre-migration state so the test is self-contained.
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
// Tests
// ---------------------------------------------------------------------------
describe("migration 002 integration — grade column added to reviews", () => {
  before(async () => {
    await pool.query(CREATE_SCHEMA);
    await pool.query(CREATE_REVIEWS);
  });

  after(async () => {
    await pool.query(DROP_SCHEMA);
    await pool.end();
  });

  it("pre-migration: reviews table exists but has NO grade column", async () => {
    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name   = 'reviews'
          AND column_name  = 'grade'`,
      [SCHEMA]
    );
    assert.equal(
      rows.length,
      0,
      "grade column must NOT exist before migration runs"
    );
  });

  it("migration applies without error", async () => {
    // Read the raw SQL and scope it to the test schema via search_path
    const migrationSql = readFileSync(MIGRATION_PATH, "utf-8");

    // Wrap in a transaction so the search_path override is safe
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`SET LOCAL search_path TO "${SCHEMA}", public`);
      // Should not throw
      await client.query(migrationSql);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  it("post-migration: information_schema shows grade column on reviews", async () => {
    const { rows } = await pool.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name   = 'reviews'
          AND column_name  = 'grade'`,
      [SCHEMA]
    );

    assert.equal(rows.length, 1, "grade column must exist in information_schema after migration");

    const col = rows[0];
    assert.equal(
      col.column_name,
      "grade",
      "column_name must be 'grade'"
    );
    assert.equal(
      col.data_type,
      "text",
      "grade column data_type must be 'text'"
    );
    assert.equal(
      col.is_nullable,
      "YES",
      "grade column must be nullable (no DEFAULT, added to existing rows)"
    );
  });

  it("post-migration: pg_catalog constraint confirms F/D/C/B/A check", async () => {
    // Look up the CHECK constraint via pg_catalog so we validate the DB
    // enforces the correct values, not just the file.
    const { rows } = await pool.query<{ consrc: string }>(
      `SELECT pg_get_constraintdef(con.oid) AS consrc
         FROM pg_catalog.pg_constraint  con
         JOIN pg_catalog.pg_class       cls  ON cls.oid = con.conrelid
         JOIN pg_catalog.pg_namespace   nsp  ON nsp.oid = cls.relnamespace
        WHERE nsp.nspname   = $1
          AND cls.relname   = 'reviews'
          AND con.contype   = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%grade%'`,
      [SCHEMA]
    );

    assert.ok(
      rows.length >= 1,
      "At least one CHECK constraint on grade must exist in pg_catalog"
    );

    const constraintDef = rows[0].consrc.toUpperCase();
    for (const grade of ["'F'", "'D'", "'C'", "'B'", "'A'"]) {
      assert.ok(
        constraintDef.includes(grade),
        `CHECK constraint must reference grade ${grade}, got: ${constraintDef}`
      );
    }
  });
});
