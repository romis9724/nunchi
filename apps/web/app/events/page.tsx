import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PageHeader, Card } from "@/components/ui";
import { findApprovedEvents } from "@/lib/repositories/events.repo";
import { toneToGrade } from "@noonchi/shared";
import type { EventRecord } from "@noonchi/shared";

export const metadata: Metadata = {
  title: "리스크 라이브러리",
  description: "마케팅 캠페인 검토에 필요한 한국 민감일·호재일 60+. 5·18, 세월호, 이태원, 광복절 등 일자별 위험도·키워드·권장 톤 정리.",
  alternates: { canonical: "https://nunchi-bay.vercel.app/events" },
};

// 빌드타임 정적 프리렌더가 빈 데이터로 고정되지 않도록 런타임 동적 렌더링.
export const dynamic = "force-dynamic";

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const GRADE_BG: Record<string, string> = {
  F: "var(--grade-f-bg)", D: "var(--grade-d-bg)", C: "var(--grade-c-bg)",
  B: "var(--grade-b-bg)", A: "var(--grade-a-bg)",
};
const GRADE_TEXT: Record<string, string> = {
  F: "var(--grade-f-text)", D: "var(--grade-d-text)", C: "var(--grade-c-text)",
  B: "var(--grade-b-text)", A: "var(--grade-a-text)",
};

async function fetchEvents(): Promise<EventRecord[]> {
  try {
    return await findApprovedEvents();
  } catch {
    return [];
  }
}

export default async function EventsIndexPage() {
  const events = await fetchEvents();

  // 월별로 그룹
  const byMonth: Record<number, EventRecord[]> = {};
  for (const e of events) {
    if (!byMonth[e.month]) byMonth[e.month] = [];
    byMonth[e.month].push(e);
  }

  const totalRisk = events.filter((e) => e.risk_level === "critical" || e.risk_level === "high").length;
  const totalGood = events.filter((e) => e.recommended_tone === "celebration").length;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-body)" }}>
      <AppHeader />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <PageHeader
          eyebrow="민감일 라이브러리"
          eyebrowIcon="list"
          title={<>리스크 <span style={{ color: "var(--brand-red)" }}>라이브러리</span></>}
          subtitle={`마케팅 캠페인 검토에 사용되는 큐레이션 ${events.length}건 전체. 월별로 정리되어 있습니다.`}
          metrics={[
            { value: totalRisk, label: "고위험 일자", tone: "red" },
            { value: totalGood, label: "호재 일자", tone: "blue" },
            { value: events.length, label: "전체 등록", tone: "neutral" },
          ]}
        />

        {/* 월별 그룹 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {Object.entries(byMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([month, monthEvents]) => (
              <section key={month}>
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--ms-text)",
                  letterSpacing: "-0.02em",
                  margin: "0 0 14px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                }}>
                  {MONTH_NAMES[Number(month) - 1]}
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ms-text-3)" }}>
                    · {monthEvents.length}건
                  </span>
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                }}>
                  {monthEvents.map((e) => {
                    const grade = toneToGrade(e.recommended_tone, e.risk_level);
                    return (
                      <Link key={e.id ?? e.slug} href={`/events/${e.slug}`} style={{ textDecoration: "none" }}>
                        <Card padding="md" tone="default" style={{
                          display: "flex", flexDirection: "column", gap: "8px",
                          height: "100%",
                          borderLeft: `3px solid ${GRADE_TEXT[grade] ?? "var(--ms-text-3)"}`,
                          transition: "transform 0.15s, border-color 0.15s",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <span style={{
                              fontSize: "12px", fontWeight: 700,
                              color: "var(--ms-text-3)", letterSpacing: "0.02em",
                            }}>
                              {e.month}/{e.day ?? "?"}
                            </span>
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              minWidth: "20px", height: "18px",
                              padding: "0 6px",
                              fontFamily: "var(--font-display)",
                              fontSize: "10px", fontWeight: 800,
                              color: GRADE_TEXT[grade],
                              background: GRADE_BG[grade],
                              border: `1px solid ${GRADE_TEXT[grade]}40`,
                              borderRadius: "4px", lineHeight: 1,
                            }}>
                              {grade}
                            </span>
                          </div>
                          <div style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "15px", fontWeight: 700,
                            color: "var(--ms-text)", letterSpacing: "-0.01em",
                            lineHeight: 1.3,
                          }}>
                            {e.name}
                          </div>
                          <div style={{
                            fontSize: "12px", color: "var(--ms-text-2)",
                            lineHeight: 1.5,
                            overflow: "hidden", textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                          }}>
                            {e.summary}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      </main>
    </div>
  );
}
