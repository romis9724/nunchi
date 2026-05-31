import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { type?: string; text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 422 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("feedback").insert({
    type: body.type ?? "suggestion",
    text: body.text.trim(),
  });

  if (error) {
    // feedback 테이블이 없으면 graceful fallback — 서비스 중단 없음
    console.error("feedback insert error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
