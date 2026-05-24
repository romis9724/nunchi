/**
 * Integration tests for POST /api/waitlist DB error handling — Sub-AC 8c-3
 *
 * Verifies that when `upsertWaitlistEmail` (injected as upsertFn) throws an
 * exception:
 *   1. `sendWaitlistConfirmationEmail` (sendEmailFn) is NOT called.
 *   2. The handler returns the correct 5xx status code (500).
 *   3. The response body contains an `error` key.
 *
 * Both the upsert function (always throws) and the email function (spy) are
 * injected as mocks — no real DB or Resend API calls are made.
 *
 * Run: tsx --test regression/waitlist_route_db_error.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleWaitlistPost,
  type WaitlistUpsertFn,
  type WaitlistEmailFn,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

/** Creates a upsertFn mock that always throws the given error. */
function createThrowingUpsertFn(
  error: Error = new Error("simulated DB failure")
): { fn: WaitlistUpsertFn } {
  const fn: WaitlistUpsertFn = async (_email, _source) => {
    throw error;
  };
  return { fn };
}

/** Creates an emailFn spy that records every invocation. */
function createEmailSpy(): { fn: WaitlistEmailFn; calls: string[] } {
  const calls: string[] = [];
  const fn: WaitlistEmailFn = async (email) => {
    calls.push(email);
  };
  return { fn, calls };
}

// ---------------------------------------------------------------------------
// Sub-AC 8c-3: upsertFn throws → sendEmailFn NOT called, 5xx returned
// ---------------------------------------------------------------------------

describe("handleWaitlistPost — Sub-AC 8c-3: DB error → 5xx, sendEmailFn not called", () => {
  // ── Core invariant: email not sent when upsert fails ─────────────────────

  it("does NOT call sendEmailFn when upsertFn throws", async () => {
    // Arrange
    const { fn: upsertFn } = createThrowingUpsertFn();
    const { fn: emailFn, calls: emailCalls } = createEmailSpy();

    // Act
    await handleWaitlistPost(
      { email: "test@example.com", source: "landing" },
      upsertFn,
      emailFn
    );

    // Assert: email function was never triggered
    assert.equal(
      emailCalls.length,
      0,
      "sendEmailFn must NOT be called when upsertFn throws"
    );
  });

  // ── HTTP status must be 5xx ───────────────────────────────────────────────

  it("returns HTTP 500 when upsertFn throws", async () => {
    // Arrange
    const { fn: upsertFn } = createThrowingUpsertFn();
    const { fn: emailFn } = createEmailSpy();

    // Act
    const result = await handleWaitlistPost(
      { email: "test@example.com", source: "landing" },
      upsertFn,
      emailFn
    );

    // Assert: correct 5xx status
    assert.equal(
      result.status,
      500,
      "must return HTTP 500 when upsertFn throws"
    );
  });

  // ── Response body must include error key ─────────────────────────────────

  it("returns a non-empty error message in the response body when upsertFn throws", async () => {
    // Arrange
    const { fn: upsertFn } = createThrowingUpsertFn();
    const { fn: emailFn } = createEmailSpy();

    // Act
    const result = await handleWaitlistPost(
      { email: "test@example.com", source: "landing" },
      upsertFn,
      emailFn
    );

    // Assert: error key present and non-empty
    assert.ok(
      typeof result.body.error === "string" && result.body.error.length > 0,
      "response body must contain a non-empty 'error' string when upsertFn throws"
    );
  });

  // ── Combined: status + no email + error body in a single call ────────────

  it("returns 5xx + no email call + error body — all three invariants in one call", async () => {
    // Arrange
    const { fn: upsertFn } = createThrowingUpsertFn(
      new Error("connection refused")
    );
    const { fn: emailFn, calls: emailCalls } = createEmailSpy();

    // Act
    const result = await handleWaitlistPost(
      { email: "user@domain.co.kr", source: "homepage" },
      upsertFn,
      emailFn
    );

    // Assert: 5xx
    assert.ok(
      result.status >= 500 && result.status < 600,
      `status must be 5xx, got ${result.status}`
    );
    // Assert: sendEmailFn not invoked
    assert.equal(
      emailCalls.length,
      0,
      "sendEmailFn must not be called when upsertFn throws"
    );
    // Assert: error body
    assert.ok(
      typeof result.body.error === "string",
      "response body must have an 'error' string field"
    );
  });

  // ── Different error types propagate the same way ──────────────────────────

  it("returns 5xx regardless of the error type thrown by upsertFn (TypeError)", async () => {
    // Arrange: TypeError (e.g. null deref in DB client)
    const { fn: upsertFn } = createThrowingUpsertFn(
      new TypeError("Cannot read properties of null")
    );
    const { fn: emailFn, calls: emailCalls } = createEmailSpy();

    // Act
    const result = await handleWaitlistPost(
      { email: "another@example.com" },
      upsertFn,
      emailFn
    );

    // Assert
    assert.ok(
      result.status >= 500 && result.status < 600,
      `status must be 5xx for TypeError, got ${result.status}`
    );
    assert.equal(emailCalls.length, 0, "sendEmailFn must not be called for TypeError");
  });

  it("returns 5xx regardless of the error type thrown by upsertFn (string throw)", async () => {
    // Arrange: non-Error throw (some DB clients throw strings)
    const fn: WaitlistUpsertFn = async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "DB_CONNECTION_LOST";
    };
    const { fn: emailFn, calls: emailCalls } = createEmailSpy();

    // Act
    const result = await handleWaitlistPost(
      { email: "another@example.com" },
      fn,
      emailFn
    );

    // Assert
    assert.ok(
      result.status >= 500 && result.status < 600,
      `status must be 5xx for string throw, got ${result.status}`
    );
    assert.equal(emailCalls.length, 0, "sendEmailFn must not be called for string throw");
  });

  // ── Successful upsert still triggers email (regression guard) ─────────────

  it("calls sendEmailFn exactly once when upsertFn resolves — confirming email bypass is specific to failures", async () => {
    // Arrange: upsert that succeeds
    const upsertFn: WaitlistUpsertFn = async () => { /* no-op */ };
    const { fn: emailFn, calls: emailCalls } = createEmailSpy();

    // Act
    const result = await handleWaitlistPost(
      { email: "success@example.com", source: "landing" },
      upsertFn,
      emailFn
    );

    // Assert: 2xx response
    assert.equal(result.status, 200, "successful upsert must yield 200");
    // Assert: email was triggered exactly once
    assert.equal(
      emailCalls.length,
      1,
      "sendEmailFn must be called once when upsertFn succeeds"
    );
    assert.equal(
      emailCalls[0],
      "success@example.com",
      "sendEmailFn must receive the normalised email"
    );
  });
});
