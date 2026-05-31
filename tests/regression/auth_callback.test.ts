/**
 * Unit tests for handleAuthCallback — Sub-AC 2.2a (Phase 3a Auth)
 *
 * Verifies:
 *   1. exchangeCodeForSession is called exactly once with the exact code value
 *      passed in options.code (success case).
 *
 * A mock AuthCallbackClient is injected via the optional `supabaseClient`
 * parameter to avoid any real network or @supabase/supabase-js calls.
 *
 * Run: tsx --test regression/auth_callback.test.ts
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

interface MockExchangeCall {
  code: string;
}

function createMockCallbackClient(
  returnSession: object | null = { user: { id: "test-user-id" } },
  returnError: { message: string } | null = null
): { client: AuthCallbackClient; calls: MockExchangeCall[] } {
  const calls: MockExchangeCall[] = [];

  const client: AuthCallbackClient = {
    auth: {
      async exchangeCodeForSession(code: string) {
        calls.push({ code });
        return {
          data: returnSession !== null ? { session: returnSession } : null,
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

describe("handleAuthCallback", () => {
  it("calls exchangeCodeForSession with the exact code value when code is received", async () => {
    // Arrange
    const { client, calls } = createMockCallbackClient();
    const testCode = "abc123-oauth-code-value";

    // Act
    await handleAuthCallback({ code: testCode }, client);

    // Assert
    assert.equal(
      calls.length,
      1,
      "exchangeCodeForSession must be called exactly once"
    );
    assert.equal(
      calls[0].code,
      testCode,
      "exchangeCodeForSession must be called with the exact code value received"
    );
  });
});
