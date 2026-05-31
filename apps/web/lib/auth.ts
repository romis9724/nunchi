/**
 * Minimal structural interface for the Supabase auth sub-client subset used by
 * signInWithGoogle. Defined locally so test environments can inject a mock
 * without importing @supabase/supabase-js.
 */
export interface OAuthSignInClient {
  auth: {
    signInWithOAuth(params: {
      provider: "google";
      options?: { redirectTo?: string };
    }): Promise<{
      data: { url: string | null } | null;
      error: { message: string } | null;
    }>;
  };
}

/**
 * Options for signInWithGoogle. Both fields are optional — the function can
 * derive sensible defaults from the runtime environment when they are omitted.
 */
export interface SignInWithGoogleOptions {
  /**
   * The application origin (e.g. "https://app.nunchi.so").
   * Used as the base when constructing the `redirectTo` URL.
   *
   * Defaults to `window.location.origin` in browser environments and to an
   * empty string otherwise (server-side pre-render path).
   */
  origin?: string;
  /**
   * The path the OAuth provider should redirect back to after authentication.
   * Defaults to "/auth/callback".
   */
  redirectPath?: string;
}

/** Value returned by a successful signInWithGoogle call. */
export interface SignInWithGoogleResult {
  /**
   * The OAuth authorisation URL returned by Supabase. The caller should
   * redirect the browser to this URL to begin the OAuth flow.
   * `null` only in edge cases where Supabase returns no URL without an error.
   */
  url: string | null;
}

// ---------------------------------------------------------------------------
// Auth callback — exchangeCodeForSession
// ---------------------------------------------------------------------------

/**
 * Minimal structural interface for the Supabase auth sub-client subset used by
 * handleAuthCallback. Defined locally so test environments can inject a mock
 * without importing @supabase/supabase-js.
 */
export interface AuthCallbackClient {
  auth: {
    exchangeCodeForSession(code: string): Promise<{
      data: { session: object | null } | null;
      error: { message: string } | null;
    }>;
  };
}

/** Options for handleAuthCallback. */
export interface HandleAuthCallbackOptions {
  /** The OAuth authorization code received from the provider via the callback URL. */
  code: string;
  /**
   * The application path to redirect to after a successful code exchange
   * (e.g. "/dashboard"). When provided, `HandleAuthCallbackResult.redirectUrl`
   * will be set to this value on success.
   */
  successPath?: string;
}

/** Value returned by a successful handleAuthCallback call. */
export interface HandleAuthCallbackResult {
  /**
   * The Supabase session object created by exchanging the code.
   * `null` only in edge cases where Supabase returns no session without an error.
   */
  session: object | null;
  /**
   * The redirect URL for the caller to navigate the user to after a successful
   * code exchange. Set only when `HandleAuthCallbackOptions.successPath` was
   * provided; `undefined` otherwise.
   */
  redirectUrl?: string;
}

/**
 * Handles the OAuth callback by exchanging the authorization code for a
 * Supabase session.
 *
 * Calls `supabase.auth.exchangeCodeForSession(code)` with the supplied `code`
 * value. Throws an `Error` when Supabase returns an error response.
 *
 * @param options        Options containing the OAuth `code` parameter.
 * @param supabaseClient Optional Supabase client (injected in tests). Defaults
 *                       to the real browser client via a lazy import so that
 *                       @supabase/supabase-js is never loaded when a mock is
 *                       provided.
 */
