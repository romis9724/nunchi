import { NextRequest, NextResponse } from "next/server";
import { insertFeedback } from "@/lib/repositories/feedback.repo";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { type?: string; text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 422 });
  }

  try {
    await insertFeedback({ type: body.type ?? "suggestion", text: body.text.trim() });
  } catch (err) {
    // feedback 테이블이 없으면 graceful fallback — 서비스 중단 없음
    console.error(
      "feedback insert error:",
      err instanceof Error ? err.message : err
    );
  }

  return NextResponse.json({ ok: true });
}
