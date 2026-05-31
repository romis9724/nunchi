/**
 * Unit tests for createAuthStateController (the testable core of useAuthState)
 * Sub-AC 4c — Phase 3a Auth
 *
 * Verifies:
 *   1. On initialize() (initial "mount") — isLoggedIn and user are set
 *      correctly when a session exists.
 *   2. On initialize() with no session — isLoggedIn is false and user is null.
 *   3. Subsequent auth state changes (onAuthStateChange callbacks) are forwarded
 *      with the correct isLoggedIn and user values WITHOUT needing React renders.
 *   4. After destroy() the onStateChange callback is no longer invoked.
 *   5. destroy() calls the Supabase subscription's unsubscribe exactly once.
 *   6. Sign-out event after sign-in correctly sets isLoggedIn=false, user=null.
 *   7. Multiple sequential auth changes all produce correct state updates.
 *
 * The controller's injectable deps mean no real Supabase or network calls are
 * made, and no React / jsdom / @testing-library is required.
 *
 * Run: tsx --test regression/auth_use_auth_state.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createAuthStateController,
  type AuthStateControllerDeps,
  type AuthState,
} from "../../apps/web/hooks/useAuthState.js";
import type {
  GetSessionClient,
  AuthStateChangeClient,
  SessionUser,
} from "../../apps/web/lib/auth.js";

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

/**
 * Creates a mock GetSessionClient that resolves with the given user (or null).
 */
function mockSessionClient(user: SessionUser | null): GetSessionClient {
  return {
    auth: {
      async getSession() {
        if (user !== null) {
          return { data: { session: { user } }, error: null };
        }
        return { data: { session: null }, error: null };
      },
    },
  };
}

/**
 * Creates a mock AuthStateChangeClient that exposes a `fire` helper to
 * simulate future auth state change events, and tracks unsubscribe calls.
 */
function mockAuthStateChangeClient(): {
  client: AuthStateChangeClient;
  fire: (session: { user: SessionUser } | null) => void;
  unsubscribeCalls: () => number;
} {
  type CB = (event: string, session: { user: SessionUser } | null) => void;
  let registered: CB | null = null;
  let active = true;
  let unsubCount = 0;

  const client: AuthStateChangeClient = {
    auth: {
      onAuthStateChange(cb: CB) {
        registered = cb;
        return {
          data: {
            subscription: {
              unsubscribe() {
                active = false;
                unsubCount += 1;
              },
            },
          },
        };
      },
    },
  };

  const fire = (session: { user: SessionUser } | null): void => {
    if (active && registered !== null) {
      registered("SIGNED_IN", session);
    }
  };

  return { client, fire, unsubscribeCalls: () => unsubCount };
}

/**
 * Helper: builds a full AuthStateControllerDeps bundle and returns it along
 * with the mock helpers needed to drive the test.
 */
