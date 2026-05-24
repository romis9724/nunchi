/**
 * Unit tests for POST /api/waitlist input validation — Sub-AC 8c-1
 *
 * Verifies that invalid inputs (missing email, malformed email, non-object
 * body) cause `handleWaitlistPost` to return a 4xx status WITHOUT invoking
 * the injected `upsertFn` (i.e. `upsertWaitlistEmail` would never be called
 * on the real path).
 *
 * A mock `upsertFn` records every invocation so tests can assert it was
 * never called on the invalid-input paths.
 *
 * Run: tsx --test regression/waitlist_route_validation.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleWaitlistPost,
  type WaitlistUpsertFn,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

interface UpsertCall {
  email: string;
  source: string;
}

function createMockUpsertFn(
  shouldThrow = false
): { fn: WaitlistUpsertFn; calls: UpsertCall[] } {
  const calls: UpsertCall[] = [];
  const fn: WaitlistUpsertFn = async (email, source) => {
    calls.push({ email, source });
    if (shouldThrow) {
      throw new Error("mock upsert error");
    }
  };
  return { fn, calls };
}

// ---------------------------------------------------------------------------
// Sub-AC 8c-1: invalid input → 4xx, upsertFn NOT called
// ---------------------------------------------------------------------------

describe("handleWaitlistPost — Sub-AC 8c-1: invalid input returns 4xx without upsert", () => {
  // ── Missing email field ────────────────────────────────────────────────

  it("returns 422 when the email field is absent — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ source: "landing" }, fn);

    // Assert: correct error status
    assert.equal(result.status, 422, "must return HTTP 422 for missing email");
    // Assert: upsert was never triggered
    assert.equal(calls.length, 0, "upsertFn must NOT be called when email is absent");
  });

  it("returns 422 when the email field is an empty string — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "" }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for empty email");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for empty email");
  });

  it("returns 422 when the email field is whitespace-only — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "   " }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for whitespace-only email");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for whitespace-only email");
  });

  // ── Malformed email format ─────────────────────────────────────────────

  it("returns 422 when email has no @ symbol — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "notanemail" }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for email without @");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for email without @");
  });

  it("returns 422 when email has no domain part — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "user@" }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for email with no domain");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for email with no domain");
  });

  it("returns 422 when email has no TLD — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "user@domain" }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for email with no TLD");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for email with no TLD");
  });

  it("returns 422 when email has no local part (starts with @) — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "@domain.com" }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for email with empty local part");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for email with empty local part");
  });

  it("returns 422 when email contains spaces — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "user name@domain.com" }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for email with spaces");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for email with spaces");
  });

  it("returns 422 when email is a number (non-string type) — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: 12345 }, fn);

    // Assert
    assert.equal(result.status, 422, "must return HTTP 422 for non-string email");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for non-string email");
  });

  // ── Structurally invalid body ──────────────────────────────────────────

  it("returns 400 when body is null — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost(null, fn);

    // Assert
    assert.equal(result.status, 400, "must return HTTP 400 for null body");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for null body");
  });

  it("returns 400 when body is an array (not a plain object) — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost([], fn);

    // Assert
    assert.equal(result.status, 400, "must return HTTP 400 for array body");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for array body");
  });

  it("returns 400 when body is a primitive string — upsertFn is NOT called", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost("just a string", fn);

    // Assert
    assert.equal(result.status, 400, "must return HTTP 400 for string body");
    assert.equal(calls.length, 0, "upsertFn must NOT be called for string body");
  });

  // ── Confirm upsertFn IS called on valid input ──────────────────────────

  it("calls upsertFn exactly once with normalised email when input is valid", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost(
      { email: "  Valid@Example.COM  ", source: "test" },
      fn
    );

    // Assert: successful response
    assert.equal(result.status, 200, "must return HTTP 200 for valid input");
    assert.deepEqual(result.body, { success: true });
    // Assert: upsert called once with normalised email
    assert.equal(calls.length, 1, "upsertFn must be called exactly once for valid input");
    assert.equal(
      calls[0].email,
      "valid@example.com",
      "email must be trimmed and lowercased before being passed to upsertFn"
    );
    assert.equal(
      calls[0].source,
      "test",
      "source from body must be forwarded to upsertFn"
    );
  });

  it("defaults source to 'landing' when not provided in body — upsertFn called once", async () => {
    // Arrange
    const { fn, calls } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "user@example.com" }, fn);

    // Assert
    assert.equal(result.status, 200, "must return HTTP 200 for valid input without source");
    assert.equal(calls.length, 1, "upsertFn must be called exactly once");
    assert.equal(calls[0].source, "landing", "source must default to 'landing'");
  });

  // ── Error response format ──────────────────────────────────────────────

  it("response body contains an 'error' key with a string value for 422 responses", async () => {
    // Arrange
    const { fn } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost({ email: "bad-email" }, fn);

    // Assert
    assert.equal(result.status, 422);
    assert.ok(
      typeof result.body.error === "string" && result.body.error.length > 0,
      "error body must have a non-empty string 'error' field"
    );
  });

  it("response body contains an 'error' key with a string value for 400 responses", async () => {
    // Arrange
    const { fn } = createMockUpsertFn();

    // Act
    const result = await handleWaitlistPost(null, fn);

    // Assert
    assert.equal(result.status, 400);
    assert.ok(
      typeof result.body.error === "string" && result.body.error.length > 0,
      "error body must have a non-empty string 'error' field"
    );
  });
});
