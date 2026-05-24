/**
 * Integration tests for POST /api/waitlist email error handling — Sub-AC 8c-4
 *
 * Verifies that when `upsertWaitlistEmail` (injected as upsertFn) succeeds
 * but `sendWaitlistConfirmationEmail` (injected as sendEmailFn) throws an
 * exception, the handler:
 *   1. Returns HTTP 200 (the user IS already on the waitlist).
 *   2. Returns `{ success: true }` in the response body.
 *   3. Does NOT propagate the email error to the caller.
 *
 * Email delivery is documented as best-effort in waitlist.ts: a Resend/SMTP
 * failure must never roll back a successful registration or change the HTTP
 * status code visible to the user.
 *
 * Both the upsert function (always resolves) and the email function
 * (always throws) are injected as mocks — no real DB or Resend API calls
 * are made.
 *
 * Run: tsx --test regression/waitlist_route_email_error.test.ts
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

/** Creates a upsertFn mock that always resolves (simulates DB success). */
function createSuccessfulUpsertFn(): { fn: WaitlistUpsertFn; calls: string[] } {
  const calls: string[] = [];
  const fn: WaitlistUpsertFn = async (email, _source) => {
    calls.push(email);
  };
  return { fn, calls };
}

/** Creates a sendEmailFn mock that always throws the given error. */
function createThrowingEmailFn(
  error: unknown = new Error("simulated email delivery failure")
): { fn: WaitlistEmailFn } {
  const fn: WaitlistEmailFn = async (_email) => {
    throw error;
  };
  return { fn };
}

// ---------------------------------------------------------------------------
// Sub-AC 8c-4: upsertFn succeeds, sendEmailFn throws → HTTP 200 returned
// ---------------------------------------------------------------------------

