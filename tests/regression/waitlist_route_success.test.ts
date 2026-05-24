/**
 * Integration tests for POST /api/waitlist success path — Sub-AC 8c-2
 *
 * Verifies:
 *   1. When valid input is provided, `upsertWaitlistEmail` is called first.
 *   2. `sendWaitlistConfirmationEmail` is called second (after the upsert).
 *   3. The handler returns HTTP 2xx (200) with { success: true }.
 *
 * Both the upsert function and the email function are injected as mocks that
 * resolve successfully, so no real DB or Resend API calls are made.
 *
 * Run: tsx --test regression/waitlist_route_success.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleWaitlistPost,
  type WaitlistUpsertFn,
  type WaitlistEmailFn,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Sub-AC 8c-2: valid input → upsert first, email second, 2xx returned
// ---------------------------------------------------------------------------

describe("handleWaitlistPost — Sub-AC 8c-2: success path — upsert then email, 2xx", () => {
  // ── Primary ordering assertion ────────────────────────────────────────────

  it("calls upsertFn before sendEmailFn when both mocks succeed", async () => {
    // Arrange: record the call order using a shared array
    const callOrder: string[] = [];

    const upsertFn: WaitlistUpsertFn = async (_email, _source) => {
      callOrder.push("upsert");
    };

    const emailFn: WaitlistEmailFn = async (_email) => {
      callOrder.push("email");
    };

    // Act
    const result = await handleWaitlistPost(
      { email: "test@example.com", source: "landing" },
      upsertFn,
      emailFn
    );

    // Assert: 2xx response
    assert.equal(result.status, 200, "must return HTTP 200 for valid input");
    assert.deepEqual(result.body, { success: true }, "body must be { success: true }");

    // Assert: both mocks were invoked exactly once
    assert.equal(callOrder.length, 2, "both upsertFn and sendEmailFn must be called");

    // Assert: upsert precedes email
    assert.equal(callOrder[0], "upsert", "upsertFn must be called first");
    assert.equal(callOrder[1], "email", "sendEmailFn must be called second");
  });

  // ── upsertFn call details ─────────────────────────────────────────────────

  it("upsertFn receives the normalised email and source from the request body", async () => {
    // Arrange
    const upsertCalls: { email: string; source: string }[] = [];
    const emailCalls: string[] = [];

    const upsertFn: WaitlistUpsertFn = async (email, source) => {
      upsertCalls.push({ email, source });
    };

    const emailFn: WaitlistEmailFn = async (email) => {
      emailCalls.push(email);
    };

    // Act
    await handleWaitlistPost(
      { email: "  User@EXAMPLE.com  ", source: "homepage" },
      upsertFn,
      emailFn
    );

    // Assert: upsert receives trimmed + lowercased email
    assert.equal(upsertCalls.length, 1, "upsertFn must be called exactly once");
    assert.equal(
      upsertCalls[0].email,
      "user@example.com",
      "email passed to upsertFn must be trimmed and lowercased"
    );
    assert.equal(
      upsertCalls[0].source,
      "homepage",
      "source passed to upsertFn must match the request body"
    );

    // Assert: email fn also receives normalised email
    assert.equal(emailCalls.length, 1, "sendEmailFn must be called exactly once");
    assert.equal(
      emailCalls[0],
      "user@example.com",
      "email passed to sendEmailFn must match the normalised upsert email"
    );
  });

  // ── Default source value ──────────────────────────────────────────────────

  it("defaults source to 'landing' when not present in body — both functions still called", async () => {
    // Arrange
    const callOrder: string[] = [];
    const upsertSources: string[] = [];

    const upsertFn: WaitlistUpsertFn = async (_email, source) => {
      upsertSources.push(source);
      callOrder.push("upsert");
    };

    const emailFn: WaitlistEmailFn = async (_email) => {
      callOrder.push("email");
    };

    // Act
    const result = await handleWaitlistPost(
      { email: "no-source@example.com" },
      upsertFn,
      emailFn
    );

    // Assert
    assert.equal(result.status, 200, "must return 200 when source is absent");
    assert.equal(upsertSources[0], "landing", "source must default to 'landing'");
    assert.deepEqual(callOrder, ["upsert", "email"], "both functions must be called in order");
  });

  // ── Idempotency across multiple valid calls ───────────────────────────────

  it("each separate call triggers exactly one upsert and one email — no cross-call accumulation", async () => {
    // Arrange
    const upsertCount = { n: 0 };
    const emailCount = { n: 0 };

    const upsertFn: WaitlistUpsertFn = async () => { upsertCount.n++; };
    const emailFn: WaitlistEmailFn   = async () => { emailCount.n++; };

    // Act: two independent calls
    const r1 = await handleWaitlistPost(
      { email: "first@example.com" }, upsertFn, emailFn
    );
    const r2 = await handleWaitlistPost(
      { email: "second@example.com" }, upsertFn, emailFn
    );

    // Assert
    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.equal(upsertCount.n, 2, "upsertFn must have been called once per request");
    assert.equal(emailCount.n, 2, "sendEmailFn must have been called once per request");
  });
});