export async function handleAuthCallback(
  options: HandleAuthCallbackOptions,
  supabaseClient?: AuthCallbackClient
): Promise<HandleAuthCallbackResult> {
  let client: AuthCallbackClient;

  if (supabaseClient) {
    client = supabaseClient;
  } else {
    const { getSupabase } = await import("./supabase");
    client = getSupabase() as unknown as AuthCallbackClient;
  }

  const { data, error } = await client.auth.exchangeCodeForSession(
    options.code
  );

  if (error) {
    throw new Error(`Auth callback failed: ${error.message}`);
  }

  const result: HandleAuthCallbackResult = { session: data?.session ?? null };

  if (options.successPath !== undefined) {
    result.redirectUrl = options.successPath;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Auth callback route-level redirect resolver — Sub-AC 2.2c
// ---------------------------------------------------------------------------

/**
 * Options for resolveAuthCallbackRedirect.
 *
 * Unlike `HandleAuthCallbackOptions`, the `code` field is intentionally
 * optional/nullable so the function can handle the missing-code case.
 */
export interface AuthCallbackRouteOptions {
  /**
   * The OAuth authorization code from the provider callback URL query string.
   * When absent (`undefined` or `null`) the function treats this as an error
   * and redirects to `errorPath`.
   */
  code?: string | null;
  /**
   * Path to redirect to on success (e.g. "/dashboard" or "/onboarding").
   * Defaults to "/" when omitted.
   */
  successPath?: string;
  /**
   * Path to redirect to on any error (missing code, exchange failure, thrown
   * exception). Defaults to "/auth/error".
   */
  errorPath?: string;
}

/** Value returned by resolveAuthCallbackRedirect — always a redirect URL. */
export interface AuthCallbackRouteResult {
  /** The path the caller should redirect the browser to. */
  redirectUrl: string;
}

/**
 * Route-handler-level wrapper around `handleAuthCallback`.
 *
 * Returns a `{ redirectUrl }` object in ALL scenarios so the route handler can
 * perform a single `redirect(result.redirectUrl)` regardless of outcome:
 *
 * - Missing or falsy `code`     → `{ redirectUrl: errorPath }`
 * - `exchangeCodeForSession` returns an error → `{ redirectUrl: errorPath }`
 * - `exchangeCodeForSession` throws an exception → `{ redirectUrl: errorPath }`
 * - Success → `{ redirectUrl: successPath ?? "/" }`
 *
 * @param options        Route-level options (code, successPath, errorPath).
 * @param supabaseClient Optional Supabase client injected for testing.
 */
export async function resolveAuthCallbackRedirect(
  options: AuthCallbackRouteOptions,
  supabaseClient?: AuthCallbackClient
): Promise<AuthCallbackRouteResult> {
  const errorPath = options.errorPath ?? "/auth/error";
  const successPath = options.successPath ?? "/";

  if (!options.code) {
    return { redirectUrl: errorPath };
  }

  try {
    await handleAuthCallback(
      { code: options.code, successPath },
      supabaseClient
    );
    return { redirectUrl: successPath };
  } catch {
    return { redirectUrl: errorPath };
  }
}

// ---------------------------------------------------------------------------
// Google OAuth sign-in
// ---------------------------------------------------------------------------

/**
 * Initiates the Google OAuth sign-in flow via Supabase.
 *
 * Constructs the `redirectTo` URL from `options.origin` + `options.redirectPath`
 * (defaulting to "/auth/callback") and delegates to
 * `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`.
 *
 * Throws an `Error` when Supabase returns an error response so that callers
 * can handle auth failures explicitly.
 *
 * @param options        Optional URL configuration for the OAuth redirect.
 * @param supabaseClient Optional Supabase client (injected in tests). Defaults
 *                       to the real browser client via a lazy import so that
 *                       @supabase/supabase-js is never loaded when a mock is
 *                       provided.
 */
export async function signInWithGoogle(
  options?: SignInWithGoogleOptions,
  supabaseClient?: OAuthSignInClient
): Promise<SignInWithGoogleResult> {
  let client: OAuthSignInClient;

  if (supabaseClient) {
    client = supabaseClient;
  } else {
    // Lazy import: @supabase/supabase-js is only resolved at runtime when no
    // mock is injected, keeping test environments dependency-free.
    const { getSupabase } = await import("./supabase");
    client = getSupabase() as unknown as OAuthSignInClient;
  }

  const origin =
    options?.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const redirectPath = options?.redirectPath ?? "/auth/callback";
  const redirectTo = `${origin}${redirectPath}`;

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    throw new Error(`Google OAuth sign-in failed: ${error.message}`);
  }

  return { url: data?.url ?? null };
}

// ---------------------------------------------------------------------------
// Sign-out — Sub-AC 2.3
// ---------------------------------------------------------------------------

/**
 * Minimal structural interface for the Supabase auth sub-client subset used by
 * signOut. Defined locally so test environments can inject a mock without
 * importing @supabase/supabase-js.
 */
export interface SignOutClient {
  auth: {
    signOut(): Promise<{
      error: { message: string } | null;
    }>;
  };
}

/** Value returned by a successful signOut call. */
export interface SignOutResult {
  /**
   * The path the caller should redirect the browser to after sign-out.
   * Always "/" (home) on success.
   */
  redirectUrl: string;
}

/**
 * Signs out the current user by calling `supabase.auth.signOut()`.
 *
 * Clears the active Supabase session and returns `{ redirectUrl: "/" }` so that
 * the caller can perform a single redirect to the home page.
 *
 * Throws an `Error` when Supabase returns an error response so that callers
 * can handle sign-out failures explicitly.
 *
 * @param homePath       Optional override for the redirect path returned on
 *                       success. Defaults to "/".
 * @param supabaseClient Optional Supabase client (injected in tests). Defaults
 *                       to the real browser client via a lazy import so that
 *                       @supabase/supabase-js is never loaded when a mock is
 *                       provided.
 */
export async function signOut(
  homePath?: string,
  supabaseClient?: SignOutClient
): Promise<SignOutResult> {
  let client: SignOutClient;

  if (supabaseClient) {
    client = supabaseClient;
  } else {
    // Lazy import: @supabase/supabase-js is only resolved at runtime when no
    // mock is injected, keeping test environments dependency-free.
    const { getSupabase } = await import("./supabase");
    client = getSupabase() as unknown as SignOutClient;
  }

  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error(`Sign-out failed: ${error.message}`);
  }

  return { redirectUrl: homePath ?? "/" };
}

