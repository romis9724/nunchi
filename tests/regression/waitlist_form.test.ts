/**
 * Unit tests for WaitlistForm submit behavior — Sub-AC 8d-1
 *
 * Verifies that when a valid email is submitted, POST /api/waitlist is called
 * with the correct payload { email, source } via an injected fetch mock.
 *
 * The core submit logic is extracted into `callWaitlistApi` in
 * apps/web/lib/waitlist.ts so it can be tested without a React/DOM
 * environment, following the same injectable-dependency pattern used by
 * `handleWaitlistPost`, `upsertWaitlistEmail`, etc.
 *
 * Run: tsx --test regression/waitlist_form.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  callWaitlistApi,
  type FetchFn,
  type WaitlistApiResult,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

interface FetchCall {
  url: string;
  method: string;
  contentType: string;
  body: Record<string, unknown>;
}

/**
 * Creates a mock `fetch` function that records every call and returns a
 * synthetic Response with the given HTTP status.
 */
function createMockFetch(status = 200): { fetchFn: FetchFn; calls: FetchCall[] } {
  const calls: FetchCall[] = [];

  const fetchFn: FetchFn = async (url, init) => {
    const rawBody = (init?.body as string) ?? "{}";
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const headers = (init?.headers ?? {}) as Record<string, string>;

    calls.push({
      url: url as string,
      method: init?.method ?? "GET",
      contentType: headers["Content-Type"] ?? "",
      body,
    });

    const isSuccess = status >= 200 && status < 300;
    const responseBody = isSuccess
      ? JSON.stringify({ success: true })
      : JSON.stringify({ error: "mock error" });

    return new Response(responseBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { fetchFn, calls };
}

// ---------------------------------------------------------------------------
// Sub-AC 8d-1: WaitlistForm — valid email → /api/waitlist called with correct payload
// ---------------------------------------------------------------------------

describe("WaitlistForm — callWaitlistApi — Sub-AC 8d-1: fetch called with correct payload", () => {
  // ── Endpoint ──────────────────────────────────────────────────────────────

  it("calls the /api/waitlist endpoint when a valid email is submitted", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();

    // Act
    await callWaitlistApi("user@example.com", "hero", fetchFn);

    // Assert
    assert.equal(calls.length, 1, "fetch must be called exactly once");
    assert.equal(calls[0].url, "/api/waitlist", "must call /api/waitlist endpoint");
  });

  // ── HTTP method + headers ────────────────────────────────────────────────

  it("sends a POST request with Content-Type application/json", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();

    // Act
    await callWaitlistApi("user@example.com", "hero", fetchFn);

    // Assert
    assert.equal(calls[0].method, "POST", "HTTP method must be POST");
    assert.equal(
      calls[0].contentType,
      "application/json",
      "Content-Type header must be application/json"
    );
  });

  // ── Payload — email ───────────────────────────────────────────────────────

  it("includes the submitted email in the request body payload", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();
    const email = "pmm@brand.kr";

    // Act
    await callWaitlistApi(email, "hero", fetchFn);

    // Assert
    assert.equal(
      calls[0].body.email,
      email,
      "payload must contain the submitted email under the 'email' key"
    );
  });

  it("preserves the email exactly as passed — no silent mutation inside callWaitlistApi", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();
    const email = "Newsletter@Brand.KR";

    // Act
    await callWaitlistApi(email, "hero", fetchFn);

    // Assert: the function must forward exactly what it received; normalisation
    // is the caller's (WaitlistForm's) responsibility.
    assert.equal(
      calls[0].body.email,
      email,
      "callWaitlistApi must not alter the email before sending it"
    );
  });

  // ── Payload — source ─────────────────────────────────────────────────────

  it("includes the source in the request body payload", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();

    // Act
    await callWaitlistApi("user@example.com", "bottom", fetchFn);

    // Assert
    assert.equal(
      calls[0].body.source,
      "bottom",
      "payload must contain the source value under the 'source' key"
    );
  });

  it("forwards different source values unchanged (hero vs bottom)", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();

    // Act
    await callWaitlistApi("a@example.com", "hero", fetchFn);
    await callWaitlistApi("b@example.com", "bottom", fetchFn);

    // Assert
    assert.equal(calls[0].body.source, "hero", "first call must use source='hero'");
    assert.equal(calls[1].body.source, "bottom", "second call must use source='bottom'");
  });

  // ── Payload shape ─────────────────────────────────────────────────────────

  it("request body contains both email and source keys — no extra keys beyond the spec", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();

    // Act
    await callWaitlistApi("user@example.com", "hero", fetchFn);

    // Assert: body must have exactly these two keys
    const bodyKeys = Object.keys(calls[0].body).sort();
    assert.deepEqual(
      bodyKeys,
      ["email", "source"],
      "request body must contain exactly { email, source }"
    );
  });

  // ── Return value ─────────────────────────────────────────────────────────

  it("returns ok:true when the server responds with 200", async () => {
    // Arrange
    const { fetchFn } = createMockFetch(200);

    // Act
    const result: WaitlistApiResult = await callWaitlistApi("user@example.com", "hero", fetchFn);

    // Assert
    assert.equal(result.ok, true, "must return ok:true on 2xx response");
    assert.equal(result.error, undefined, "error must be undefined on success");
  });

  it("returns ok:false with an error string when the server responds with 422", async () => {
    // Arrange
    const { fetchFn } = createMockFetch(422);

    // Act
    const result: WaitlistApiResult = await callWaitlistApi("user@example.com", "hero", fetchFn);

    // Assert
    assert.equal(result.ok, false, "must return ok:false on 4xx response");
    assert.ok(
      typeof result.error === "string" && result.error.length > 0,
      "error must be a non-empty string on failure"
    );
  });

  it("returns ok:false with an error string when the server responds with 500", async () => {
    // Arrange
    const { fetchFn } = createMockFetch(500);

    // Act
    const result: WaitlistApiResult = await callWaitlistApi("user@example.com", "hero", fetchFn);

    // Assert
    assert.equal(result.ok, false, "must return ok:false on 5xx response");
    assert.ok(
      typeof result.error === "string" && result.error.length > 0,
      "error must be a non-empty string on server error"
    );
  });

  // ── No duplicate calls ───────────────────────────────────────────────────

  it("each submission triggers exactly one fetch call — no duplicate requests", async () => {
    // Arrange
    const { fetchFn, calls } = createMockFetch();

    // Act: two independent form submissions
    await callWaitlistApi("first@example.com", "hero", fetchFn);
    await callWaitlistApi("second@example.com", "hero", fetchFn);

    // Assert
    assert.equal(calls.length, 2, "each submission must trigger exactly one fetch call");
    assert.equal(
      calls[0].body.email,
      "first@example.com",
      "first call must carry the first email"
    );
    assert.equal(
      calls[1].body.email,
      "second@example.com",
      "second call must carry the second email"
    );
  });
});
