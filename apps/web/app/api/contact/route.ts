import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { name, email, message } = body as { name?: string; email?: string; message?: string };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "이름, 이메일, 메시지는 필수입니다." }, { status: 422 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "올바른 이메일 형식이 아닙니다." }, { status: 422 });
  }

  // DB 저장
  const supabase = getSupabaseAdmin();
  const { data: inquiry, error: dbError } = await supabase
    .from("inquiries")
    .insert({ name: name.trim(), email: email.trim(), message: message.trim() })
    .select()
    .single();

  if (dbError) {
    console.error("[contact] DB insert error:", dbError.message);
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  // 관리자 알림 이메일 (실패해도 사용자에게는 성공 응답)
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "romis9724@gmail.com";
    await sendMail({
      to: adminEmail,
      subject: `[nunchi 문의] ${name.trim()}`,
      replyTo: email.trim(),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#0078D4">새로운 문의가 도착했습니다</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;width:80px">이름</td><td style="padding:8px 0;font-weight:600">${name.trim()}</td></tr>
            <tr><td style="padding:8px 0;color:#666">이메일</td><td style="padding:8px 0"><a href="mailto:${email.trim()}">${email.trim()}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666">문의 ID</td><td style="padding:8px 0;font-size:12px;color:#999">${inquiry.id}</td></tr>
            <tr><td style="padding:8px 0;color:#666">시각</td><td style="padding:8px 0;font-size:12px;color:#999">${new Date().toLocaleString("ko-KR")}</td></tr>
          </table>
          <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
          <h3 style="color:#333;margin:0 0 8px">메시지</h3>
          <div style="background:#f8f8f8;padding:16px;border-radius:8px;white-space:pre-wrap;line-height:1.7">${message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:#999">이 메일에 직접 답장하면 문의자(${email.trim()})에게 전달됩니다.</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("[contact] Email send error:", emailErr);
  }

  return NextResponse.json({ ok: true, id: inquiry.id });
}
