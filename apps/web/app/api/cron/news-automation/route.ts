import { NextRequest, NextResponse } from "next/server";
import { handleCronNewsAutomation } from "@/lib/news-automation";

/**
 * POST /api/cron/news-automation
 *
 * Cron-triggered entrypoint for news automation (Sub-AC 14c-3).
 *
 * Authentication: `Authorization: Bearer {CRON_SECRET}` header.
 * Returns 401 when the header is absent or incorrect.
 * Returns 500 when the orchestrator throws.
 * Returns 200 with `{ ok: true, eventsCreated, errors }` on success.
 *
 * This handler is intentionally thin — all business logic lives in
 * `handleCronNewsAutomation` (lib/news-automation.ts) which is fully
 * unit-testable without the Next.js runtime.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = await handleCronNewsAutomation(request);
  return NextResponse.json(result.body, { status: result.status });
}
