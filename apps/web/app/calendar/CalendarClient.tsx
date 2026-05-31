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

const GRADE_DOT_COLOR: Record<Grade, string> = {
  F: "#C50F1F",
  D: "#BC4B09",
  C: "#CA8A04",
  B: "#107C10",
  A: "var(--grade-a-border)",
};

const GRADE_ROW_BG: Record<Grade, string> = {
  A: "var(--grade-a-bg)", B: "var(--grade-b-bg)",
  C: "#ffffff",           D: "var(--grade-d-bg)", F: "var(--grade-f-bg)",
};

const GRADE_ORDER: Grade[] = ["F", "D", "C", "B", "A"];

function gradeRank(g: Grade): number {
  return GRADE_ORDER.indexOf(g);
}

function sortByGrade(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade));
}

interface SelectedDay {
  day: number;
  events: CalendarEvent[];
}

interface CalendarClientProps {
  events: CalendarEvent[];
}

const LEGEND_ITEMS: { grade: Grade; label: string }[] = [
  { grade: "F", label: "즉각회피" },
  { grade: "D", label: "재검토" },
  { grade: "C", label: "주의" },
  { grade: "B", label: "안전" },
];

export function CalendarClient({ events }: CalendarClientProps) {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const prevMonth = () => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const e of events) {
    if (e.month === current.getMonth() + 1) {
      if (!eventsByDay[e.day]) eventsByDay[e.day] = [];
      eventsByDay[e.day].push(e);
    }
  }
  // Sort each day's events by risk (F first)
  for (const d of Object.keys(eventsByDay)) {
    eventsByDay[Number(d)] = sortByGrade(eventsByDay[Number(d)]);
  }

  const monthEvents = sortByGrade(
    events.filter((e) => e.month === current.getMonth() + 1)
  ).sort((a, b) => a.day - b.day);

  const currentYear = current.getFullYear();
  const currentMonthNum = current.getMonth() + 1;

  function handleDayClick(d: number) {
    const dayEvents = eventsByDay[d] ?? [];
    setSelectedDay({ day: d, events: dayEvents });
  }

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 32px 80px" }}>

      {/* Page header */}
      <div style={{ marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-ink)", marginBottom: "8px" }}>◈ Brand Calendar</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--charcoal)", margin: 0 }}>
            캠페인 캘린더
          </h1>
        </div>

        {/* Grade legend */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {LEGEND_ITEMS.map(({ grade, label }) => (
            <div key={grade} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: GRADE_DOT_COLOR[grade],
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted-ink)", letterSpacing: "0.02em" }}>
                {label}({grade})
              </span>
            </div>
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
              const isSelected = selectedDay?.day === d;

              return (
                <button
                  key={d}
                  onClick={() => handleDayClick(d)}
                  aria-pressed={isSelected}
                  aria-label={`${currentMonthNum}월 ${d}일${dayEvents.length ? ` — 이벤트 ${dayEvents.length}건` : ""}`}
                  style={{
                    minHeight: "80px",
                    padding: "8px",
                    textAlign: "left",
                    background: isSelected
                      ? "var(--ms-blue-mid)"
                      : isHighlight && topGrade
                        ? GRADE_ROW_BG[topGrade]
                        : "transparent",
                    cursor: "pointer",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "1px solid var(--border-faint)",
                    borderBottom: isSelected
                      ? "2px solid var(--ms-blue)"
                      : "1px solid var(--border-faint)",
                    outline: "none",
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

                  {/* Up to 3 dots for events, sorted by severity */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", marginTop: "5px", flexWrap: "wrap" }}>
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.slug}
                          title={e.name}
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: GRADE_DOT_COLOR[e.grade],
                            flexShrink: 0,
                            display: "inline-block",
                          }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: "9px", color: "var(--muted-ink)", lineHeight: "7px" }}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Selected day detail panel */}
          {selectedDay ? (
            <div style={{ background: "#FFF", border: "1px solid var(--border-warm)", borderRadius: "14px", overflow: "hidden" }}>
              {/* Panel header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border-faint)", background: "var(--ms-surface-2)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--charcoal)", margin: 0, fontFamily: "var(--font-display)" }}>
                  {currentMonthNum}월 {selectedDay.day}일
                </p>
                <button
                  onClick={() => setSelectedDay(null)}
                  aria-label="닫기"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--muted-ink)", lineHeight: 1, padding: "2px 4px" }}
                >
                  ×
                </button>
              </div>

              {/* Event list or empty state */}
              {selectedDay.events.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "var(--muted-ink)", margin: "0 0 12px", lineHeight: 1.6 }}>
                    이 날은 등록된 민감일이 없습니다.
                  </p>
                  <Link
                    href={`/check?date=${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(selectedDay.day).padStart(2, "0")}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "12px", fontWeight: 700,
                      color: "var(--ms-blue)", textDecoration: "none",
                    }}
                  >
                    캠페인 검토하기 →
                  </Link>
                </div>
              ) : (
                <div>
                  {selectedDay.events.map((e) => (
                    <div
                      key={e.slug}
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border-faint)",
                        background: GRADE_ROW_BG[e.grade],
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <GradeBadge grade={e.grade} size="xs" showLabel={false} />
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                          {e.name}
                        </span>
                      </div>
                      {e.summary && (
                        <p style={{ fontSize: "12px", color: "var(--muted-ink)", margin: "0 0 8px", lineHeight: 1.55 }}>
                          {e.summary}
                        </p>
                      )}
                      <Link
                        href={`/check?date=${currentYear}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11px", fontWeight: 700,
                          color: "var(--ms-blue)", textDecoration: "none",
                        }}
                      >
                        캠페인 검토하기 →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
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
                    onClick={() => handleDayClick(e.day)}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      width: "100%", padding: "12px 16px",
                      background: selectedDay?.day === e.day ? "var(--ms-blue-mid)" : GRADE_ROW_BG[e.grade],
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
