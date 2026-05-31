import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("events")
    .select("id, month, day, event_date, name, category, risk_level, status, source, summary")
    .order("month", { ascending: true })
    .order("day", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 날짜 표시용 date 문자열 조합
  const result = (data ?? []).map((e) => ({
    ...e,
    date: e.event_date
      ? e.event_date
      : `${String(e.month).padStart(2, "0")}-${String(e.day ?? 0).padStart(2, "0")}`,
  }));

  return NextResponse.json(result);
}
