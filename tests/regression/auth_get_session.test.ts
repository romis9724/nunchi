/**
 * Unit tests for getSession — Sub-AC 4a (Phase 3a Auth)
 *
 * Verifies:
 *   1. Returns the correct user object when a logged-in session exists.
 *   2. Returns null when no session is present.
 *   3. Returns null when session data is null.
 *   4. Throws an Error when Supabase returns an error response.
 *   5. getSession is called exactly once per invocation.
 *
 * A mock GetSessionClient is injected via the optional `supabaseClient`
 * parameter to avoid any real network or @supabase/supabase-js calls.
 *
 * Run: tsx --test regression/auth_get_session.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSession,
  type GetSessionClient,
  type SessionUser,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

/**
 * Creates a mock GetSessionClient that returns a controlled session or error.
 *
 * @param user        The user object to embed in the session. Pass `null` to
 *                    simulate a missing session.
 * @param returnError Optional error to return instead of session data.
 */
function createMockGetSessionClient(
  user: SessionUser | null,
  returnError: { message: string } | null = null
): { client: GetSessionClient; calls: number[] } {
  const calls: number[] = [];

  const client: GetSessionClient = {
    auth: {
      async getSession() {
        calls.push(Date.now());
        if (returnError) {
          return { data: null, error: returnError };
        }
        return {
          data: user !== null ? { session: { user } } : { session: null },
          error: null,
        };
      },
    },
  };

  return { client, calls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getSession — session presence and null handling (Sub-AC 4a)", () => {
  it("returns the correct user object when a session exists", async () => {
    // Arrange
    const expectedUser: SessionUser = {
      id: "user-uuid-123",
      email: "test@example.com",
    };
    const { client } = createMockGetSessionClient(expectedUser);

    // Act
    const result = await getSession(client);

    // Assert
    assert.deepEqual(
      result,
      expectedUser,
      "getSession must return the user object from the active session"
    );
  });

  it("returns null when no session is present (user is not logged in)", async () => {
    // Arrange
    const { client } = createMockGetSessionClient(null);

    // Act
    const result = await getSession(client);

    // Assert
    assert.equal(
      result,
      null,
      "getSession must return null when there is no active session"
    );
  });

  it("returns null when session data contains a null session", async () => {
    // Arrange — explicit null session (Supabase returns data: { session: null })
    const { client } = createMockGetSessionClient(null);

    // Act
    const result = await getSession(client);

    // Assert
    assert.strictEqual(
      result,
      null,
      "getSession must return null when data.session is null"
    );
  });

  it("calls getSession on the Supabase client exactly once per invocation", async () => {
    // Arrange
    const user: SessionUser = { id: "call-count-user", email: "x@test.com" };
    const { client, calls } = createMockGetSessionClient(user);

    // Act
    await getSession(client);

    // Assert
    assert.equal(
      calls.length,
      1,
      "supabase.auth.getSession() must be called exactly once"
    );
  });

  it("returns different users across separate invocations", async () => {
    // Arrange
    const userA: SessionUser = { id: "user-a", email: "a@test.com" };
    const userB: SessionUser = { id: "user-b", email: "b@test.com" };
    const { client: clientA } = createMockGetSessionClient(userA);
    const { client: clientB } = createMockGetSessionClient(userB);

    // Act
    const resultA = await getSession(clientA);
    const resultB = await getSession(clientB);

    // Assert
    assert.deepEqual(resultA, userA, "First call must return userA");
    assert.deepEqual(resultB, userB, "Second call must return userB");
  });

  it("throws an Error when Supabase returns an error response", async () => {
    // Arrange
    const { client } = createMockGetSessionClient(null, {
      message: "session retrieval failed",
    });

    // Act & Assert
    await assert.rejects(
      () => getSession(client),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("getSession failed"),
          `Expected 'getSession failed' in message, got: ${err.message}`
        );
        assert.ok(
          err.message.includes("session retrieval failed"),
          `Expected original Supabase error forwarded, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("preserves additional user properties returned by Supabase", async () => {
    // Arrange — user with extra fields (role, etc.)
    const richUser: SessionUser = {
      id: "admin-user-id",
      email: "admin@company.com",
      role: "admin",
      app_metadata: { provider: "google" },
    };
    const { client } = createMockGetSessionClient(richUser);

    // Act
    const result = await getSession(client);

    // Assert
    assert.deepEqual(
      result,
      richUser,
      "getSession must preserve all user properties including extra fields"
    );
  });
});
