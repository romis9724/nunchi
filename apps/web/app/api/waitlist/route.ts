import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: { email: string; source?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "올바른 이메일 주소를 입력해주세요." },
      { status: 422 }
    );
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from("waitlist")
      .upsert({ email, source: body.source ?? "landing" }, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      console.error("[waitlist] supabase error:", error);
      return NextResponse.json({ error: "등록 중 오류가 발생했습니다." }, { status: 500 });
    }
  } catch (error) {
    console.error("[waitlist] error:", error);
    return NextResponse.json({ error: "등록 중 오류가 발생했습니다." }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Nunchi <no-reply@nunchi.app>",
        to: email,
        subject: "사전 신청 완료 — Nunchi",
        html: `<p>안녕하세요,</p><p>Nunchi 사전 신청에 감사드립니다. 정식 오픈 시 가장 먼저 알려드리겠습니다.</p>`,
      });
    } catch (emailError) {
      console.error("[waitlist] email error:", emailError);
    }
  }

  return NextResponse.json({ success: true });
}
