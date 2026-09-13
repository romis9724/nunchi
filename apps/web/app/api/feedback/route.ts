import { NextRequest, NextResponse } from "next/server";
import { insertFeedback } from "@/lib/repositories/feedback.repo";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { type?: string; text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ ok: false, error: "내용을 입력해 주세요." }, { status: 422 });
  }

  try {
    await insertFeedback({ type: body.type ?? "suggestion", text: body.text.trim() });
  } catch (err) {
    // 저장 실패를 성공으로 가리지 않는다 — 위젯이 재시도를 안내한다.
    console.error(
      "feedback insert error:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ ok: false, error: "접수하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
