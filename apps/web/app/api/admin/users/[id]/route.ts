import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { role?: string };
  if (!body.role || !["user", "admin"].includes(body.role)) {
    return NextResponse.json({ error: "유효하지 않은 role" }, { status: 422 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("users").update({ role: body.role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
