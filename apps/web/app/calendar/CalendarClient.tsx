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

const GRADE_LEFT_BORDER: Record<Grade, string> = {
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

const CATEGORY_LABEL: Record<string, string> = {
  memorial: "추모",
  political: "정치",
  social: "사회",
  disaster: "재난·사고",
  cultural: "문화",
  labor: "노동",
  economic: "경제",
};

function gradeRank(g: Grade): number {
  return GRADE_ORDER.indexOf(g);
}

function sortByGrade(evts: CalendarEvent[]): CalendarEvent[] {
  return [...evts].sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade));
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
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const today = new Date();
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
  const goToday = () => {
    setCurrent(new Date());
    setSelectedDay(null);
  };

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const e of events) {
    if (e.month === current.getMonth() + 1) {
      if (!eventsByDay[e.day]) eventsByDay[e.day] = [];
      eventsByDay[e.day].push(e);
    }
  }
  for (const d of Object.keys(eventsByDay)) {
    eventsByDay[Number(d)] = sortByGrade(eventsByDay[Number(d)]);
  }

  const monthEvents = sortByGrade(
    events.filter((e) => e.month === current.getMonth() + 1)
  ).sort((a, b) => a.day - b.day);

  const currentYear = current.getFullYear();
  const currentMonthNum = current.getMonth() + 1;
  const isCurrentMonth =
    today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonthNum;

  function handleDayClick(d: number) {
    const dayEvents = eventsByDay[d] ?? [];
    setSelectedDay({ day: d, events: dayEvents });
  }

  function getDayCellBackground(d: number, day: Date): string {
    const isSelected = selectedDay?.day === d;
    const isHovered = hoveredDay === d;
    const dayEvents = eventsByDay[d] ?? [];
    const topGrade = dayEvents[0]?.grade;
    const isHighlight = topGrade === "F" || topGrade === "A";

    if (isSelected) return "var(--ms-blue-mid)";
    if (isHovered && dayEvents.length > 0) return "var(--ms-surface-3)";
    if (isHovered) return "var(--ms-surface-2)";
    if (isHighlight && topGrade) return GRADE_ROW_BG[topGrade];
    return "transparent";
  }

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 32px 80px" }}>

      {/* Page header */}
      <div style={{ marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-ink)", marginBottom: "8px" }}>
            ◈ Brand Calendar
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--charcoal)", margin: 0 }}>
            캠페인 캘린더
          </h1>
        </div>

        {/* Inline legend */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
          {LEGEND_ITEMS.map(({ grade, label }) => (
            <div key={grade} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: GRADE_DOT_COLOR[grade],
                  flexShrink: 0, display: "inline-block",
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted-ink)", letterSpacing: "0.02em" }}>
                {label}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-warm)", gap: "12px" }}>
            <button
              onClick={prevMonth}
              aria-label="이전 달"
              style={{ background: "none", border: "1px solid var(--border-warm)", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px", color: "var(--charcoal)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ←
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "17px", letterSpacing: "-0.02em", color: "var(--charcoal)", margin: 0 }}>
                {format(current, "yyyy년 M월", { locale: ko })}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  aria-label="오늘로 이동"
                  style={{
                    background: "var(--ms-blue-light)", border: "1px solid var(--ms-blue-mid)",
                    borderRadius: "6px", padding: "3px 10px", cursor: "pointer",
                    fontSize: "11px", fontWeight: 700, color: "var(--ms-blue)",
                    fontFamily: "var(--font-body)", letterSpacing: "0.01em",
                  }}
                >
                  오늘
                </button>
              )}
            </div>

            <button
              onClick={nextMonth}
              aria-label="다음 달"
              style={{ background: "none", border: "1px solid var(--border-warm)", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px", color: "var(--charcoal)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-faint)" }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div
                key={d}
                style={{ padding: "10px 0", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.04em" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {Array.from({ length: startPad }).map((_, i) => (
              <div
                key={`pad-${i}`}
                style={{ minHeight: "80px", borderRight: "1px solid var(--border-faint)", borderBottom: "1px solid var(--border-faint)" }}
              />
            ))}

            {days.map((day) => {
              const d = day.getDate();
              const dayEvents = eventsByDay[d] ?? [];
              const isSelected = selectedDay?.day === d;
              const todayCell = isToday(day);

              return (
                <button
                  key={d}
                  onClick={() => handleDayClick(d)}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  aria-pressed={isSelected}
                  aria-label={`${currentMonthNum}월 ${d}일${dayEvents.length ? ` — 이벤트 ${dayEvents.length}건` : ""}`}
                  style={{
                    minHeight: "80px",
                    padding: "8px",
                    textAlign: "left",
                    background: getDayCellBackground(d, day),
                    cursor: "pointer",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "1px solid var(--border-faint)",
                    borderBottom: "1px solid var(--border-faint)",
                    outline: isSelected ? "2px solid var(--ms-blue)" : "none",
                    outlineOffset: "-2px",
                    transition: "background 0.12s",
                  } as React.CSSProperties}
                >
                  <span style={{
                    fontSize: "12px", fontWeight: 700, lineHeight: 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: todayCell ? "var(--ms-blue)" : "transparent",
                    color: todayCell ? "#FFF" : "var(--charcoal)",
                  }}>
                    {d}
                  </span>

                  {/* Up to 3 event dots, sorted by severity */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", marginTop: "5px", flexWrap: "wrap" }}>
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.slug}
                          title={e.name}
                          style={{
                            width: "6px", height: "6px", borderRadius: "50%",
                            background: GRADE_DOT_COLOR[e.grade],
                            flexShrink: 0, display: "inline-block",
                          }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: "9px", color: "var(--muted-ink)", lineHeight: "6px" }}>
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
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", borderBottom: "1px solid var(--border-faint)",
                background: "var(--ms-surface-2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px" }}>📅</span>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--charcoal)", margin: 0, fontFamily: "var(--font-display)" }}>
                    {currentMonthNum}월 {selectedDay.day}일{" "}
                    <span style={{ fontWeight: 400, color: "var(--muted-ink)", fontSize: "12px" }}>
                      {format(new Date(currentYear, currentMonthNum - 1, selectedDay.day), "EEEE", { locale: ko })}
                    </span>
                  </p>
                </div>
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
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: "24px", margin: "0 0 10px" }}>🗓️</p>
                  <p style={{ fontSize: "13px", color: "var(--muted-ink)", margin: "0 0 14px", lineHeight: 1.6 }}>
                    등록된 민감 이벤트가 없어요.<br />캠페인 검토는 언제든 가능합니다.
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
                        display: "flex",
                        borderBottom: "1px solid var(--border-faint)",
                        background: "#FFF",
                      }}
                    >
                      {/* Left color border — Brandwatch alert card style */}
                      <div style={{ width: "4px", flexShrink: 0, background: GRADE_LEFT_BORDER[e.grade] }} />

                      <div style={{ flex: 1, padding: "12px 14px" }}>
                        {/* Event name + grade badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--charcoal)", fontFamily: "var(--font-display)", lineHeight: 1.3 }}>
                            {e.name}
                          </span>
                          <GradeBadge grade={e.grade} size="xs" showLabel={false} />
                        </div>

                        {/* Category + review link row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "6px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
                            background: "var(--ms-surface-3)", color: "var(--muted-ink)",
                            padding: "2px 8px", borderRadius: "100px",
                          }}>
                            {CATEGORY_LABEL[e.category] ?? e.category}
                          </span>
                          <Link
                            href={`/check?date=${currentYear}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "3px",
                              fontSize: "11px", fontWeight: 700,
                              color: "var(--ms-blue)", textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            검토하기 →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: "var(--ms-blue-light)", border: "1px solid var(--ms-blue-mid)",
              borderRadius: "14px", padding: "24px 20px", textAlign: "center",
            }}>
              <p style={{ fontSize: "24px", margin: "0 0 10px" }}>📅</p>
              <p style={{ fontSize: "13px", color: "var(--ms-blue)", fontWeight: 600, margin: "0 0 4px" }}>
                날짜를 클릭해보세요
              </p>
              <p style={{ fontSize: "12px", color: "var(--ms-text-2)", margin: 0, lineHeight: 1.6 }}>
                해당일의 민감도와 관련 사건을<br />바로 확인할 수 있습니다
              </p>
            </div>
          )}

          {/* Month events list */}
          {monthEvents.length > 0 && (
            <div style={{ background: "#FFF", border: "1px solid var(--border-warm)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-faint)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-ink)", margin: 0 }}>
                  이달의 주요 날짜
                </p>
              </div>
              <div>
                {monthEvents.map((e) => (
                  <button
                    key={e.slug}
                    onClick={() => handleDayClick(e.day)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%", padding: "10px 16px",
                      background: selectedDay?.day === e.day ? "var(--ms-blue-mid)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--border-faint)", cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{
                      fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)",
                      minWidth: "26px", flexShrink: 0,
                    }}>
                      {e.day}일
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: GRADE_DOT_COLOR[e.grade], flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name}
                    </span>
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