// ---------------------------------------------------------------------------
// getSession — Sub-AC 4a
// ---------------------------------------------------------------------------

/**
 * Minimal structural interface for the Supabase auth sub-client subset used by
 * getSession. Defined locally so test environments can inject a mock without
 * importing @supabase/supabase-js.
 */
export interface GetSessionClient {
  auth: {
    getSession(): Promise<{
      data: { session: { user: SessionUser } | null } | null;
      error: { message: string } | null;
    }>;
  };
}

/**
 * Minimal user shape returned by getSession.
 * Mirrors the fields provided by Supabase's session.user.
 */
export interface SessionUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Returns the currently authenticated user from the active Supabase session,
 * or `null` when no session is present.
 *
 * Calls `supabase.auth.getSession()` and extracts `session.user`. Returns
 * `null` when the session is absent or when Supabase returns an error.
 *
 * Throws an `Error` only when Supabase returns an explicit error response so
 * that callers can distinguish "not logged in" (null) from "auth service error"
 * (thrown).
 *
 * @param supabaseClient Optional Supabase client (injected in tests). Defaults
 *                       to the real browser client via a lazy import so that
 *                       @supabase/supabase-js is never loaded when a mock is
 *                       provided.
 */
export async function getSession(
  supabaseClient?: GetSessionClient
): Promise<SessionUser | null> {
  let client: GetSessionClient;

  if (supabaseClient) {
    client = supabaseClient;
  } else {
    // Lazy import: @supabase/supabase-js is only resolved at runtime when no
    // mock is injected, keeping test environments dependency-free.
    const { getSupabase } = await import("./supabase");
    client = getSupabase() as unknown as GetSessionClient;
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new Error(`getSession failed: ${error.message}`);
  }

  return data?.session?.user ?? null;
}

// ---------------------------------------------------------------------------
// onAuthStateChange subscription — Sub-AC 4b
// ---------------------------------------------------------------------------

/**
 * Minimal structural interface for the Supabase auth sub-client subset used by
 * subscribeToAuthStateChange. Defined locally so test environments can inject a
 * mock without importing @supabase/supabase-js.
 */
export interface AuthStateChangeClient {
  auth: {
    onAuthStateChange(
      callback: (
        event: string,
        session: { user: SessionUser } | null
      ) => void
    ): { data: { subscription: { unsubscribe(): void } } };
  };
}

/**
 * Callback invoked when the authentication state changes.
 * Receives the current user on sign-in, or `null` on sign-out.
 */
export type AuthStateChangeCallback = (user: SessionUser | null) => void;

/**
 * Subscription handle returned by subscribeToAuthStateChange.
 * Call `unsubscribe()` to stop receiving auth state change events.
 */
export interface AuthStateChangeSubscription {
  unsubscribe(): void;
}

/**
 * Subscribes to Supabase authentication state changes.
 *
 * Wraps `supabase.auth.onAuthStateChange` so that callers receive a simplified
 * callback of `(user: SessionUser | null)` — `user` on sign-in events, `null`
 * on sign-out events — and a plain `{ unsubscribe() }` handle.
 *
 * After `unsubscribe()` is called the callback will no longer be invoked for
 * future auth state change events.
 *
 * @param callback       Invoked with the current user or `null` on every auth
 *                       state change event.
 * @param supabaseClient Supabase client to subscribe on. Must be provided;
 *                       unlike async helpers in this module there is no lazy
 *                       import fallback because the subscription must be set up
 *                       synchronously.
 */
export function subscribeToAuthStateChange(
  callback: AuthStateChangeCallback,
  supabaseClient: AuthStateChangeClient
): AuthStateChangeSubscription {
  const { data } = supabaseClient.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return {
    unsubscribe: () => data.subscription.unsubscribe(),
  };
}
