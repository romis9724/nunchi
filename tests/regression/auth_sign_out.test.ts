/**
 * Unit tests for signOut — Sub-AC 2.3 (Phase 3a Auth)
 *
 * Verifies:
 *   1. supabase.auth.signOut() is called exactly once on a successful sign-out.
 *   2. The function returns { redirectUrl: "/" } (home redirect) after sign-out.
 *   3. A custom homePath is respected when provided.
 *   4. A Supabase sign-out error is surfaced as a thrown Error.
 *   5. No Supabase error leaves the session cleared (signOut was called).
 *
 * A mock SignOutClient is injected via the optional `supabaseClient` parameter
 * to avoid any real network or @supabase/supabase-js calls.
 *
 * Run: tsx --test regression/auth_sign_out.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  signOut,
  type SignOutClient,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function createMockSignOutClient(
  returnError: { message: string } | null = null
): { client: SignOutClient; callCount: number } {
  const state = { callCount: 0 };

  const client: SignOutClient = {
    auth: {
      async signOut() {
        state.callCount += 1;
        return { error: returnError };
      },
    },
  };

  return { client, callCount: state.callCount, ...{ get callCount() { return state.callCount; } } };
}

// Simpler factory that returns a plain counter object
function makeSignOutMock(
  returnError: { message: string } | null = null
): { client: SignOutClient; calls: number[] } {
  const calls: number[] = [];

  const client: SignOutClient = {
    auth: {
      async signOut() {
        calls.push(Date.now());
        return { error: returnError };
      },
    },
  };

  return { client, calls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("signOut — session clear and home redirect (Sub-AC 2.3)", () => {
  it("calls supabase.auth.signOut() exactly once", async () => {
    // Arrange
    const { client, calls } = makeSignOutMock();

    // Act
    await signOut(undefined, client);

    // Assert
    assert.equal(
      calls.length,
      1,
      "supabase.auth.signOut() must be called exactly once"
    );
  });

  it("returns redirectUrl '/' (home) after successful sign-out", async () => {
    // Arrange
    const { client } = makeSignOutMock();

    // Act
    const result = await signOut(undefined, client);

    // Assert
    assert.equal(
      result.redirectUrl,
      "/",
      "redirectUrl must be '/' on successful sign-out"
    );
  });

  it("returns the custom homePath when provided", async () => {
    // Arrange
    const { client } = makeSignOutMock();
    const customHome = "/landing";

    // Act
    const result = await signOut(customHome, client);

    // Assert
    assert.equal(
      result.redirectUrl,
      customHome,
      "redirectUrl must equal the custom homePath when provided"
    );
  });

  it("still calls signOut before returning the redirect", async () => {
    // Arrange — verify call happened even before we inspect result
    const { client, calls } = makeSignOutMock();
    const customHome = "/home";

    // Act
    await signOut(customHome, client);

    // Assert
    assert.equal(
      calls.length,
      1,
      "signOut must be called regardless of homePath"
    );
  });

  it("throws an Error when Supabase returns a sign-out error", async () => {
    // Arrange
    const { client } = makeSignOutMock({ message: "session not found" });

    // Act & Assert
    await assert.rejects(
      () => signOut(undefined, client),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("Sign-out failed"),
          `Expected 'Sign-out failed' in message, got: ${err.message}`
        );
        assert.ok(
          err.message.includes("session not found"),
          `Expected original error message forwarded, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("calls signOut even when the client will return an error (session clear attempted)", async () => {
    // Arrange
    const { client, calls } = makeSignOutMock({ message: "network error" });

    // Act — allow the rejection
    await signOut(undefined, client).catch(() => {
      /* expected */
    });

    // Assert: signOut was still invoked (session clear was attempted)
    assert.equal(
      calls.length,
      1,
      "supabase.auth.signOut() must be invoked even when it returns an error"
    );
  });
});
