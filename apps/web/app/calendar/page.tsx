import { AppHeader } from "@/components/AppHeader";
import { toneToGrade } from "@noonchi/shared";
import type { EventRecord } from "@noonchi/shared";
import { findApprovedEventsWithDay } from "@/lib/repositories/events.repo";
import { CalendarClient, type CalendarEvent } from "./CalendarClient";

// 요청 시 동적 렌더링. 빌드 시점엔 RDS에 접근할 수 없어 정적 프리렌더가 빈 데이터로
// 고정되는 문제(배포 직후 빈 캘린더)가 있어, 항상 런타임에 라이브 쿼리하도록 한다.
// events 는 소량(수십 건)이라 매 요청 쿼리 비용은 무시할 수준이다.
export const dynamic = "force-dynamic";

/**
 * Server-side fetch of curated Korean sensitive-day events from RDS (pg).
 * Filters to recurring/fixed events with a specific day (range events are
 * skipped for now — the calendar grid renders one day at a time).
 *
 * On any DB failure (e.g. during `next build` when the DB is unreachable),
 * returns an empty array so the page can still pre-render. ISR
 * (`revalidate = 3600`) then refills the cache on the first real request.
 */
async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  let rows: Array<
    Pick<EventRecord, "slug" | "month" | "day" | "name" | "category" | "risk_level" | "recommended_tone" | "summary">
  >;
  try {
    rows = await findApprovedEventsWithDay();
  } catch (err) {
    console.error(
      "[calendar] events fetch failed:",
      err instanceof Error ? err.message : err
    );
    return [];
  }

  // Map DB rows to the shape CalendarClient expects. The grade is derived
  // from (recommended_tone, risk_level) using the shared `toneToGrade`
  // helper — same logic the review-engine uses, so the calendar agrees
  // with /api/check responses by construction.
  return rows
    .filter((row): row is typeof row & { day: number } => typeof row.day === "number")
    .map<CalendarEvent>((row) => ({
      slug: row.slug,
      month: row.month,
      day: row.day,
      name: row.name,
      grade: toneToGrade(row.recommended_tone, row.risk_level),
      summary: row.summary,
      category: row.category,
    }));
}

export default async function CalendarPage() {
  const events = await fetchCalendarEvents();

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      <AppHeader />


      <CalendarClient events={events} />
    </div>
  );
}