describe(
  "handleWaitlistPost — Sub-AC 8c-4: email error after successful upsert → HTTP 200",
  () => {
    // ── Core invariant: 200 when upsert succeeds + email throws ──────────────

    it("returns HTTP 200 when upsertFn resolves but sendEmailFn throws", async () => {
      // Arrange
      const { fn: upsertFn } = createSuccessfulUpsertFn();
      const { fn: emailFn } = createThrowingEmailFn();

      // Act
      const result = await handleWaitlistPost(
        { email: "test@example.com", source: "landing" },
        upsertFn,
        emailFn
      );

      // Assert: must return 200, not 500 or 502
      assert.equal(
        result.status,
        200,
        "must return HTTP 200 when upsertFn succeeds even though sendEmailFn throws"
      );
    });

    // ── Body must be { success: true } ───────────────────────────────────────

    it("returns { success: true } body when upsertFn resolves but sendEmailFn throws", async () => {
      // Arrange
      const { fn: upsertFn } = createSuccessfulUpsertFn();
      const { fn: emailFn } = createThrowingEmailFn();

      // Act
      const result = await handleWaitlistPost(
        { email: "test@example.com", source: "landing" },
        upsertFn,
        emailFn
      );

      // Assert: body must signal success, not expose the email failure
      assert.deepEqual(
        result.body,
        { success: true },
        "body must be { success: true } when upsertFn succeeds, regardless of email failure"
      );
    });

    // ── Upsert WAS called (email error happens after) ─────────────────────────

    it("confirms upsertFn was called exactly once before the email error", async () => {
      // Arrange
      const { fn: upsertFn, calls: upsertCalls } = createSuccessfulUpsertFn();
      const { fn: emailFn } = createThrowingEmailFn();

      // Act
      const result = await handleWaitlistPost(
        { email: "confirmed@example.com", source: "homepage" },
        upsertFn,
        emailFn
      );

      // Assert: upsert happened (this is why we still return 200)
      assert.equal(
        upsertCalls.length,
        1,
        "upsertFn must be called once before the email step"
      );
      assert.equal(
        upsertCalls[0],
        "confirmed@example.com",
        "upsertFn must receive the normalised email"
      );
      // And the response must be 200
      assert.equal(result.status, 200, "status must remain 200 after successful upsert");
    });

    // ── Different error types — all swallowed ─────────────────────────────────

    it("returns HTTP 200 when sendEmailFn throws a TypeError (e.g. null Resend client)", async () => {
      // Arrange
      const { fn: upsertFn } = createSuccessfulUpsertFn();
      const { fn: emailFn } = createThrowingEmailFn(
        new TypeError("Cannot read properties of null (reading 'send')")
      );

      // Act
      const result = await handleWaitlistPost(
        { email: "typecheck@example.com" },
        upsertFn,
        emailFn
      );

      // Assert: TypeError must not elevate to 5xx
      assert.equal(
        result.status,
        200,
        `TypeError from sendEmailFn must not change status from 200, got ${result.status}`
      );
    });

    it("returns HTTP 200 when sendEmailFn throws a string (non-Error throw)", async () => {
      // Arrange
      const { fn: upsertFn } = createSuccessfulUpsertFn();
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      const { fn: emailFn } = createThrowingEmailFn("RESEND_TIMEOUT");

      // Act
      const result = await handleWaitlistPost(
        { email: "stringthrow@example.com" },
        upsertFn,
        emailFn
      );

      // Assert: string throws must be swallowed too
      assert.equal(
        result.status,
        200,
        `string throw from sendEmailFn must not change status from 200, got ${result.status}`
      );
    });

    it("returns HTTP 200 when sendEmailFn throws a network Error", async () => {
      // Arrange
      const networkError = new Error("fetch failed: ECONNREFUSED");
      (networkError as NodeJS.ErrnoException).code = "ECONNREFUSED";

      const { fn: upsertFn } = createSuccessfulUpsertFn();
      const { fn: emailFn } = createThrowingEmailFn(networkError);

      // Act
      const result = await handleWaitlistPost(
        { email: "netfail@example.com", source: "waitlist-page" },
        upsertFn,
        emailFn
      );

      // Assert
      assert.equal(
        result.status,
        200,
        `network error from sendEmailFn must not change status from 200, got ${result.status}`
      );
      assert.deepEqual(result.body, { success: true });
    });

    // ── Combined: status + body + no propagation in a single call ─────────────

    it("all three invariants hold in a single call: 200 + { success: true } + no exception propagated", async () => {
      // Arrange
      const { fn: upsertFn, calls: upsertCalls } = createSuccessfulUpsertFn();
      const { fn: emailFn } = createThrowingEmailFn(
        new Error("Resend API rate limit exceeded")
      );

      // Act — must NOT throw
      let result: Awaited<ReturnType<typeof handleWaitlistPost>>;
      try {
        result = await handleWaitlistPost(
          { email: "allthree@example.com", source: "landing" },
          upsertFn,
          emailFn
        );
      } catch (err) {
        assert.fail(
          `handleWaitlistPost must not propagate email errors, but threw: ${String(err)}`
        );
      }

      // Assert: HTTP status
      assert.equal(result!.status, 200, "status must be 200");
      // Assert: body
      assert.deepEqual(result!.body, { success: true }, "body must be { success: true }");
      // Assert: upsert was called (proves the email error happened after the real work)
      assert.equal(upsertCalls.length, 1, "upsertFn must have been called once");
    });

    // ── Contrast with DB error path (regression guard) ────────────────────────

    it("returns 500 when ONLY upsertFn throws (confirming email path is a different branch)", async () => {
      // Arrange: upsertFn throws, emailFn resolves
      const upsertFn: WaitlistUpsertFn = async () => {
        throw new Error("DB failure");
      };
      const emailFn: WaitlistEmailFn = async () => { /* no-op */ };

      // Act
      const result = await handleWaitlistPost(
        { email: "dberror@example.com", source: "landing" },
        upsertFn,
        emailFn
      );

      // Assert: DB failure produces 500, unlike email failure which produces 200
      assert.equal(
        result.status,
        500,
        "upsertFn failure must produce 500 (contrasting with email failure → 200)"
      );
    });
  }
);
