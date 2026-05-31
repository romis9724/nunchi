/**
 * Minimal structural interface for the Supabase client subset used by
 * upsertWaitlistEmail. Defined locally so test environments can inject a
 * mock without importing @supabase/supabase-js.
 *
 * updated_at is included in the upsert payload so that ON CONFLICT (email)
 * DO UPDATE will refresh the timestamp without touching other columns.
 */
export interface WaitlistUpsertClient {
  from(table: "waitlist"): {
    upsert(
      data: { email: string; source: string; updated_at: string },
      options: { onConflict: string }
    ): Promise<{ error: { message: string } | null }>;
  };
}

/**
 * Upserts an email address into the Supabase `waitlist` table.
 *
 * - Normalises the email (trim + lowercase) before insertion.
 * - Duplicate emails are silently ignored via onConflict + ignoreDuplicates.
 *
 * @param email  Raw email string from the caller.
 * @param db     Optional client (injected in tests). Defaults to
 *               getSupabaseAdmin() at runtime via a lazy import so that
 *               @supabase/supabase-js is never loaded when a mock is provided.
 */
export async function upsertWaitlistEmail(
  email: string,
  db?: WaitlistUpsertClient
): Promise<{ inserted: boolean }> {
  let client: WaitlistUpsertClient;

  if (db) {
    client = db;
  } else {
    // Lazy import: @supabase/supabase-js is only resolved when no mock is
    // injected, keeping test environments dependency-free.
    const { getSupabaseAdmin } = await import("./supabase");
    client = getSupabaseAdmin() as unknown as WaitlistUpsertClient;
  }

  const normalised = email.trim().toLowerCase();

  const { error } = await client
    .from("waitlist")
    .upsert(
      { email: normalised, source: "landing", updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (error) {
    throw new Error(`waitlist upsert failed: ${error.message}`);
  }

  return { inserted: true };
}

/**
 * Minimal structural interface for the Supabase client subset used by
 * getWaitlistCount. Defined locally so test environments can inject a
 * mock without importing @supabase/supabase-js.
 */
export interface WaitlistCountClient {
  from(table: "waitlist"): {
    select(
      columns: string,
      options: { count: "exact"; head: boolean }
    ): Promise<{ count: number | null; error: { message: string } | null }>;
  };
}

/**
 * Returns the total number of rows in the `waitlist` table.
 *
 * Uses Supabase's `{ count: "exact", head: true }` option which issues a
 * COUNT(*) query without returning row data, keeping the payload minimal.
 *
 * @param db  Optional client (injected in tests). Defaults to
 *            getSupabaseAdmin() at runtime via a lazy import.
 */
export async function getWaitlistCount(
  db?: WaitlistCountClient
): Promise<number> {
  let client: WaitlistCountClient;

  if (db) {
    client = db;
  } else {
    const { getSupabaseAdmin } = await import("./supabase");
    client = getSupabaseAdmin() as unknown as WaitlistCountClient;
  }

  const { count, error } = await client
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`waitlist count failed: ${error.message}`);
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// handleWaitlistPost — Sub-AC 8c: testable route-level handler
// ---------------------------------------------------------------------------

/**
 * Email validation regex — same rule as in route.ts.
 * Exported so tests can assert on the exact pattern.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Signature of a function that performs the waitlist upsert.
 * An in-memory mock can be injected at test time.
 */
export type WaitlistUpsertFn = (
  email: string,
  source: string
) => Promise<void>;

/**
 * Signature of a function that sends the waitlist confirmation email.
 * An in-memory mock can be injected at test time.
 */
export type WaitlistEmailFn = (email: string) => Promise<void>;

/**
 * Validates the raw POST body and, when valid, delegates to `upsertFn`.
 *
 * Returns a plain `{ status, body }` tuple so the function can be tested
 * without a Next.js runtime.  The route handler wraps this result in
 * `NextResponse.json(body, { status })`.
 *
 * Validation rules (mirrors route.ts):
 *  - Body must be a non-null object          → 400
 *  - `email` field must be present and non-empty after trim  → 422
 *  - `email` must match EMAIL_REGEX          → 422
 *
 * `upsertFn` is NOT called for any 4xx path.
 *
 * @param body         Parsed request body (unknown shape from JSON.parse).
 * @param upsertFn     Injectable upsert function.  Defaults to a lazy call to
 *                     `upsertWaitlistEmail` when omitted so the route handler
 *                     can pass no argument for the production path.
 * @param sendEmailFn  Injectable email function.  Defaults to a lazy call to
 *                     `sendWaitlistConfirmationEmail` when omitted.  Email
 *                     delivery is best-effort: a failure does not change the
 *                     2xx response because the user IS on the waitlist.
 */
export async function handleWaitlistPost(
  body: unknown,
  upsertFn?: WaitlistUpsertFn,
  sendEmailFn?: WaitlistEmailFn
): Promise<{ status: number; body: Record<string, unknown> }> {
  // Guard: body must be a non-null plain object
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { status: 400, body: { error: "요청 형식이 올바르지 않습니다." } };
  }

  const raw = body as Record<string, unknown>;
  const source =
    typeof raw.source === "string" ? raw.source : "landing";

  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      status: 422,
      body: { error: "올바른 이메일 주소를 입력해주세요." },
    };
  }

  // Resolve the upsert function: injectable mock in tests, real call at runtime.
  const doUpsert: WaitlistUpsertFn =
    upsertFn ??
    (async (e, s) => {
      // Lazy import so @supabase/supabase-js is never required in test envs.
      const { getSupabaseAdmin } = await import("./supabase");
      const { error } = await getSupabaseAdmin()
        .from("waitlist")
        .upsert(
          { email: e, source: s },
          { onConflict: "email", ignoreDuplicates: true }
        );
      if (error) throw new Error(`waitlist upsert failed: ${(error as { message: string }).message}`);
    });

  try {
    await doUpsert(email, source);
  } catch {
    return { status: 500, body: { error: "등록 중 오류가 발생했습니다." } };
  }

  // Send confirmation email after successful upsert.
  // Email delivery is best-effort: a failure does not downgrade the 2xx
  // response because the caller is already on the waitlist.
  const doEmail: WaitlistEmailFn =
    sendEmailFn ??
    (async (e) => {
      // Lazy import so the `resend` package is never loaded in test environments.
      await sendWaitlistConfirmationEmail(e);
    });

  try {
    await doEmail(email);
  } catch {
    // Intentionally swallowed — email failure must not fail the registration.
  }

  return { status: 200, body: { success: true } };
}

