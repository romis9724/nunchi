/**
 * Unit tests for resolveAuthCallbackRedirect — Sub-AC 2.2c (Phase 3a Auth)
 *
 * Verifies:
 *   1. When `code` is undefined (missing), the handler returns a redirectUrl
 *      pointing to the designated error path ("/auth/error" by default).
 *   2. When `code` is null, the handler returns a redirectUrl pointing to the
 *      designated error path.
 *   3. When exchangeCodeForSession returns an error object, the handler returns
 *      a redirectUrl pointing to the designated error path.
 *   4. When exchangeCodeForSession throws an exception, the handler returns a
 *      redirectUrl pointing to the designated error path.
 *   5. A custom errorPath is respected in all error scenarios.
 *
 * A mock AuthCallbackClient is injected to avoid any real network or
 * @supabase/supabase-js calls.
 *
 * Run: tsx --test regression/auth_callback_error_redirect.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveAuthCallbackRedirect,
  type AuthCallbackClient,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factory helpers
// ---------------------------------------------------------------------------

/** Creates a mock client whose exchangeCodeForSession returns a Supabase error. */
function createErrorClient(
  errorMessage: string
): AuthCallbackClient {
  return {
    auth: {
      async exchangeCodeForSession(_code: string) {
        return {
          data: null,
          error: { message: errorMessage },
        };
      },
    },
  };
}

/** Creates a mock client whose exchangeCodeForSession throws synchronously. */
function createThrowingClient(errorMessage: string): AuthCallbackClient {
  return {
    auth: {
      async exchangeCodeForSession(_code: string) {
        throw new Error(errorMessage);
      },
    },
  };
}

/** Creates a mock client that succeeds (no error). */
function createSuccessClient(
  session: object = { user: { id: "uid-1" } }
): AuthCallbackClient {
  return {
    auth: {
      async exchangeCodeForSession(_code: string) {
        return { data: { session }, error: null };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests — missing code
// ---------------------------------------------------------------------------

describe("resolveAuthCallbackRedirect — missing code parameter (Sub-AC 2.2c)", () => {
  it("returns redirectUrl '/auth/error' when code is undefined", async () => {
    // Arrange — no client needed; early-exit before any Supabase call
    const successClient = createSuccessClient();

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: undefined },
      successClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/auth/error",
      "Missing code (undefined) must redirect to /auth/error"
    );
  });

  it("returns redirectUrl '/auth/error' when code is null", async () => {
    // Arrange
    const successClient = createSuccessClient();

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: null },
      successClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/auth/error",
      "Missing code (null) must redirect to /auth/error"
    );
  });

  it("returns custom errorPath when code is missing and errorPath is specified", async () => {
    // Arrange
    const successClient = createSuccessClient();

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: undefined, errorPath: "/login?error=missing_code" },
      successClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/login?error=missing_code",
      "Custom errorPath must be used when code is missing"
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — exchangeCodeForSession returns an error object
// ---------------------------------------------------------------------------

describe("resolveAuthCallbackRedirect — exchangeCodeForSession error return (Sub-AC 2.2c)", () => {
  it("returns redirectUrl '/auth/error' when exchangeCodeForSession returns an error", async () => {
    // Arrange
    const errorClient = createErrorClient("invalid_grant: code expired");

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: "some-auth-code", successPath: "/dashboard" },
      errorClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/auth/error",
      "Error response from exchangeCodeForSession must redirect to /auth/error"
    );
  });

  it("does NOT redirect to the success path when exchangeCodeForSession returns an error", async () => {
    // Arrange
    const errorClient = createErrorClient("otp_expired");

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: "stale-code", successPath: "/onboarding" },
      errorClient
    );

    // Assert
    assert.notEqual(
      result.redirectUrl,
      "/onboarding",
      "Success path must not be used when exchange fails"
    );
  });

  it("returns custom errorPath when exchangeCodeForSession returns an error", async () => {
    // Arrange
    const errorClient = createErrorClient("user_not_found");

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: "some-code", errorPath: "/auth/callback-error" },
      errorClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/auth/callback-error",
      "Custom errorPath must be respected when exchange returns an error"
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — exchangeCodeForSession throws an exception
// ---------------------------------------------------------------------------

describe("resolveAuthCallbackRedirect — exchangeCodeForSession throws (Sub-AC 2.2c)", () => {
  it("returns redirectUrl '/auth/error' when exchangeCodeForSession throws an exception", async () => {
    // Arrange
    const throwingClient = createThrowingClient("network error: connection refused");

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: "some-auth-code", successPath: "/dashboard" },
      throwingClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/auth/error",
      "Thrown exception from exchangeCodeForSession must redirect to /auth/error"
    );
  });

  it("does NOT propagate the thrown exception to the caller", async () => {
    // Arrange
    const throwingClient = createThrowingClient("unexpected internal error");

    // Act — if the function re-throws, this will fail
    const result = await resolveAuthCallbackRedirect(
      { code: "any-code" },
      throwingClient
    );

    // Assert — we expect a clean return, not a thrown error
    assert.equal(
      typeof result.redirectUrl,
      "string",
      "Function must return a string redirectUrl, not re-throw the exception"
    );
    assert.equal(
      result.redirectUrl,
      "/auth/error",
      "Thrown exception must redirect to default /auth/error"
    );
  });

  it("returns custom errorPath when exchangeCodeForSession throws", async () => {
    // Arrange
    const throwingClient = createThrowingClient("auth service unavailable");

    // Act
    const result = await resolveAuthCallbackRedirect(
      { code: "some-code", errorPath: "/error/auth-unavailable" },
      throwingClient
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      "/error/auth-unavailable",
      "Custom errorPath must be respected when exchange throws"
    );
  });
});
