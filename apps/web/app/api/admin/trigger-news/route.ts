import { NextResponse } from "next/server";
import { runNewsOrchestrator } from "@/lib/news-orchestrator";
import { requireAdmin } from "@/lib/auth-guard";

// Vercel Functions에서 자기 자신을 HTTP 호출하면 실패하므로 직접 실행
export async function POST() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const result = await runNewsOrchestrator();
    return NextResponse.json({
      ok: true,
      eventsCreated: result.eventsCreated,
      errors: result.errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trigger-news] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
