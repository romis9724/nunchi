/**
 * Unit tests for subscribeToAuthStateChange — Sub-AC 4b (Phase 3a Auth)
 *
 * Verifies:
 *   1. Callback is called with the correct user when a sign-in event fires.
 *   2. Callback is called with null when a sign-out event fires.
 *   3. After unsubscribe(), the callback is NOT called for subsequent events.
 *   4. Multiple events in sequence are each forwarded correctly.
 *   5. unsubscribe() delegates to the Supabase subscription's own unsubscribe.
 *
 * A mock AuthStateChangeClient is injected so no real network calls or
 * @supabase/supabase-js dependency is needed.
 *
 * Run: tsx --test regression/auth_on_auth_state_change.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  subscribeToAuthStateChange,
  type AuthStateChangeClient,
  type SessionUser,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

/**
 * Creates a controllable mock AuthStateChangeClient.
 *
 * Returns:
 *  - `client`          — the mock to inject into subscribeToAuthStateChange
 *  - `triggerEvent`    — call to simulate an auth state change event
 *  - `unsubscribeCalls`— how many times the internal unsubscribe was invoked
 */
function createMockAuthStateChangeClient(): {
  client: AuthStateChangeClient;
  triggerEvent: (session: { user: SessionUser } | null) => void;
  unsubscribeCalls: () => number;
} {
  let registeredCallback:
    | ((event: string, session: { user: SessionUser } | null) => void)
    | null = null;
  let active = true;
  let unsubscribeCount = 0;

  /**
   * Simulates Supabase firing an auth state change event.
   * Stops forwarding once unsubscribe() has been called — mirroring real
   * Supabase SDK behaviour where the listener is torn down on unsubscribe.
   */
  const triggerEvent = (session: { user: SessionUser } | null): void => {
    if (active && registeredCallback !== null) {
      registeredCallback("SIGNED_IN", session);
    }
  };

  const client: AuthStateChangeClient = {
    auth: {
      onAuthStateChange(cb) {
        registeredCallback = cb;
        return {
          data: {
            subscription: {
              unsubscribe() {
                active = false;
                unsubscribeCount += 1;
              },
            },
          },
        };
      },
    },
  };

  return {
    client,
    triggerEvent,
    unsubscribeCalls: () => unsubscribeCount,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("subscribeToAuthStateChange — Sub-AC 4b", () => {
  it("callback is called with the correct user on a sign-in event", () => {
    // Arrange
    const user: SessionUser = { id: "user-login-id", email: "login@example.com" };
    const { client, triggerEvent } = createMockAuthStateChangeClient();
    const received: Array<SessionUser | null> = [];

    subscribeToAuthStateChange((u) => received.push(u), client);

    // Act — simulate a sign-in event
    triggerEvent({ user });

    // Assert
    assert.equal(received.length, 1, "callback must be called once");
    assert.deepEqual(
      received[0],
      user,
      "callback must receive the correct user object"
    );
  });

  it("callback is called with null on a sign-out event", () => {
    // Arrange
    const { client, triggerEvent } = createMockAuthStateChangeClient();
    const received: Array<SessionUser | null> = [];

    subscribeToAuthStateChange((u) => received.push(u), client);

    // Act — simulate a sign-out (session is null)
    triggerEvent(null);

    // Assert
    assert.equal(received.length, 1, "callback must be called once for sign-out");
    assert.strictEqual(
      received[0],
      null,
      "callback must receive null on sign-out"
    );
  });

  it("callback is NOT called after unsubscribe()", () => {
    // Arrange
    const user: SessionUser = { id: "post-unsub-user", email: "after@unsub.com" };
    const { client, triggerEvent } = createMockAuthStateChangeClient();
    const received: Array<SessionUser | null> = [];

    const subscription = subscribeToAuthStateChange(
      (u) => received.push(u),
      client
    );

    // Act — unsubscribe then fire a subsequent event
    subscription.unsubscribe();
    triggerEvent({ user });

    // Assert
    assert.equal(
      received.length,
      0,
      "callback must NOT be called after unsubscribe()"
    );
  });

  it("callback is called before unsubscribe() but not after", () => {
    // Arrange
    const userBefore: SessionUser = { id: "before-id", email: "before@test.com" };
    const userAfter: SessionUser = { id: "after-id", email: "after@test.com" };
    const { client, triggerEvent } = createMockAuthStateChangeClient();
    const received: Array<SessionUser | null> = [];

    const subscription = subscribeToAuthStateChange(
      (u) => received.push(u),
      client
    );

    // Act — fire event, then unsubscribe, then fire again
    triggerEvent({ user: userBefore });
    subscription.unsubscribe();
    triggerEvent({ user: userAfter });

    // Assert
    assert.equal(
      received.length,
      1,
      "only the pre-unsubscribe event must be received"
    );
    assert.deepEqual(
      received[0],
      userBefore,
      "the pre-unsubscribe event must carry the correct user"
    );
  });

  it("callback receives null (sign-out) before unsubscribe then nothing after", () => {
    // Arrange
    const { client, triggerEvent } = createMockAuthStateChangeClient();
    const received: Array<SessionUser | null> = [];

    const subscription = subscribeToAuthStateChange(
      (u) => received.push(u),
      client
    );

    // Act
    triggerEvent(null); // sign-out before unsubscribe
    subscription.unsubscribe();
    triggerEvent(null); // would be sign-out after unsubscribe

    // Assert
    assert.equal(received.length, 1, "only the first sign-out must be received");
    assert.strictEqual(received[0], null, "first event must be null (sign-out)");
  });

  it("multiple sign-in/sign-out events are forwarded in order before unsubscribe", () => {
    // Arrange
    const userA: SessionUser = { id: "user-a", email: "a@test.com" };
    const userB: SessionUser = { id: "user-b", email: "b@test.com" };
    const { client, triggerEvent } = createMockAuthStateChangeClient();
    const received: Array<SessionUser | null> = [];

    subscribeToAuthStateChange((u) => received.push(u), client);

    // Act — sign-in A, sign-out, sign-in B
    triggerEvent({ user: userA });
    triggerEvent(null);
    triggerEvent({ user: userB });

    // Assert
    assert.equal(received.length, 3, "all three events must be received");
    assert.deepEqual(received[0], userA, "first event must be userA");
    assert.strictEqual(received[1], null, "second event must be null (sign-out)");
    assert.deepEqual(received[2], userB, "third event must be userB");
  });

  it("unsubscribe() delegates to the Supabase subscription's unsubscribe", () => {
    // Arrange
    const { client, unsubscribeCalls } = createMockAuthStateChangeClient();

    const subscription = subscribeToAuthStateChange(() => {}, client);

    // Pre-condition
    assert.equal(unsubscribeCalls(), 0, "unsubscribe must not be called yet");

    // Act
    subscription.unsubscribe();

    // Assert
    assert.equal(
      unsubscribeCalls(),
      1,
      "Supabase subscription.unsubscribe() must be called exactly once"
    );
  });
});
