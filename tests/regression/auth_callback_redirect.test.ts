/**
 * Unit tests for handleAuthCallback redirect behaviour — Sub-AC 2.2b (Phase 3a Auth)
 *
 * Verifies:
 *   1. When exchangeCodeForSession succeeds and successPath is provided,
 *      the result contains redirectUrl equal to the specified successPath.
 *   2. When no successPath is provided, redirectUrl is undefined (no regression
 *      on existing callers that do not expect a redirect).
 *   3. When exchangeCodeForSession fails, an error is thrown and no redirect is
 *      produced.
 *
 * A mock AuthCallbackClient is injected via the optional `supabaseClient`
 * parameter to avoid any real network or @supabase/supabase-js calls.
 *
 * Run: tsx --test regression/auth_callback_redirect.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleAuthCallback,
  type AuthCallbackClient,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function createMockCallbackClient(
  returnSession: object | null = { user: { id: "test-user-id" } },
  returnError: { message: string } | null = null
): AuthCallbackClient {
  return {
    auth: {
      async exchangeCodeForSession(_code: string) {
        return {
          data: returnSession !== null ? { session: returnSession } : null,
          error: returnError,
        };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleAuthCallback — redirect on success (Sub-AC 2.2b)", () => {
  it("returns redirectUrl equal to successPath when exchangeCodeForSession succeeds", async () => {
    // Arrange
    const client = createMockCallbackClient();
    const successPath = "/dashboard";

    // Act
    const result = await handleAuthCallback(
      { code: "valid-auth-code", successPath },
      client
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      successPath,
      `redirectUrl must equal successPath ('${successPath}') on success`
    );
  });

  it("redirectUrl matches an arbitrary success path value", async () => {
    // Arrange
    const client = createMockCallbackClient();
    const successPath = "/onboarding";

    // Act
    const result = await handleAuthCallback(
      { code: "valid-auth-code", successPath },
      client
    );

    // Assert
    assert.equal(
      result.redirectUrl,
      successPath,
      "redirectUrl must reflect any caller-specified successPath"
    );
  });

  it("redirectUrl is undefined when no successPath is provided (backward compat)", async () => {
    // Arrange
    const client = createMockCallbackClient();

    // Act
    const result = await handleAuthCallback({ code: "valid-auth-code" }, client);

    // Assert
    assert.equal(
      result.redirectUrl,
      undefined,
      "redirectUrl must be undefined when successPath is omitted"
    );
  });

  it("throws an error and does not produce redirectUrl when exchangeCodeForSession fails", async () => {
    // Arrange
    const client = createMockCallbackClient(null, {
      message: "invalid_grant: code expired",
    });

    // Act & Assert
    await assert.rejects(
      () =>
        handleAuthCallback(
          { code: "expired-code", successPath: "/dashboard" },
          client
        ),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("Auth callback failed"),
          `Expected 'Auth callback failed' in message, got: ${err.message}`
        );
        assert.ok(
          err.message.includes("invalid_grant"),
          `Expected original error message forwarded, got: ${err.message}`
        );
        return true;
      }
    );
  });
});