// ---------------------------------------------------------------------------
// sendWaitlistConfirmationEmail — Sub-AC 8b
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// callWaitlistApi — Sub-AC 8d: client-side fetch helper for WaitlistForm
// ---------------------------------------------------------------------------

/**
 * Injectable fetch function type — matches the global `fetch` signature
 * for the URL + RequestInit overload used by WaitlistForm.
 */
export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Result returned by `callWaitlistApi`.
 */
export interface WaitlistApiResult {
  /** true when the server responded with a 2xx status. */
  ok: boolean;
  /** Error message from the server body when `ok` is false. */
  error?: string;
}

/**
 * Sends the WaitlistForm submission to POST /api/waitlist and returns the
 * parsed result.
 *
 * Extracted from the WaitlistForm component so that the fetch call can be
 * verified in unit tests without a DOM/React environment.
 *
 * @param email    The email address to register (submitted by the form).
 * @param source   The form placement identifier (e.g. "hero", "bottom").
 * @param fetchFn  Injectable fetch function.  Defaults to `globalThis.fetch`
 *                 at runtime; tests supply a mock.
 */
export async function callWaitlistApi(
  email: string,
  source: string,
  fetchFn: FetchFn = globalThis.fetch
): Promise<WaitlistApiResult> {
  const r = await fetchFn("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source }),
  });
  const d = await r.json();
  if (!r.ok) {
    return { ok: false, error: d.error ?? "오류가 발생했습니다." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// WaitlistForm loading-state UI derivations — Sub-AC 8d-2
// ---------------------------------------------------------------------------

/**
 * The four states the WaitlistForm occupies during its lifecycle.
 * Mirrors the `status` useState type in the component.
 */
export type WaitlistFormStatus = "idle" | "loading" | "done" | "error";

/**
 * Render properties that the submit button derives from the current status.
 * Returned by `getWaitlistSubmitButtonProps` so that loading-state behaviour
 * can be verified in tests without a DOM or React environment.
 */
export interface SubmitButtonProps {
  /** true while the API call is in-flight — prevents duplicate submissions. */
  disabled: boolean;
  /** Visual opacity: 0.6 when loading (dimmed), 1 otherwise. */
  opacity: number;
  /** Button label: "신청 중…" while loading, "사전 신청" otherwise. */
  label: string;
}

/**
 * Pure derivation function for the WaitlistForm submit button's render props.
 *
 * Extracted from the JSX in apps/web/app/(landing)/page.tsx so the loading-
 * state behaviour can be tested without a DOM or React environment.
 *
 * Rules (mirror the JSX):
 *   - disabled: true  only when status === "loading"
 *   - opacity:  0.6   when loading, 1 otherwise
 *   - label:    "신청 중…" when loading, "사전 신청" otherwise
 */
export function getWaitlistSubmitButtonProps(
  status: WaitlistFormStatus
): SubmitButtonProps {
  const isLoading = status === "loading";
  return {
    disabled: isLoading,
    opacity: isLoading ? 0.6 : 1,
    label: isLoading ? "신청 중…" : "사전 신청",
  };
}

// ---------------------------------------------------------------------------
// WaitlistForm success/done view state — Sub-AC 8d-3
// ---------------------------------------------------------------------------

/**
 * The view state derived from the current WaitlistForm status.
 * Returned by `getWaitlistFormViewState`.
 */
export interface WaitlistFormViewState {
  /** true when the <form> element should be rendered. */
  showForm: boolean;
  /**
   * Non-null when the success confirmation <p> should be rendered instead
   * of the form.  Contains the exact confirmation message text.
   */
  successMessage: string | null;
}

/**
 * The exact text shown in the success confirmation paragraph after a
 * successful /api/waitlist submission.  Exported as a named constant so
 * tests can assert on the precise string without hardcoding it in multiple
 * places.
 */
export const WAITLIST_SUCCESS_MESSAGE =
  "✓ 신청 완료 — 오픈 시 가장 먼저 알려드릴게요.";

/**
 * Pure derivation function for WaitlistForm's top-level render state.
 *
 * When status === "done" (i.e. /api/waitlist returned a 2xx response), the
 * form element is replaced by the success confirmation paragraph.
 * All other statuses keep the form visible with no success message.
 *
 * Mirrors the conditional at the top of the WaitlistForm component
 * (apps/web/app/(landing)/page.tsx) so the success-state behaviour can be
 * verified in tests without a DOM or React environment.
 */
export function getWaitlistFormViewState(
  status: WaitlistFormStatus
): WaitlistFormViewState {
  if (status === "done") {
    return { showForm: false, successMessage: WAITLIST_SUCCESS_MESSAGE };
  }
  return { showForm: true, successMessage: null };
}

// ---------------------------------------------------------------------------
// WaitlistForm error/failure view state — Sub-AC 8d-4
// ---------------------------------------------------------------------------

/**
 * The error message used when the component catches a network-level exception
 * (i.e. `callWaitlistApi` threw instead of returning a result).
 * Mirrors the catch block in WaitlistForm.submit:
 *   catch { setErr("네트워크 오류"); setStatus("error"); }
 *
 * Exported as a constant so tests can assert the exact string without
 * hardcoding it in multiple places.
 */
export const WAITLIST_NETWORK_ERROR_MESSAGE = "네트워크 오류";

/**
 * The fallback error message used when the API returns ok:false but the
 * response body did not include an `error` field.
 * Mirrors the expression: `result.error ?? "오류가 발생했습니다."`
 */
export const WAITLIST_FALLBACK_ERROR_MESSAGE = "오류가 발생했습니다.";

/**
 * Render state for WaitlistForm's error UI layer.
 * Returned by `getWaitlistFormErrorViewState`.
 */
export interface WaitlistErrorViewState {
  /** true when the <form> element should be rendered (false only on "done"). */
  showForm: boolean;
  /** true when the error <p> should be rendered (only when status is "error"). */
  showError: boolean;
  /**
   * The error text that goes inside the error <p>, or null when there is no
   * error to display.  Mirrors the `err` state variable in the component.
   */
  errorMessage: string | null;
}

/**
 * Pure derivation function for WaitlistForm's error UI layer render state.
 *
 * When status === "error" (i.e. the API returned a 4xx/5xx or a network
 * exception was caught) the error paragraph should be rendered with the
 * appropriate message text.
 *
 * All other statuses produce showError = false and errorMessage = null.
 *
 * Mirrors the conditional in the WaitlistForm component:
 *   {status === "error" && <p ...>{err}</p>}
 *
 * @param status     Current WaitlistForm status.
 * @param errorText  The error message string to display.  Defaults to
 *                   WAITLIST_FALLBACK_ERROR_MESSAGE when omitted so that the
 *                   caller can forward `result.error ?? WAITLIST_FALLBACK_ERROR_MESSAGE`
 *                   without an extra null-check.
 */
export function getWaitlistFormErrorViewState(
  status: WaitlistFormStatus,
  errorText?: string
): WaitlistErrorViewState {
  if (status === "error") {
    return {
      showForm: true,
      showError: true,
      errorMessage: errorText ?? WAITLIST_FALLBACK_ERROR_MESSAGE,
    };
  }
  return {
    showForm: status !== "done",
    showError: false,
    errorMessage: null,
  };
}

// ---------------------------------------------------------------------------
// sendWaitlistConfirmationEmail
// ---------------------------------------------------------------------------

/**
 * Minimal structural interface for the Resend `emails` sub-client.
 * Defined locally so test environments can inject a mock without importing
 * the `resend` package.
 */
export interface ResendEmailsSendClient {
  send(payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
  }): Promise<{
    data: { id: string } | null;
    error: { message: string } | null;
  }>;
}

/**
 * Minimal structural interface for the Resend client injected via tests.
 */
export interface ResendClient {
  emails: ResendEmailsSendClient;
}

/**
 * Sends a waitlist confirmation email to the given address via the Resend API.
 *
 * Throws an `Error` if the Resend API returns an error response so that
 * callers can handle delivery failures explicitly.
 *
 * @param email   Recipient address (already normalised by the caller).
 * @param resend  Optional Resend client (injected in tests). Defaults to a
 *                real `Resend` instance via a lazy import so that the package
 *                is never loaded when a mock is provided.
 */
export async function sendWaitlistConfirmationEmail(
  email: string,
  resend?: ResendClient
): Promise<void> {
  let client: ResendClient;

  if (resend) {
    client = resend;
  } else {
    // Lazy import: `resend` is only resolved at runtime when no mock is given.
    const { Resend } = await import("resend");
    client = new Resend(process.env.RESEND_API_KEY) as unknown as ResendClient;
  }

  const { error } = await client.emails.send({
    from: "noonch-i <noreply@noonchi.so>",
    to: [email],
    subject: "웨이트리스트 등록 확인 — noonch-i",
    html: [
      "<p>안녕하세요!</p>",
      "<p>눈치(noonch-i) 웨이트리스트에 등록해 주셔서 감사합니다.</p>",
      "<p>서비스가 준비되면 가장 먼저 연락드리겠습니다.</p>",
      "<p>감사합니다,<br/>noonch-i 팀</p>",
    ].join("\n"),
  });

  if (error) {
    throw new Error(`waitlist confirmation email failed: ${error.message}`);
  }
}
