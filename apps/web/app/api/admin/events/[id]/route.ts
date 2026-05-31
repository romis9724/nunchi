import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_STATUSES = ["draft", "pending_review", "approved", "archived"] as const;
type EventStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("events")
    .update({ status: status as EventStatus })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
