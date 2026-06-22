import { NextRequest, NextResponse } from "next/server";
import type { CheckRequest } from "@noonchi/shared";
import { runReviewEngine } from "@/lib/review-engine";
import { personalizeRationale } from "@noonchi/llm";
import { auth } from "@/auth";
import { findUserProfile } from "@/lib/repositories/users.repo";

// Vercel Pro 이상에서 최대 300s, Hobby는 10s 기본값
export const maxDuration = 60;

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

    // personalizeRationale 후처리 — 공통 캐시는 그대로, 로그인 사용자에게만 적용
    // industries·channels만 LLM에 전달 (B-2 캐시 전략 준수)
    const session = await auth();

    if (session?.user?.id) {
      const profile = await findUserProfile(session.user.id);

      if (profile && (profile.industries.length > 0 || profile.channels.length > 0)) {
        const personalizedComment = await personalizeRationale({
          grade: result.grade,
          rationale: result.rationale,
          suggestions: result.suggestions,
          industries: profile.industries,
          channels: profile.channels,
        });
        if (personalizedComment) {
          return NextResponse.json({ ...result, personalizedComment });
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[check] review engine error:", msg);
    return NextResponse.json(
      { error: "검토 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", detail: msg },
      { status: 500 }
    );
  }
}
