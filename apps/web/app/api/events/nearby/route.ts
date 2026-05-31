/**
 * GET /api/events/nearby?date=YYYY-MM-DD
 *
 * 입력 날짜 ±3일 범위의 큐레이션 이벤트를 반환한다.
 * /check 페이지에서 날짜 선택 시 관련 사건을 미리 보여주기 위함.
 *
 * - approved 상태(또는 status 컬럼 없음)만
 * - risk_level 우선순위로 정렬 (critical → low)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const PROXIMITY_DAYS = 3;

const RISK_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const TONE_TO_GRADE: Record<string, string> = {
  avoid: "F",
  memorial: "D",
  neutral: "C",
  celebration: "A",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "date 파라미터(YYYY-MM-DD)가 필요합니다." },
      { status: 400 }
    );
  }

  const date = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "유효하지 않은 날짜." }, { status: 400 });
  }

  const targetMonth = date.getUTCMonth() + 1;
  const targetDay = date.getUTCDate();

  try {
    const supabase = getSupabaseAdmin();
    // ±3일 윈도우 — 월 경계 케이스는 일단 무시(MVP)
    const { data, error } = await supabase
      .from("events")
      .select("id, slug, name, month, day, category, risk_level, summary, recommended_tone, references")
      .eq("country", "KR")
      .or(`status.is.null,status.eq.approved`);

    if (error) throw error;

    const inProximity = (data ?? []).filter((e) => {
      if (e.month !== targetMonth) return false;
      const day = e.day ?? targetDay;
      return Math.abs(day - targetDay) <= PROXIMITY_DAYS;
    });

    const sorted = inProximity
      .map((e) => ({
        id: e.id,
        slug: e.slug,
        name: e.name,
        month: e.month,
        day: e.day,
        category: e.category,
        riskLevel: e.risk_level,
        recommendedTone: e.recommended_tone,
        summary: e.summary,
        grade: TONE_TO_GRADE[e.recommended_tone] ?? "C",
      }))
      .sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 9) - (RISK_ORDER[b.riskLevel] ?? 9));

    return NextResponse.json({ date: dateStr, events: sorted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
