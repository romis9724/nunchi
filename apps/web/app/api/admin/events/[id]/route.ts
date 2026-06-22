import { NextRequest, NextResponse } from "next/server";
import { updateEventStatus } from "@/lib/repositories/events.repo";

const ALLOWED_STATUSES = ["draft", "pending_review", "approved", "archived"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { status } = body as { status?: string };
  if (!status || !(ALLOWED_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "유효하지 않은 status 값입니다." }, { status: 422 });
  }

  try {
    await updateEventStatus((await params).id, status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
