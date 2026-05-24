"use client";

import { useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import type { Grade } from "@nunchi/shared";
import { GradeBadge } from "@/components/result-card/GradeBadge";

export interface CalendarEvent {
  month: number;
  day: number;
  name: string;
  grade: Grade;
  slug: string;
  summary: string;
  category: string;
}

const GRADE_DOT: Record<Grade, string> = {
  A: "var(--grade-a-border)", B: "var(--grade-b-border)",
  C: "var(--grade-c-border)", D: "var(--grade-d-border)", F: "var(--grade-f-border)",
};

const GRADE_ROW_BG: Record<Grade, string> = {
  A: "var(--grade-a-bg)", B: "var(--grade-b-bg)",
  C: "#ffffff",           D: "var(--grade-d-bg)", F: "var(--grade-f-bg)",
};

interface CalendarClientProps {
  events: CalendarEvent[];
}

export function CalendarClient({ events }: CalendarClientProps) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const prevMonth = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const e of events) {
    if (e.month === current.getMonth() + 1) {
      if (!eventsByDay[e.day]) eventsByDay[e.day] = [];
      eventsByDay[e.day].push(e);
    }
  }

  const monthEvents = events.filter((e) => e.month === current.getMonth() + 1);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 32px 80px" }}>

      {/* Page header */}
      <div style={{ marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-ink)", marginBottom: "8px" }}>◈ Brand Calendar</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--charcoal)", margin: 0 }}>
            민감일 캘린더
          </h1>
        </div>

        {/* Grade legend */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["A","B","C","D","F"] as Grade[]).map((g) => (
            <GradeBadge key={g} grade={g} size="xs" showLabel={false} />
          ))}
        </div>
      </div>

      {/* Grid layout: calendar + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }} className="calendar-layout">

        {/* Calendar */}
        <div style={{ background: "#FFF", border: "1px solid var(--border-warm)", borderRadius: "16px", overflow: "hidden" }}>

          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border-warm)" }}>
            <button onClick={prevMonth} aria-label="이전 달" style={{ background: "none", border: "1px solid var(--border-warm)", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px", color: "var(--charcoal)" }}>←</button>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", letterSpacing: "-0.02em", color: "var(--charcoal)", margin: 0 }}>
              {format(current, "yyyy년 M월", { locale: ko })}
            </h2>
            <button onClick={nextMonth} aria-label="다음 달" style={{ background: "none", border: "1px solid var(--border-warm)", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px", color: "var(--charcoal)" }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-faint)" }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.04em" }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} style={{ minHeight: "80px", borderRight: "1px solid var(--border-faint)", borderBottom: "1px solid var(--border-faint)" }} />
            ))}

            {days.map((day) => {
              const d = day.getDate();
              const dayEvents = eventsByDay[d] ?? [];
              const topGrade = dayEvents[0]?.grade;
              const isHighlight = topGrade === "F" || topGrade === "A";

              return (
                <button
                  key={d}
                  onClick={() => setSelected(dayEvents[0] ?? null)}
                  style={{
                    minHeight: "80px",
                    padding: "8px",
                    textAlign: "left",
                    background: isHighlight && topGrade ? GRADE_ROW_BG[topGrade] : "transparent",
                    cursor: dayEvents.length ? "pointer" : "default",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "1px solid var(--border-faint)",
                    borderBottom: "1px solid var(--border-faint)",
                  } as React.CSSProperties}
                >
                  <span style={{
                    fontSize: "12px", fontWeight: 700, lineHeight: 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: isToday(day) ? "var(--charcoal)" : "transparent",
                    color: isToday(day) ? "#FFF" : "var(--charcoal)",
                  }}>
                    {d}
                  </span>
                  {dayEvents.slice(0, 2).map((e) => (
                    <div key={e.slug} style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: GRADE_DOT[e.grade], flexShrink: 0 }} />
                      <span style={{ fontSize: "10px", color: "var(--muted-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                    </div>
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Selected event detail */}
          {selected ? (
            <div style={{ background: GRADE_ROW_BG[selected.grade], border: "1px solid var(--border-warm)", borderRadius: "14px", padding: "20px", position: "relative" }}>
              <button
                onClick={() => setSelected(null)}
                aria-label="닫기"
                style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--muted-ink)" }}
              >
                ×
              </button>
              <div style={{ marginBottom: "12px" }}>
                <GradeBadge grade={selected.grade} size="sm" showLabel />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "16px", color: "var(--charcoal)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>{selected.name}</h3>
              <p style={{ fontSize: "12px", color: "var(--muted-ink)", margin: "0 0 12px" }}>매년 {selected.month}월 {selected.day}일</p>
              <p style={{ fontSize: "13px", color: "var(--charcoal)", lineHeight: 1.65, margin: "0 0 16px" }}>{selected.summary}</p>
              <Link
                href={`/check?date=${new Date().getFullYear()}-${String(selected.month).padStart(2,"0")}-${String(selected.day).padStart(2,"0")}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "13px", fontWeight: 700,
                  background: "var(--charcoal)", color: "#FFF",
                  padding: "10px 18px", borderRadius: "10px", textDecoration: "none",
                  fontFamily: "var(--font-display)",
                }}
              >
                이 날짜로 검토 →
              </Link>
            </div>
          ) : (
            <div style={{ background: "var(--lavender-gray)", border: "1px solid var(--border-warm)", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--muted-ink)", lineHeight: 1.6, margin: 0 }}>
                날짜를 클릭하면<br />사건 상세를 확인할 수 있어요
              </p>
            </div>
          )}

          {/* Month events list */}
          {monthEvents.length > 0 && (
            <div style={{ background: "#FFF", border: "1px solid var(--border-warm)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-faint)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-ink)", margin: 0 }}>이달의 주요 날짜</p>
              </div>
              <div>
                {monthEvents.map((e) => (
                  <button
                    key={e.slug}
                    onClick={() => setSelected(e)}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      width: "100%", padding: "12px 16px",
                      background: selected?.slug === e.slug ? GRADE_ROW_BG[e.grade] : "transparent",
                      border: "none", borderBottom: "1px solid var(--border-faint)", cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-ink)", minWidth: "28px" }}>
                      {e.day}일
                    </span>
                    <GradeBadge grade={e.grade} size="xs" showLabel={false} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--charcoal)" }}>{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick check CTA */}
          <Link
            href="/check"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "14px", borderRadius: "12px",
              background: "var(--charcoal)", color: "#FFF",
              fontSize: "14px", fontWeight: 700, textDecoration: "none",
              fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
            }}
          >
            검토 시작하기
          </Link>
        </div>
      </div>
    </main>
  );
}
