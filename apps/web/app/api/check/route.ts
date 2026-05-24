import { NextRequest, NextResponse } from "next/server";
import type { CheckRequest } from "@nunchi/shared";
import { runReviewEngine } from "@/lib/review-engine";

export async function POST(request: NextRequest) {
  let body: CheckRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.date || !body.copy?.trim()) {
    return NextResponse.json(
      { error: "날짜(date)와 카피(copy)는 필수입니다." },
      { status: 422 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json(
      { error: "날짜 형식은 YYYY-MM-DD 이어야 합니다." },
      { status: 422 }
    );
  }

  if (body.copy.length > 2000) {
    return NextResponse.json(
      { error: "카피는 2,000자 이하여야 합니다." },
      { status: 422 }
    );
  }

  try {
    const result = await runReviewEngine({
      date: body.date,
      campaignName: body.campaignName?.slice(0, 200),
      copy: body.copy.trim(),
      assetKeywords: body.assetKeywords?.slice(0, 20),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[check] review engine error:", error);
    return NextResponse.json(
      { error: "검토 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
