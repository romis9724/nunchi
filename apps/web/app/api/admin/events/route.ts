import { NextRequest, NextResponse } from "next/server";
import { findAdminEvents } from "@/lib/repositories/events.repo";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let data;
  try {
    data = await findAdminEvents(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 날짜 표시용 date 문자열 조합. events 테이블에 별도 event_date 컬럼은 없으므로
  // month-day 로 조합한다.
  const result = data.map((e) => ({
    ...e,
    date: `${String(e.month).padStart(2, "0")}-${String(e.day ?? 0).padStart(2, "0")}`,
  }));

  return NextResponse.json(result);
}
