import { AppHeader } from "@/components/AppHeader";
import { toneToGrade } from "@noonchi/shared";
import type { EventRecord } from "@noonchi/shared";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CalendarClient, type CalendarEvent } from "./CalendarClient";

// Revalidate the calendar page hourly. Events are curated content that change
// rarely (we only seed when data/events/*.json is edited), so this matches
// the actual update cadence and keeps Supabase reads near zero per visitor.
export const revalidate = 3600;

/**
 * Server-side fetch of curated Korean sensitive-day events from Supabase.
 * Filters to recurring/fixed events with a specific day (range events are
 * skipped for now — the calendar grid renders one day at a time).
 *
 * If Supabase env vars are unavailable (typically during `next build` when
 * secrets aren't injected), returns an empty array so the page can still
 * pre-render. ISR (`revalidate = 3600`) then refills the cache on the first
 * real request where env vars exist.
 */
async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasEnv) {
    return [];
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("events")
    .select("slug, month, day, name, category, risk_level, recommended_tone, summary")
    .eq("status", "approved")
    .not("day", "is", null)
    .order("month", { ascending: true })
    .order("day", { ascending: true });

  if (error) {
    console.error("[calendar] events fetch failed:", error.message);
    return [];
  }

  // Map DB rows to the shape CalendarClient expects. The grade is derived
  // from (recommended_tone, risk_level) using the shared `toneToGrade`
  // helper — same logic the review-engine uses, so the calendar agrees
  // with /api/check responses by construction.
  const rows = (data ?? []) as Array<
    Pick<EventRecord, "slug" | "month" | "day" | "name" | "category" | "risk_level" | "recommended_tone" | "summary">
  >;

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
