/**
 * Unit tests for signInWithGoogle — Sub-AC 1 (Phase 3a Auth)
 *
 * Verifies:
 *   1. signInWithOAuth is called with provider: "google".
 *   2. redirectTo URL is correctly constructed from origin + redirectPath.
 *   3. The function returns the URL supplied by the mocked Supabase client.
 *   4. A Supabase auth error is surfaced as a thrown Error.
 *   5. The default redirectPath is "/auth/callback" when no path is provided.
 *   6. A custom origin + custom redirectPath are forwarded to redirectTo.
 *
 * A mock Supabase client is injected via the optional `supabaseClient`
 * parameter to avoid any real network or @supabase/supabase-js calls.
 *
 * Run: tsx --test regression/auth_sign_in_google.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  signInWithGoogle,
  type OAuthSignInClient,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

interface MockOAuthCall {
  provider: string;
  redirectTo: string | undefined;
}

function createMockSupabase(
  returnUrl: string | null = "https://accounts.google.com/o/oauth2/auth?mock",
  returnError: { message: string } | null = null
): { client: OAuthSignInClient; calls: MockOAuthCall[] } {
  const calls: MockOAuthCall[] = [];

  const client: OAuthSignInClient = {
    auth: {
      async signInWithOAuth(params) {
        calls.push({
          provider: params.provider,
          redirectTo: params.options?.redirectTo,
        });
        return {
          data: returnUrl !== null ? { url: returnUrl } : null,
          error: returnError,
        };
      },
    },
  };

  return { client, calls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("signInWithGoogle", () => {
  it("calls signInWithOAuth with provider: 'google'", async () => {
    // Arrange
    const { client, calls } = createMockSupabase();

    // Act
    await signInWithGoogle(
      { origin: "https://app.nunchi.so" },
      client
    );

    // Assert
    assert.equal(calls.length, 1, "signInWithOAuth must be called exactly once");
    assert.equal(
      calls[0].provider,
      "google",
      "provider must be 'google'"
    );
  });

  it("constructs redirectTo as origin + '/auth/callback' by default", async () => {
    // Arrange
    const { client, calls } = createMockSupabase();
    const origin = "https://app.nunchi.so";

    // Act
    await signInWithGoogle({ origin }, client);

    // Assert
    assert.equal(
      calls[0].redirectTo,
      `${origin}/auth/callback`,
      "redirectTo must be origin + default path /auth/callback"
    );
  });

  it("constructs redirectTo using a custom redirectPath", async () => {
    // Arrange
    const { client, calls } = createMockSupabase();
    const origin = "https://app.nunchi.so";
    const redirectPath = "/login/callback";

    // Act
    await signInWithGoogle({ origin, redirectPath }, client);

    // Assert
    assert.equal(
      calls[0].redirectTo,
      `${origin}${redirectPath}`,
      "redirectTo must combine origin and custom redirectPath"
    );
  });

  it("returns the URL from the Supabase response", async () => {
    // Arrange
    const expectedUrl = "https://accounts.google.com/o/oauth2/auth?test=1";
    const { client } = createMockSupabase(expectedUrl);

    // Act
    const result = await signInWithGoogle(
      { origin: "https://app.nunchi.so" },
      client
    );

    // Assert
    assert.equal(
      result.url,
      expectedUrl,
      "must return the URL from the Supabase response"
    );
  });

  it("returns url: null when Supabase returns data: null without an error", async () => {
    // Arrange
    const { client } = createMockSupabase(null);

    // Act
    const result = await signInWithGoogle(
      { origin: "https://app.nunchi.so" },
      client
    );

    // Assert
    assert.equal(
      result.url,
      null,
      "url must be null when Supabase returns no data"
    );
  });

  it("throws an Error when Supabase returns an error object", async () => {
    // Arrange
    const { client } = createMockSupabase(null, {
      message: "OAuth provider error",
    });

    // Act & Assert
    await assert.rejects(
      () =>
        signInWithGoogle({ origin: "https://app.nunchi.so" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("Google OAuth sign-in failed"),
          `Expected 'Google OAuth sign-in failed' in message, got: ${err.message}`
        );
        assert.ok(
          err.message.includes("OAuth provider error"),
          `Expected original error message in thrown Error, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("uses empty string as origin when no origin is provided (SSR safe)", async () => {
    // Arrange — no options means origin defaults to empty string (no window)
    const { client, calls } = createMockSupabase();

    // Act
    await signInWithGoogle({}, client);

    // Assert: redirectTo still a valid string (no undefined or crashes)
    assert.equal(typeof calls[0].redirectTo, "string");
    assert.ok(
      calls[0].redirectTo!.endsWith("/auth/callback"),
      "redirectTo must end with /auth/callback even with empty origin"
    );
  });
});
