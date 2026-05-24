import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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
    await query(
      `INSERT INTO waitlist (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email, body.source ?? "landing"]
    );
  } catch (error) {
    console.error("[waitlist] db error:", error);
    return NextResponse.json(
      { error: "등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Nunchi <no-reply@nunchi.app>",
        to: email,
        subject: "웨이트리스트에 등록되었습니다 — Nunchi",
        html: `<p>안녕하세요,</p>
<p>Nunchi 웨이트리스트에 등록해 주셔서 감사합니다. 정식 오픈 시 가장 먼저 알려드리겠습니다.</p>`,
      });
    } catch (emailError) {
      console.error("[waitlist] email send error:", emailError);
    }
  }

  return NextResponse.json({ success: true });
}
