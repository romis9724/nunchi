"use client";

import { useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import type { Grade } from "@noonchi/shared";
import { GradeBadge } from "@/components/result-card/GradeBadge";
import { PageHeader } from "@/components/ui";

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

    if (isSelected) return "var(--brand-red-soft)";
    if (isHovered && dayEvents.length > 0) return "var(--ms-surface-3)";
    if (isHovered) return "var(--ms-surface-2)";
    if (isHighlight && topGrade) return GRADE_ROW_BG[topGrade];
    return "transparent";
  }

  // 이달 통계 — 등급별 카운트
  const monthCount = {
    F: monthEvents.filter((e) => e.grade === "F").length,
    D: monthEvents.filter((e) => e.grade === "D").length,
    A: monthEvents.filter((e) => e.grade === "A").length,
  };
  const monthYearLabel = format(current, "yyyy · M월", { locale: ko });

  return (
    <main className="cal-main" style={{ maxWidth: "1240px", margin: "0 auto", padding: "48px 32px 80px" }}>

      <PageHeader
        eyebrow="민감일 캘린더"
        eyebrowIcon="calendar"
        title="리스크 캘린더"
        subtitle={`${monthYearLabel} · 월별 민감일과 호재 타이밍을 한눈에 확인하세요.`}
        metrics={[
          { value: monthCount.F + monthCount.D, label: "주의 일자", tone: "red" },
          { value: monthCount.A, label: "호재 일자", tone: "blue" },
          { value: monthEvents.length, label: "이달 총 이벤트", tone: "neutral" },
        ]}
        actions={
          <div style={{
            display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
            background: "#fff", padding: "8px 14px", borderRadius: "999px",
            border: "1px solid var(--ms-border)",
          }}>
            {LEGEND_ITEMS.map(({ grade, label }) => (
              <div key={grade} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: "10px", height: "10px", borderRadius: "3px",
                    background: GRADE_DOT_COLOR[grade],
                    flexShrink: 0, display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ms-text-2)", letterSpacing: "0.02em" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        }
      />


      {/* Grid layout: calendar + sidebar (스택 on mobile) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }} className="calendar-layout">
        <style>{`
          @media (max-width: 960px) {
            .calendar-layout { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 640px) {
            .cal-main { padding: 24px 16px 56px !important; }
            .cal-header-num { font-size: 22px !important; }
            .cal-day-cell { min-height: 80px !important; padding: 6px !important; }
            .cal-day-num { font-size: 14px !important; }
            .cal-month-nav-btn { width: 32px !important; height: 32px !important; }
          }
        `}</style>

        {/* Calendar — elevated card */}
        <div style={{
          background: "#FFF",
          border: "1px solid var(--ms-border)",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(15, 23, 42, 0.02)",
        }}>

          {/* Month nav — 매거진 톤 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid var(--ms-border)",
            background: "linear-gradient(180deg, #FFFFFF 0%, var(--ms-surface) 100%)",
            gap: "10px",
          }}>
            <button
              onClick={prevMonth}
              aria-label="이전 달"
              className="cal-month-nav-btn"
              style={{ background: "#fff", border: "1px solid var(--ms-border)", borderRadius: "10px", width: "36px", height: "36px", cursor: "pointer", fontSize: "15px", color: "var(--charcoal)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.12s" }}
            >
              ←
            </button>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              <h2 className="cal-header-num" style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "26px",
                letterSpacing: "-0.035em",
                color: "var(--charcoal)",
                margin: 0,
                lineHeight: 1,
              }}>
                {format(current, "yyyy", { locale: ko })}
                <span style={{ color: "var(--brand-red)", margin: "0 6px" }}>·</span>
                {format(current, "M월", { locale: ko })}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  aria-label="오늘로 이동"
                  style={{
                    background: "var(--brand-red-soft)", border: "1px solid var(--brand-red-mid)",
                    borderRadius: "999px", padding: "4px 12px", cursor: "pointer",
                    fontSize: "11.5px", fontWeight: 700, color: "var(--brand-red)",
                    fontFamily: "var(--font-body)", letterSpacing: "0.02em",
                  }}
                >
                  오늘로
                </button>
              )}
            </div>

            <button
              onClick={nextMonth}
              aria-label="다음 달"
              className="cal-month-nav-btn"
              style={{ background: "#fff", border: "1px solid var(--ms-border)", borderRadius: "10px", width: "36px", height: "36px", cursor: "pointer", fontSize: "15px", color: "var(--charcoal)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.12s" }}
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-faint)", background: "var(--ms-surface)" }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div
                key={d}
                style={{
                  padding: "12px 0", textAlign: "center",
                  fontSize: "11.5px", fontWeight: 800,
                  color: i === 0 ? "var(--brand-red)" : "var(--ms-text-2)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-display)",
                }}
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

              const topGrade = dayEvents[0]?.grade;
              const leftStripColor = topGrade ? GRADE_LEFT_BORDER[topGrade] : "transparent";

              return (
                <button
                  key={d}
                  onClick={() => handleDayClick(d)}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  aria-pressed={isSelected}
                  aria-label={`${currentMonthNum}월 ${d}일${dayEvents.length ? ` — 이벤트 ${dayEvents.length}건` : ""}`}
                  className="cal-day-cell"
                  style={{
                    minHeight: "110px",
                    padding: "10px 10px 8px",
                    textAlign: "left",
                    background: getDayCellBackground(d, day),
                    cursor: "pointer",
                    borderTop: "none",
                    borderLeft: dayEvents.length > 0 ? `3px solid ${leftStripColor}` : "3px solid transparent",
                    borderRight: "1px solid var(--border-faint)",
                    borderBottom: "1px solid var(--border-faint)",
                    outline: isSelected ? "2px solid var(--brand-red)" : "none",
                    outlineOffset: "-2px",
                    transition: "background 0.15s, transform 0.15s",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    boxShadow: isSelected ? "inset 0 0 0 1px var(--brand-red-mid)" : "none",
                    minWidth: 0,
                  } as React.CSSProperties}
                >
                  {/* Date number + today badge row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="cal-day-num" style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      color: todayCell ? "#FFF" : "var(--charcoal)",
                      background: todayCell ? "var(--brand-red)" : "transparent",
                      padding: todayCell ? "4px 8px" : "0",
                      borderRadius: todayCell ? "6px" : "0",
                    }}>
                      {d}
                    </span>
                    {dayEvents.length > 1 && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ms-text-3)",
                        background: "var(--ms-surface-2)",
                        padding: "2px 5px",
                        borderRadius: "4px",
                        letterSpacing: "0.02em",
                      }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event chips — 등급별 컬러 chip */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.slug}
                          title={e.name}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "20px",
                            height: "18px",
                            padding: "0 6px",
                            fontFamily: "var(--font-display)",
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "0.02em",
                            color: GRADE_DOT_COLOR[e.grade],
                            background: GRADE_ROW_BG[e.grade],
                            border: `1px solid ${GRADE_DOT_COLOR[e.grade]}40`,
                            borderRadius: "4px",
                            lineHeight: 1,
                          }}
                        >
                          {e.grade}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "var(--ms-text-2)",
                          lineHeight: "18px",
                        }}>
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* First event name preview (truncated) */}
                  {dayEvents.length > 0 && (
                    <span style={{
                      fontSize: "11px",
                      color: "var(--ms-text-2)",
                      lineHeight: 1.35,
                      marginTop: "auto",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      fontWeight: 500,
                    }}>
                      {dayEvents[0].name}
                    </span>
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
                      color: "var(--brand-red)", textDecoration: "none",
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

                        {/* Category + 라이브러리 / 검토 액션 row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
                            background: "var(--ms-surface-3)", color: "var(--muted-ink)",
                            padding: "2px 8px", borderRadius: "100px",
                          }}>
                            {CATEGORY_LABEL[e.category] ?? e.category}
                          </span>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <Link
                              href={`/events/${e.slug}`}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "3px",
                                fontSize: "12px", fontWeight: 600,
                                color: "var(--ms-text-2)", textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              상세 →
                            </Link>
                            <Link
                              href={`/check?date=${currentYear}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "3px",
                                fontSize: "12px", fontWeight: 700,
                                color: "var(--brand-red)", textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              검토하기 →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(180deg, var(--brand-red-soft) 0%, #fff 100%)",
              border: "1px solid var(--brand-red-mid)",
              borderRadius: "14px", padding: "28px 22px", textAlign: "center",
              boxShadow: "0 8px 24px rgba(225, 29, 72, 0.06)",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: "#fff", border: "1px solid var(--brand-red-mid)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.08)",
              }}>
                <span style={{ fontSize: "22px" }}>📅</span>
              </div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px", color: "var(--brand-red)", fontWeight: 800,
                margin: "0 0 6px", letterSpacing: "-0.01em",
              }}>
                날짜를 클릭해보세요
              </p>
              <p style={{ fontSize: "12.5px", color: "var(--ms-text-2)", margin: 0, lineHeight: 1.6 }}>
                해당일의 민감도와 관련 사건을<br />바로 확인할 수 있습니다
              </p>
            </div>
          )}

          {/* Month events list — 등급 컬러 좌측 보더 */}
          {monthEvents.length > 0 && (
            <div style={{ background: "#FFF", border: "1px solid var(--ms-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ms-text-2)", margin: 0 }}>
                  이달의 주요 날짜
                </p>
                <span style={{ fontSize: "11px", color: "var(--ms-text-3)", fontWeight: 600 }}>
                  {monthEvents.length}건
                </span>
              </div>
              <div>
                {monthEvents.map((e) => (
                  <div
                    key={e.slug}
                    style={{
                      display: "flex", alignItems: "stretch",
                      background: selectedDay?.day === e.day ? "var(--brand-red-soft)" : "#fff",
                      borderLeft: `3px solid ${GRADE_DOT_COLOR[e.grade]}`,
                      borderBottom: "1px solid var(--border-faint)",
                      transition: "background 0.12s",
                    }}
                  >
                    <button
                      onClick={() => handleDayClick(e.day)}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        flex: 1, minWidth: 0,
                        padding: "12px 14px",
                        background: "transparent", border: "none",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "13px", fontWeight: 800, color: "var(--charcoal)",
                        minWidth: "30px", flexShrink: 0, letterSpacing: "-0.01em",
                      }}>
                        {e.day}일
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          minWidth: "20px", height: "18px",
                          padding: "0 6px",
                          fontFamily: "var(--font-display)",
                          fontSize: "10px", fontWeight: 800,
                          color: GRADE_DOT_COLOR[e.grade],
                          background: GRADE_ROW_BG[e.grade],
                          border: `1px solid ${GRADE_DOT_COLOR[e.grade]}40`,
                          borderRadius: "4px", lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        {e.grade}
                      </span>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.name}
                      </span>
                    </button>
                    <Link
                      href={`/events/${e.slug}`}
                      aria-label={`${e.name} 라이브러리 상세 보기`}
                      title="라이브러리에서 상세 보기"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 12px",
                        color: "var(--ms-text-3)",
                        textDecoration: "none",
                        fontSize: "16px", fontWeight: 700,
                        borderLeft: "1px solid var(--border-faint)",
                        flexShrink: 0,
                        transition: "background 0.12s, color 0.12s",
                      }}
                      onMouseOver={(ev) => {
                        ev.currentTarget.style.color = "var(--brand-red)";
                        ev.currentTarget.style.background = "var(--brand-red-soft)";
                      }}
                      onMouseOut={(ev) => {
                        ev.currentTarget.style.color = "var(--ms-text-3)";
                        ev.currentTarget.style.background = "transparent";
                      }}
                    >
                      →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick check CTA — brand red */}
          <Link
            href="/check"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "14px", borderRadius: "12px",
              background: "var(--brand-red)", color: "#FFF",
              fontSize: "14px", fontWeight: 700, textDecoration: "none",
              fontFamily: "var(--font-body)", letterSpacing: "-0.005em",
              boxShadow: "0 6px 16px rgba(225, 29, 72, 0.22), 0 0 0 1px var(--brand-red-dark)",
              transition: "transform 0.15s",
            }}
          >
            지금 검토 시작하기 <span style={{ fontSize: "16px" }}>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
