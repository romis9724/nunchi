/**
 * useAuthState — Phase 3a Auth, Sub-AC 4c
 *
 * React hook that combines getSession (initial mount) and
 * onAuthStateChange (subsequent changes) into a single
 * { isLoggedIn, user, loading } state object.
 *
 * The core logic lives in `createAuthStateController`, which is
 * exported separately so tests can exercise it without React or a DOM.
 */

"use client";

import { useState, useEffect } from "react";
import {
  getSession,
  subscribeToAuthStateChange,
  type GetSessionClient,
  type AuthStateChangeClient,
  type SessionUser,
} from "../lib/auth.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AuthState {
  /** True when a session user is present. */
  isLoggedIn: boolean;
  /** The current authenticated user, or null when not signed in. */
  user: SessionUser | null;
  /** True while the initial getSession call has not yet resolved. */
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Testable controller — no React dependency
// ---------------------------------------------------------------------------

/**
 * Injectable dependency bundle for createAuthStateController.
 * Both client fields are optional to allow lightweight mocks in tests.
 */
export interface AuthStateControllerDeps {
  /**
   * Supabase client used for the initial getSession call.
   * Defaults to the real browser client when omitted.
   */
  sessionClient?: GetSessionClient;
  /**
   * Supabase client used for the onAuthStateChange subscription.
   * The real browser client must be provided when not in a test.
   */
  authClient: AuthStateChangeClient;
  /**
   * Invoked every time the auth state changes.
   * The hook passes `setState` here; tests pass a simple accumulator.
   */
  onStateChange: (state: AuthState) => void;
}

/**
 * Handle returned by createAuthStateController.
 */
export interface AuthStateControllerHandle {
  /**
   * Loads the initial session via getSession and sets up the
   * onAuthStateChange subscription.
   *
   * Must be called once (e.g. from useEffect) after the controller
   * is created. Returns the initial AuthState so the caller can
   * set React state synchronously after the promise resolves.
   */
  initialize(): Promise<AuthState>;
  /**
   * Tears down the onAuthStateChange subscription.
   * Call from the useEffect cleanup / component unmount.
   */
  destroy(): void;
}

/**
 * Pure (no-React) factory that encapsulates the state management logic
 * used by useAuthState.
 *
 * Exported so tests can drive the exact same logic that the hook runs,
 * without needing a DOM, jsdom, or React testing utilities.
 *
 * @param deps   Injectable clients and state-change callback.
 */
export function createAuthStateController(
  deps: AuthStateControllerDeps
): AuthStateControllerHandle {
  let destroyed = false;
  let unsubscribe: (() => void) | null = null;

  const emitState = (user: SessionUser | null): void => {
    if (!destroyed) {
      deps.onStateChange({
        isLoggedIn: user !== null,
        user,
        loading: false,
      });
    }
  };

  return {
    async initialize(): Promise<AuthState> {
      // Subscribe to future auth changes first so no event is missed
      // between the getSession call and the subscription setup.
      const subscription = subscribeToAuthStateChange(
        (user) => emitState(user),
        deps.authClient
      );
      unsubscribe = subscription.unsubscribe.bind(subscription);

      // Load initial session
      const user = await getSession(deps.sessionClient);

      const initialState: AuthState = {
        isLoggedIn: user !== null,
        user,
        loading: false,
      };

      // Emit so the caller's onStateChange also receives the initial state
      if (!destroyed) {
        deps.onStateChange(initialState);
      }

      return initialState;
    },

    destroy(): void {
      destroyed = true;
      unsubscribe?.();
    },
  };
}

// ---------------------------------------------------------------------------
// React hook wrapper
// ---------------------------------------------------------------------------

/**
 * React hook that tracks the current Supabase authentication state.
 *
 * Uses getSession on initial mount and subscribes to onAuthStateChange
 * for subsequent sign-in / sign-out events.
 *
 * @param sessionClient  Optional Supabase client for getSession (injected in tests).
 * @param authClient     Optional Supabase client for onAuthStateChange (injected in tests).
 */
export function useAuthState(
  sessionClient?: GetSessionClient,
  authClient?: AuthStateChangeClient
): AuthState {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Resolve the real browser client lazily when no mock is injected.
    // We import supabase here (not at module top) to keep the hook
    // compatible with SSR/test environments that never call getSupabase().
    let controller: AuthStateControllerHandle | undefined;

    async function setup(): Promise<void> {
      let resolvedAuthClient: AuthStateChangeClient;

      if (authClient) {
        resolvedAuthClient = authClient;
      } else {
        const { getSupabase } = await import("../lib/supabase.js");
        resolvedAuthClient =
          getSupabase() as unknown as AuthStateChangeClient;
      }

      controller = createAuthStateController({
        sessionClient,
        authClient: resolvedAuthClient,
        onStateChange: setState,
      });

      await controller.initialize();
    }

    setup().catch(() => {
      // Auth failure is non-fatal; stay in loading=false, isLoggedIn=false
      setState({ isLoggedIn: false, user: null, loading: false });
    });

    return () => {
      controller?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
