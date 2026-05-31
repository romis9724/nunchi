/**
 * news-automation.ts — Route Handler logic for the news automation cron job.
 *
 * Responsibilities (Sub-AC 14c-3):
 *  1. CRON_SECRET header authentication — rejects requests with missing or
 *     incorrect `Authorization: Bearer {CRON_SECRET}` headers with HTTP 401.
 *  2. Orchestrator delegation — delegates the actual automation work to a
 *     `NewsAutomationOrchestrator` function, defaulting to the real
 *     implementation at runtime.
 *  3. HTTP response production — returns a typed `CronHandlerResult` carrying
 *     the HTTP status code and JSON body so the Next.js route handler can map
 *     it to a `NextResponse` without touching business logic.
 *
 * The pure `handleCronNewsAutomation` function is exported so integration tests
 * can inject mock requests and mock orchestrators without importing Next.js.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Result produced by the news automation orchestrator.
 *
 * Defined here as a minimal contract; the concrete implementation lives in the
 * sibling orchestrator module (Sub-ACs 14c-1 and 14c-2).
 */
export interface NewsAutomationResult {
  /** Number of draft events created during this run. */
  eventsCreated: number;
  /** Non-fatal error messages accumulated during the run (empty = clean run). */
  errors: string[];
}

/**
 * The orchestrator function that performs the actual news collection and
 * event-draft creation. Accepts an optional injection point so tests can
 * supply a stub without importing the real implementation.
 */
export type NewsAutomationOrchestrator = () => Promise<NewsAutomationResult>;

/**
 * Minimal request-like interface that mirrors the subset of `NextRequest` (and
 * the browser `Request`) used by `handleCronNewsAutomation`. Keeping this
 * structural allows test code to construct plain objects instead of real
 * `NextRequest` instances.
 */
export interface CronRequest {
  headers: {
    get(name: string): string | null;
  };
}

/**
 * Value returned by `handleCronNewsAutomation`.
 *
 * The route handler maps this to a `NextResponse` so that the business logic
 * stays decoupled from the Next.js runtime.
 */
export interface CronHandlerResult {
  /** HTTP status code to return. */
  status: number;
  /** JSON body to return. */
  body: Record<string, unknown>;
}

// ── handleCronNewsAutomation ─────────────────────────────────────────────────

/**
 * Pure handler for the `/api/cron/news-automation` route.
 *
 * Authentication:
 *   Checks the `Authorization` header for the value `Bearer {secret}`.
 *   Returns `{ status: 401, body: { error: "Unauthorized" } }` when the header
 *   is absent, malformed, or does not match the expected secret.
 *
 * Delegation:
 *   Calls `orchestrator()` (the injected or default implementation) and
 *   returns its result in the response body on success.
 *
 * Error handling:
 *   Returns `{ status: 500, body: { error: "…" } }` when the orchestrator
 *   throws; the thrown error message is included in the body for observability.
 *
 * @param request      Request-like object whose headers are inspected for the
 *                     CRON_SECRET bearer token.
 * @param orchestrator Optional orchestrator to call. At runtime this defaults
 *                     to a lazy import of the real implementation so that the
 *                     module is never loaded during testing.
 * @param secret       The expected CRON_SECRET value. Defaults to
 *                     `process.env.CRON_SECRET` when omitted. Injected by
 *                     tests so tests do not need to manipulate env vars.
 */
export async function handleCronNewsAutomation(
  request: CronRequest,
  orchestrator?: NewsAutomationOrchestrator,
  secret?: string
): Promise<CronHandlerResult> {
  // ── Authentication ────────────────────────────────────────────────────────

  const expectedSecret = secret ?? process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const expectedBearer =
    expectedSecret != null ? `Bearer ${expectedSecret}` : null;

  if (!authHeader || authHeader !== expectedBearer) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  // ── Orchestrator delegation ───────────────────────────────────────────────

  let runOrchestrator: NewsAutomationOrchestrator;

  if (orchestrator) {
    runOrchestrator = orchestrator;
  } else {
    // Lazy import: the real orchestrator is only resolved at runtime so that
    // test environments are never burdened with its dependencies.
    const mod = await import("./news-orchestrator");
    runOrchestrator = mod.runNewsOrchestrator;
  }

  try {
    const result = await runOrchestrator();

    return {
      status: 200,
      body: {
        ok: true,
        eventsCreated: result.eventsCreated,
        errors: result.errors,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/news-automation] orchestrator error:", message);

    return {
      status: 500,
      body: { error: "뉴스 자동화 실행 중 오류가 발생했습니다.", detail: message },
    };
  }
}
