"use client";

import { useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import type { Grade } from "@nunchi/shared";
import { GradeBadge } from "@/components/result-card/GradeBadge";
import { NunchiLogo } from "@/components/NunchiLogo";

interface CalendarEvent {
  month: number;
  day: number;
  name: string;
  grade: Grade;
  slug: string;
  summary: string;
  category: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  { month: 1, day: 1,  name: "신정 (새해)",         grade: "A", slug: "new-year-0101",              summary: "새 출발·희망·목표 설정 캠페인 최적.",              category: "celebration" },
  { month: 2, day: 14, name: "밸런타인데이",          grade: "A", slug: "valentines-day-0214",        summary: "선물·뷰티·식음료 피크 시즌.",                    category: "commercial" },
  { month: 3, day: 1,  name: "삼일절",               grade: "B", slug: "independence-movement-0301", summary: "독립 테마 유리. 일제 소재 회피.",                category: "independence" },
  { month: 3, day: 14, name: "화이트데이",            grade: "A", slug: "white-day-0314",             summary: "사탕·선물 카테고리 2차 피크.",                  category: "commercial" },
  { month: 3, day: 26, name: "천안함 피격",           grade: "D", slug: "cheonan-sinking-0326",       summary: "안보 민감 날짜. 군사 테마 회피.",               category: "disaster" },
  { month: 4, day: 3,  name: "제주 4·3",             grade: "F", slug: "jeju-uprising-0403",          summary: "국가 추모일. 축하·파티 전면 회피.",             category: "memorial" },
  { month: 4, day: 5,  name: "식목일",               grade: "B", slug: "arbor-day-0405",              summary: "친환경·ESG·그린 캠페인 최적.",                 category: "celebration" },
  { month: 4, day: 16, name: "세월호 참사",           grade: "F", slug: "sewol-ferry-0416",            summary: "국가 추모일. 런칭·파티 전면 회피.",             category: "disaster" },
  { month: 4, day: 19, name: "4·19 혁명 기념일",     grade: "C", slug: "april-revolution-0419",       summary: "민주화 기념일. 중립적 접근 권고.",              category: "political" },
  { month: 5, day: 5,  name: "어린이날",             grade: "A", slug: "childrens-day-0505",          summary: "패밀리·키즈 최고 시즌.",                       category: "celebration" },
  { month: 5, day: 8,  name: "어버이날",             grade: "A", slug: "parents-day-0508",            summary: "카네이션·선물·외식 소비 급증.",                category: "celebration" },
  { month: 5, day: 15, name: "스승의 날",            grade: "B", slug: "teachers-day-0515",           summary: "교육·성장 테마 자연스럽게 연결.",               category: "celebration" },
  { month: 5, day: 18, name: "5·18 광주민주화운동",  grade: "F", slug: "gwangju-uprising-0518",        summary: "탱크·군사 모티프 절대 금지.",                  category: "memorial" },
  { month: 5, day: 23, name: "노무현 전 대통령 서거",  grade: "D", slug: "roh-moo-hyun-death-0523",     summary: "좌·우 모두 민감. 축하 캠페인 회피.",            category: "political" },
  { month: 6, day: 6,  name: "현충일",               grade: "F", slug: "memorial-day-0606",           summary: "상업 캠페인 비판 대상. 전면 회피.",             category: "memorial" },
  { month: 6, day: 10, name: "6·10 민주항쟁",        grade: "C", slug: "democracy-movement-0610",     summary: "민주화 기념일. 중립 톤 권장.",                  category: "political" },
  { month: 6, day: 25, name: "6·25 한국전쟁",        grade: "D", slug: "korean-war-0625",              summary: "전쟁·군사 테마 회피.",                         category: "memorial" },
  { month: 7, day: 17, name: "제헌절",               grade: "B", slug: "constitution-day-0717",       summary: "법치·국가 정체성 캠페인 긍정적.",              category: "independence" },
  { month: 8, day: 15, name: "광복절",               grade: "A", slug: "liberation-day-0815",          summary: "독립·해방 테마 최적. K-브랜드 강화 기회.",      category: "independence" },
  { month: 10, day: 3, name: "개천절",               grade: "A", slug: "national-foundation-day-1003", summary: "한민족 정체성·전통 테마 긍정적.",               category: "independence" },
  { month: 10, day: 9, name: "한글날",               grade: "B", slug: "hangul-day-1009",              summary: "K-콘텐츠 브랜드 정체성 강화.",                 category: "celebration" },
  { month: 10, day: 26, name: "10·26 사건",          grade: "D", slug: "park-assassination-1026",      summary: "정치 민감. 날짜 인지 필요.",                  category: "political" },
  { month: 10, day: 29, name: "이태원 참사",          grade: "F", slug: "itaewon-disaster-1029",        summary: "추모일. 핼러윈·파티 전면 회피.",               category: "disaster" },
  { month: 11, day: 11, name: "빼빼로데이",           grade: "A", slug: "pepero-day-1111",              summary: "식품·선물 카테고리 연 최고 피크.",              category: "commercial" },
  { month: 11, day: 23, name: "연평도 포격",          grade: "D", slug: "yeonpyeong-shelling-1123",    summary: "안보 민감. 군사 테마 회피.",                   category: "disaster" },
  { month: 12, day: 12, name: "12·12 군사반란",      grade: "D", slug: "military-coup-1212",           summary: "군사 테마 회피.",                              category: "political" },
  { month: 12, day: 25, name: "크리스마스",           grade: "A", slug: "christmas-1225",               summary: "연말 최대 소비 시즌. 전 카테고리 피크.",         category: "celebration" },
  { month: 12, day: 31, name: "연말 카운트다운",      grade: "A", slug: "new-years-eve-1231",           summary: "새해 맞이·마무리 캠페인 최적.",                category: "commercial" },
];

const GRADE_DOT: Record<Grade, string> = {
  A: "var(--grade-a-border)", B: "var(--grade-b-border)",
  C: "var(--grade-c-border)", D: "var(--grade-d-border)", F: "var(--grade-f-border)",
};

const GRADE_ROW_BG: Record<Grade, string> = {
  A: "var(--grade-a-bg)", B: "var(--grade-b-bg)",
  C: "#ffffff",           D: "var(--grade-d-bg)", F: "var(--grade-f-bg)",
};

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const prevMonth = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const e of SAMPLE_EVENTS) {
    if (e.month === current.getMonth() + 1) {
      if (!eventsByDay[e.day]) eventsByDay[e.day] = [];
      eventsByDay[e.day].push(e);
    }
  }

  const monthEvents = SAMPLE_EVENTS.filter((e) => e.month === current.getMonth() + 1);

  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* NAV */}
      <header style={{ borderBottom: "1px solid var(--border-warm)", background: "rgba(248,247,244,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.04em", color: "var(--ms-text, var(--charcoal))" }}>
            nunchi
          </Link>
          <Link href="/check" style={{ fontSize: "13px", fontWeight: 600, background: "var(--ms-blue, var(--charcoal))", color: "#FFF", padding: "7px 16px", borderRadius: "4px", textDecoration: "none" }}>
            캠페인 검토
          </Link>
        </div>
      </header>

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>

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
    </div>
  );
}