function buildDeps(initialUser: SessionUser | null): {
  deps: AuthStateControllerDeps;
  received: AuthState[];
  fire: (session: { user: SessionUser } | null) => void;
  unsubscribeCalls: () => number;
} {
  const received: AuthState[] = [];
  const { client: authClient, fire, unsubscribeCalls } =
    mockAuthStateChangeClient();

  const deps: AuthStateControllerDeps = {
    sessionClient: mockSessionClient(initialUser),
    authClient,
    onStateChange: (s) => received.push({ ...s }),
  };

  return { deps, received, fire, unsubscribeCalls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createAuthStateController — Sub-AC 4c (useAuthState core logic)", () => {
  // ── Test 1: initial mount with a logged-in session ────────────────────────
  it("initialize() sets isLoggedIn=true and user when a session exists", async () => {
    // Arrange
    const user: SessionUser = { id: "user-001", email: "alice@example.com" };
    const { deps, received } = buildDeps(user);
    const controller = createAuthStateController(deps);

    // Act — simulates initial mount
    const initialState = await controller.initialize();

    // Assert: return value
    assert.equal(initialState.isLoggedIn, true, "isLoggedIn must be true");
    assert.deepEqual(initialState.user, user, "user must match session user");
    assert.equal(initialState.loading, false, "loading must be false after init");

    // Assert: onStateChange was called with the same values
    assert.ok(
      received.some((s) => s.isLoggedIn === true),
      "onStateChange must have been invoked with isLoggedIn=true"
    );

    controller.destroy();
  });

  // ── Test 2: initial mount with no session ────────────────────────────────
  it("initialize() sets isLoggedIn=false and user=null when no session exists", async () => {
    // Arrange
    const { deps, received } = buildDeps(null);
    const controller = createAuthStateController(deps);

    // Act
    const initialState = await controller.initialize();

    // Assert
    assert.equal(initialState.isLoggedIn, false, "isLoggedIn must be false");
    assert.strictEqual(initialState.user, null, "user must be null");
    assert.equal(initialState.loading, false, "loading must be false");

    assert.ok(
      received.some((s) => s.isLoggedIn === false && s.user === null),
      "onStateChange must have been invoked with isLoggedIn=false, user=null"
    );

    controller.destroy();
  });

  // ── Test 3: subsequent sign-in event updates state ───────────────────────
  it("auth state change (sign-in) after init updates isLoggedIn and user", async () => {
    // Arrange — start with no session
    const { deps, received, fire } = buildDeps(null);
    const controller = createAuthStateController(deps);
    await controller.initialize();

    const signedInUser: SessionUser = {
      id: "user-002",
      email: "bob@example.com",
    };

    // Act — simulate a sign-in event (no React re-render needed)
    fire({ user: signedInUser });

    // Assert: the onStateChange callback received the new state
    const signInStates = received.filter((s) => s.isLoggedIn === true);
    assert.ok(signInStates.length > 0, "at least one state with isLoggedIn=true expected");
    const last = signInStates[signInStates.length - 1];
    assert.deepEqual(last.user, signedInUser, "user must match the sign-in event user");

    controller.destroy();
  });

  // ── Test 4: subsequent sign-out event updates state ──────────────────────
  it("auth state change (sign-out) sets isLoggedIn=false and user=null", async () => {
    // Arrange — start with a logged-in session
    const user: SessionUser = { id: "user-003", email: "carol@example.com" };
    const { deps, received, fire } = buildDeps(user);
    const controller = createAuthStateController(deps);
    await controller.initialize();

    // Act — simulate a sign-out event
    fire(null);

    // Assert
    const signOutStates = received.filter((s) => s.isLoggedIn === false);
    assert.ok(
      signOutStates.length > 0,
      "at least one state with isLoggedIn=false expected after sign-out"
    );
    const last = signOutStates[signOutStates.length - 1];
    assert.strictEqual(last.user, null, "user must be null after sign-out");

    controller.destroy();
  });

  // ── Test 5: no callbacks after destroy() ────────────────────────────────
  it("destroy() stops onStateChange from being called for subsequent events", async () => {
    // Arrange
    const user: SessionUser = { id: "user-004", email: "dave@example.com" };
    const { deps, received, fire } = buildDeps(null);
    const controller = createAuthStateController(deps);
    await controller.initialize();

    const countAfterInit = received.length;

    // Act — destroy then fire an event
    controller.destroy();
    fire({ user });

    // Assert
    assert.equal(
      received.length,
      countAfterInit,
      "no new onStateChange calls must occur after destroy()"
    );
  });

  // ── Test 6: destroy() delegates to Supabase subscription.unsubscribe ─────
  it("destroy() calls the Supabase subscription unsubscribe exactly once", async () => {
    // Arrange
    const { deps, unsubscribeCalls } = buildDeps(null);
    const controller = createAuthStateController(deps);
    await controller.initialize();

    // Pre-condition
    assert.equal(unsubscribeCalls(), 0, "unsubscribe must not be called before destroy()");

    // Act
    controller.destroy();

    // Assert
    assert.equal(
      unsubscribeCalls(),
      1,
      "unsubscribe must be called exactly once on destroy()"
    );
  });

  // ── Test 7: sign-in → sign-out → sign-in sequence is forwarded correctly ─
  it("multiple sequential auth changes are each forwarded with correct values", async () => {
    // Arrange — start with no session
    const userA: SessionUser = { id: "user-a", email: "a@test.com" };
    const userB: SessionUser = { id: "user-b", email: "b@test.com" };
    const { deps, received, fire } = buildDeps(null);
    const controller = createAuthStateController(deps);
    await controller.initialize();

    // Act — sign-in A, sign-out, sign-in B
    fire({ user: userA });
    fire(null);
    fire({ user: userB });

    // Assert: find the login/logout states emitted by the subscription
    // (received may also include the initial state from initialize)
    const subscriptionStates = received.filter((s) => !s.loading);

    // We need at least 4: initial + 3 changes
    assert.ok(subscriptionStates.length >= 4, "expected at least 4 state updates");

    // The last three must be: signInA, signOut, signInB
    const last3 = subscriptionStates.slice(-3);

    assert.equal(last3[0].isLoggedIn, true, "first change must be sign-in (isLoggedIn=true)");
    assert.deepEqual(last3[0].user, userA, "first change user must be userA");

    assert.equal(last3[1].isLoggedIn, false, "second change must be sign-out (isLoggedIn=false)");
    assert.strictEqual(last3[1].user, null, "second change user must be null");

    assert.equal(last3[2].isLoggedIn, true, "third change must be sign-in (isLoggedIn=true)");
    assert.deepEqual(last3[2].user, userB, "third change user must be userB");

    controller.destroy();
  });

  // ── Test 8: initial state loading=true before init, false after ──────────
  it("loading is false in every state emitted by onStateChange", async () => {
    // Arrange
    const user: SessionUser = { id: "user-load-test", email: "load@test.com" };
    const { deps, received, fire } = buildDeps(user);
    const controller = createAuthStateController(deps);

    await controller.initialize();
    fire({ user: { id: "user-x", email: "x@test.com" } });

    // Assert — every emitted state must have loading=false
    for (const state of received) {
      assert.equal(
        state.loading,
        false,
        "loading must be false in all onStateChange emissions"
      );
    }

    controller.destroy();
  });
});
