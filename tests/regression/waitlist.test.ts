/**
 * Unit tests for upsertWaitlistEmail — Sub-AC 8a-1 & 8a-2
 *
 * Sub-AC 8a-1 verifies:
 *   1. A new email is upserted into the "waitlist" table via the Supabase client.
 *   2. The email is normalised (trimmed + lowercased) before insertion.
 *   3. updated_at is included and onConflict is set so duplicates update the timestamp.
 *   4. A Supabase error is surfaced as a thrown Error.
 *
 * Sub-AC 8a-2 verifies:
 *   1. Duplicate email → no new row inserted (only one row exists).
 *   2. updated_at is refreshed to the second call's timestamp.
 *   3. email, source, and created_at are preserved unchanged on duplicate.
 *   4. Each function call makes exactly one DB upsert call (no check+insert pattern).
 *
 * A mock Supabase client is injected via the optional `db` parameter to avoid
 * any real database calls.
 *
 * Run: tsx --test regression/waitlist.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { upsertWaitlistEmail, getWaitlistCount } from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

interface MockCall {
  table: string;
  data: { email: string; source: string; updated_at?: string };
  options: { onConflict: string; ignoreDuplicates?: boolean };
}

function createMockDb(returnError: { message: string } | null = null) {
  const calls: MockCall[] = [];

  const db = {
    from(table: string) {
      return {
        async upsert(
          data: { email: string; source: string; updated_at?: string },
          options: { onConflict: string; ignoreDuplicates?: boolean }
        ) {
          calls.push({ table, data: { ...data }, options });
          return { error: returnError };
        },
      };
    },
  };

  return { db, calls };
}

// ---------------------------------------------------------------------------
// Stateful mock — simulates PostgreSQL ON CONFLICT DO UPDATE behaviour
// ---------------------------------------------------------------------------

interface StatefulRow {
  email: string;
  source: string;
  updated_at: string;
  created_at: string;
}

function createStatefulMockDb() {
  const rows = new Map<string, StatefulRow>();
  const calls: MockCall[] = [];

  const db = {
    from(table: string) {
      return {
        async upsert(
          data: { email: string; source: string; updated_at?: string },
          options: { onConflict: string; ignoreDuplicates?: boolean }
        ) {
          calls.push({ table, data: { ...data }, options });
          const key = data.email;
          const existing = rows.get(key);
          const ts = data.updated_at ?? new Date().toISOString();
          if (existing) {
            // ON CONFLICT (email) DO UPDATE SET updated_at = excluded.updated_at
            // email, source, and created_at are NOT touched.
            if (!options.ignoreDuplicates) {
              rows.set(key, { ...existing, updated_at: ts });
            }
          } else {
            rows.set(key, {
              email: data.email,
              source: data.source,
              updated_at: ts,
              created_at: ts,
            });
          }
          return { error: null };
        },
      };
    },
  };

  return { db, calls, rows };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("upsertWaitlistEmail", () => {
  it("inserts a new email into the waitlist table", async () => {
    // Arrange
    const { db, calls } = createMockDb();

    // Act
    const result = await upsertWaitlistEmail("user@example.com", db);

    // Assert
    assert.equal(calls.length, 1, "upsert must be called exactly once");
    assert.equal(calls[0].table, "waitlist", "must target the 'waitlist' table");
    assert.equal(
      calls[0].data.email,
      "user@example.com",
      "email must be stored after normalisation"
    );
    assert.equal(
      calls[0].data.source,
      "landing",
      "source must default to 'landing'"
    );
    assert.deepEqual(result, { inserted: true }, "must return { inserted: true }");
  });

  it("normalises the email — trims whitespace and lowercases — before upserting", async () => {
    // Arrange
    const { db, calls } = createMockDb();

    // Act
    await upsertWaitlistEmail("  HELLO@Example.COM  ", db);

    // Assert
    assert.equal(
      calls[0].data.email,
      "hello@example.com",
      "email must be trimmed and lowercased"
    );
  });

  it("passes onConflict:'email' and includes updated_at so duplicates trigger DO UPDATE", async () => {
    // Arrange
    const { db, calls } = createMockDb();

    // Act
    await upsertWaitlistEmail("dup@example.com", db);

    // Assert: conflict target is the email column
    assert.equal(calls[0].options.onConflict, "email");
    // Assert: updated_at is in the payload so the DB can refresh it on conflict
    assert.ok(
      typeof calls[0].data.updated_at === "string" && calls[0].data.updated_at.length > 0,
      "updated_at must be a non-empty ISO string in the upsert payload"
    );
    // Assert: ignoreDuplicates is NOT set — the ON CONFLICT DO UPDATE path must run
    assert.ok(
      !calls[0].options.ignoreDuplicates,
      "ignoreDuplicates must not be set so conflict updates actually execute"
    );
  });

  it("throws an Error when Supabase returns an error object", async () => {
    // Arrange
    const { db } = createMockDb({ message: "unique_violation" });

    // Act & Assert
    await assert.rejects(
      () => upsertWaitlistEmail("fail@example.com", db),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("waitlist upsert failed"),
          `Expected message to contain 'waitlist upsert failed', got: ${err.message}`
        );
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Sub-AC 8a-2: duplicate email handling
// ---------------------------------------------------------------------------

describe("upsertWaitlistEmail — Sub-AC 8a-2: duplicate email → update only, no insert", () => {
  it("duplicate email causes no new row insert — only one row exists after two calls", async () => {
    // Arrange
    const { db, rows } = createStatefulMockDb();

    // Act
    await upsertWaitlistEmail("dup@example.com", db);
    await upsertWaitlistEmail("dup@example.com", db);

    // Assert: exactly one row in the DB (not two)
    assert.equal(rows.size, 1, "only one row must exist after duplicate submission");
    assert.equal(rows.has("dup@example.com"), true, "the row must be keyed by the submitted email");
  });

  it("duplicate call updates updated_at — final row carries the second call's timestamp", async () => {
    // Arrange
    const { db, calls, rows } = createStatefulMockDb();

    // Act: first submission
    await upsertWaitlistEmail("ts@example.com", db);
    // Act: duplicate submission
    await upsertWaitlistEmail("ts@example.com", db);

    const finalRow = rows.get("ts@example.com")!;
    const secondCallUpdatedAt = calls[1].data.updated_at;

    // Assert: the row must exist
    assert.ok(finalRow, "row must exist after two calls");
    // Assert: the stored updated_at matches what the second call provided
    assert.equal(
      finalRow.updated_at,
      secondCallUpdatedAt,
      "updated_at in final row must equal the second upsert call's timestamp"
    );
  });

  it("on duplicate, email, source, and created_at are preserved — only updated_at changes", async () => {
    // Arrange
    const { db, rows } = createStatefulMockDb();

    // Act: first insertion
    await upsertWaitlistEmail("preserve@example.com", db);
    const firstRow = rows.get("preserve@example.com")!;
    const { email: e1, source: s1, created_at: c1 } = firstRow;

    // Act: duplicate insertion
    await upsertWaitlistEmail("preserve@example.com", db);
    const { email: e2, source: s2, created_at: c2 } = rows.get("preserve@example.com")!;

    // Assert: email, source, and created_at are unchanged
    assert.equal(e2, e1, "email must not change on duplicate");
    assert.equal(s2, s1, "source must not change on duplicate");
    assert.equal(c2, c1, "created_at must not change on duplicate (not a new row)");
  });

  it("each function call makes exactly one DB upsert — no check-then-insert pattern", async () => {
    // Arrange
    const { db, calls } = createStatefulMockDb();

    // Act: two calls with the same email
    await upsertWaitlistEmail("once@example.com", db);
    await upsertWaitlistEmail("once@example.com", db);

    // Assert: exactly two DB operations total (one per function call)
    assert.equal(calls.length, 2, "must make exactly one DB call per function invocation");
    assert.equal(calls[0].options.onConflict, "email", "first call must set onConflict:email");
    assert.equal(calls[1].options.onConflict, "email", "second call must set onConflict:email");
  });
});

// ---------------------------------------------------------------------------
// Mock factory for getWaitlistCount — Sub-AC 8a-3
// ---------------------------------------------------------------------------

function createCountMockDb(
  rowCount: number | null,
  returnError: { message: string } | null = null
) {
  const db = {
    from(_table: "waitlist") {
      return {
        async select(
          _columns: string,
          _options: { count: "exact"; head: boolean }
        ) {
          return { count: rowCount, error: returnError };
        },
      };
    },
  };
  return { db };
}

// ---------------------------------------------------------------------------
// Sub-AC 8a-3: getWaitlistCount unit tests (0 rows, 1 row, N rows)
// ---------------------------------------------------------------------------

describe("getWaitlistCount — Sub-AC 8a-3: returns exact waitlist row count", () => {
  it("returns 0 when the waitlist table is empty", async () => {
    // Arrange
    const { db } = createCountMockDb(0);

    // Act
    const count = await getWaitlistCount(db);

    // Assert
    assert.equal(count, 0, "must return 0 for an empty table");
  });

  it("returns 1 when exactly one row exists", async () => {
    // Arrange
    const { db } = createCountMockDb(1);

    // Act
    const count = await getWaitlistCount(db);

    // Assert
    assert.equal(count, 1, "must return 1 when there is a single row");
  });

  it("returns N when N rows exist (N = 42)", async () => {
    // Arrange
    const { db } = createCountMockDb(42);

    // Act
    const count = await getWaitlistCount(db);

    // Assert
    assert.equal(count, 42, "must return 42 when there are 42 rows");
  });

  it("returns 0 when Supabase returns null count (no rows sentinel)", async () => {
    // Supabase may return count: null when head:true yields no results on some
    // configurations. The function must treat null as 0.
    const { db } = createCountMockDb(null);

    const count = await getWaitlistCount(db);

    assert.equal(count, 0, "null count from Supabase must be coerced to 0");
  });

  it("throws an Error when Supabase returns an error object", async () => {
    // Arrange
    const { db } = createCountMockDb(null, { message: "query_failed" });

    // Act & Assert
    await assert.rejects(
      () => getWaitlistCount(db),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("waitlist count failed"),
          `Expected message to contain 'waitlist count failed', got: ${err.message}`
        );
        return true;
      }
    );
  });
});
