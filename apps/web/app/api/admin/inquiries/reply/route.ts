import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    inquiryId?: string;
    to?: string;
    name?: string;
    message?: string;
  };

  if (!body.to || !body.message?.trim()) {
    return NextResponse.json({ error: "수신자와 내용이 필요합니다." }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "이메일 설정이 없습니다." }, { status: 500 });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: "Nunchi 팀 <onboarding@resend.dev>",
      to: [body.to],
      subject: `[Nunchi] 문의 답장 — ${body.name ?? ""}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="margin-bottom:24px">
            <h2 style="color:#0078D4;margin:0 0 4px">Nunchi 팀입니다</h2>
            <p style="color:#666;margin:0;font-size:14px">문의하신 내용에 대한 답변을 드립니다.</p>
          </div>
          <div style="background:#f8f8f8;border-left:4px solid #0078D4;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;white-space:pre-wrap;line-height:1.7;font-size:14px;color:#333">
${body.message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;margin:0">
            nunchi-bay.vercel.app — 캠페인 날짜 리스크 분석 서비스
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
