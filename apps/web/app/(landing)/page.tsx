"use client";

import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";
import { SiteFooter } from "../../components/SiteFooter";

/* ─────────────────────────────────────────────────────────────
   Noonchi Landing — Editorial SaaS
   - 2-column hero: 좌측 카피 + 우측 라이브 데모 카드 스택
   - 빨강 액센트 / 한국어 keep-all 줄바꿈
   - 사례는 다양 (이태원·세월호·광복절·빼빼로데이)
─────────────────────────────────────────────────────────────── */

const RED = "var(--brand-red)";
const RED_DARK = "var(--brand-red-dark)";
const RED_SOFT = "var(--brand-red-soft)";
const RED_MID = "var(--brand-red-mid)";

const TEXT = "var(--ms-text)";
const MUTED = "var(--ms-text-2)";
const FAINT = "var(--ms-text-3)";
const BG = "#FFFFFF";
const BG_SOFT = "var(--ms-surface)";
const BORDER = "var(--ms-border)";

/* ── Content ─────────────────────────────────────────────────── */

const STATS = [
  { n: "60+", label: "큐레이션 리스크 이벤트" },
  { n: "5초", label: "캠페인 검토 소요 시간" },
  { n: "F→A", label: "5단계 등급 자동 분류" },
  { n: "0원", label: "베타 기간 무료" },
];

const BEFORE_AFTER = [
  { before: "기념일·추모일 맥락을 일일이 검색", after: "민감 일자 자동 매칭" },
  { before: "출시 후 사고가 터지면 사후 수습", after: "출시 전에 미리 검증" },
  { before: "법무·홍보·임원 다단계 회의", after: "마케터 한 명이 5초 안에 1차 검토" },
  { before: "대안이 떠오르지 않아 막연한 불안", after: "안전 카피·적합 일자 자동 제안" },
];

const FEATURES = [
  {
    badge: "01",
    title: "한국 사건 60+ DB",
    body: "독립운동·민주화운동·대형 참사·국가 기념일 등 검증된 일자를 큐레이션. 각 사건의 키워드·시각 모티프·권장 톤까지 정리되어 있습니다.",
    metric: "60+",
    metricLabel: "등록 이벤트",
  },
  {
    badge: "02",
    title: "맥락 교차 검토 AI",
    body: "단순 단어 매칭이 아닙니다. 날짜 + 캠페인명 + 카피 + 시각 키워드를 함께 분석해 ‘왜 위험한지’를 사건 맥락과 함께 설명합니다.",
    metric: "5초",
    metricLabel: "응답 시간",
  },
  {
    badge: "03",
    title: "대안 자동 제안",
    body: "F등급 위험 시 안전한 카피 대안, 가까운 적합 일자, 호재 활용 포인트까지 함께 제시. 단순 ‘위험’ 경고에 그치지 않습니다.",
    metric: "F→A",
    metricLabel: "5단계 등급",
  },
];

const GRADES = [
  { g: "F", label: "즉각 회피", sub: "역사적 비극과 직접 충돌", ex: "세월호·이태원·6·25" },
  { g: "D", label: "재검토 권고", sub: "민감 요소 감지", ex: "현충일·1·22 전후" },
  { g: "C", label: "일반 주의", sub: "특별한 위험·호재 없음", ex: "대부분의 평일" },
  { g: "B", label: "안전", sub: "민감 요소 없음", ex: "제헌절·식목일" },
  { g: "A", label: "최적 타이밍", sub: "강한 긍정 연관", ex: "광복절·빼빼로데이" },
];

/* 다양화된 데모 시나리오 — 탱크/5·18 의존 제거 */
const DEMOS = [
  {
    href: "/check?date=2027-04-16&copy=봄 항해 컬렉션 출항 파티",
    g: "F",
    date: "4월 16일",
    concept: "봄 항해 컬렉션 출항 파티",
    verdict: "F등급 · 즉각 회피",
    reason: "세월호 참사 추모일과 직접 충돌",
  },
  {
    href: "/check?date=2027-10-29&copy=할로윈 클럽 한정 굿즈",
    g: "D",
    date: "10월 29일",
    concept: "할로윈 클럽 한정 굿즈",
    verdict: "D등급 · 재검토 권고",
    reason: "이태원 참사 추모 분위기",
  },
  {
    href: "/check?date=2027-08-15&copy=광복절 독립 한정 에디션",
    g: "A",
    date: "8월 15일",
    concept: "광복절 독립 한정 에디션",
    verdict: "A등급 · 최적 타이밍",
    reason: "광복절 호재 매칭",
  },
];

/* Hero 우측 시각자료 — 라이브 데모 카드 스택 */
const HERO_CARDS = [
  {
    g: "F",
    date: "4월 16일 · 화요일",
    concept: "봄 항해 컬렉션 ‘출항’ 런칭",
    verdict: "세월호 참사 추모일",
    note: "‘출항’·‘배’·‘봄 바다’ 키워드 감지",
  },
  {
    g: "D",
    date: "10월 29일 · 금요일",
    concept: "할로윈 클럽 한정 굿즈",
    verdict: "이태원 참사 추모일",
    note: "축제·인파 키워드 주의",
  },
  {
    g: "A",
    date: "11월 11일 · 수요일",
    concept: "빼빼로 1+1 한정 패키지",
    verdict: "빼빼로데이 · 매출 호재",
    note: "트렌드 동참 권장",
  },
];

const GRADE_BG: Record<string, string> = {
  F: "var(--grade-f-bg)", D: "var(--grade-d-bg)", C: "var(--grade-c-bg)",
  B: "var(--grade-b-bg)", A: "var(--grade-a-bg)",
};
const GRADE_TEXT: Record<string, string> = {
  F: "var(--grade-f-text)", D: "var(--grade-d-text)", C: "var(--grade-c-text)",
  B: "var(--grade-b-text)", A: "var(--grade-a-text)",
};
const GRADE_BORDER: Record<string, string> = {
  F: "var(--grade-f-border)", D: "var(--grade-d-border)", C: "var(--grade-c-border)",
  B: "var(--grade-b-border)", A: "var(--grade-a-border)",
};

/* ── Atoms ───────────────────────────────────────────────────── */
function GradeBadge({ g, size = 36 }: { g: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size,
        fontWeight: 900, fontSize: size * 0.5,
        color: GRADE_TEXT[g] ?? GRADE_TEXT.C,
        background: GRADE_BG[g] ?? GRADE_BG.C,
        borderRadius: "8px",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.02em", lineHeight: 1,
      }}
    >{g}</span>
  );
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: dark ? "#fff" : RED,
        background: dark ? "rgba(255,255,255,0.12)" : RED_SOFT,
        border: dark ? "1px solid rgba(255,255,255,0.24)" : `1px solid ${RED_MID}`,
        padding: "6px 14px",
        borderRadius: "999px",
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: dark ? "#fff" : RED,
      }} />
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "8px",
      fontSize: "13px", fontWeight: 800, letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: RED,
      background: RED_SOFT,
      border: `1px solid ${RED_MID}`,
      padding: "6px 14px",
      borderRadius: "999px",
      marginBottom: "20px",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED }} />
      {children}
    </div>
  );
}

/* Hero 우측 데모 카드 (스택) */
function HeroDemoCard({
  g, date, concept, verdict, note, offset = 0, rotate = 0,
}: {
  g: string; date: string; concept: string; verdict: string; note: string;
  offset?: number; rotate?: number;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${GRADE_BORDER[g] ?? BORDER}`,
        borderLeft: `4px solid ${GRADE_TEXT[g] ?? TEXT}`,
        borderRadius: "12px",
        padding: "18px 20px",
        boxShadow: "0 20px 48px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)",
        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <GradeBadge g={g} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "11px", fontWeight: 600,
            color: FAINT, letterSpacing: "0.04em",
            marginBottom: "4px",
          }}>{date}</div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px", fontWeight: 700,
            color: TEXT, lineHeight: 1.35,
            marginBottom: "6px",
            letterSpacing: "-0.01em",
          }}>{concept}</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "11.5px", fontWeight: 600,
            color: GRADE_TEXT[g] ?? TEXT,
            background: GRADE_BG[g] ?? BG_SOFT,
            padding: "3px 10px", borderRadius: "999px",
            marginBottom: "8px",
          }}>{verdict}</div>
          <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.5 }}>{note}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "var(--font-body)", color: TEXT }}>
      <AppHeader />

      {/* ════════════════════════════════════════════════════════
          1. HERO — 2-column (좌: 카피, 우: 라이브 데모 카드)
      ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 50%, ${RED_SOFT} 100%)`,
          padding: "clamp(56px, 8vw, 96px) 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden style={{
          position: "absolute", top: "-220px", right: "-160px",
          width: "560px", height: "560px",
          background: `radial-gradient(circle, ${RED}1f 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div
          style={{
            maxWidth: "1240px", margin: "0 auto", position: "relative",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
            gap: "clamp(32px, 5vw, 80px)",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* ── 좌측 카피 ───────────────────────────────────── */}
          <div>
            <Eyebrow>브랜드 안전 · 날짜 리스크 분석</Eyebrow>

            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.25rem, 4.6vw, 4rem)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 1.05,
              color: TEXT,
              margin: "24px 0 20px",
            }}>
              광고 사고는 <span style={{ color: RED }}>출시 전</span>에<br />
              막아야 합니다.
            </h1>

            <p style={{
              fontSize: "clamp(0.95rem, 1.4vw, 1.125rem)",
              lineHeight: 1.65,
              color: MUTED,
              margin: "0 0 32px",
              maxWidth: "520px",
            }}>
              마케팅 캠페인의 <strong style={{ color: TEXT }}>날짜 × 카피</strong>가
              한국 역사·사회 맥락과 충돌하는지 AI가 즉시 분석합니다.
              F부터 A까지 5단계 등급으로 한눈에.
            </p>

            <div style={{
              display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px",
            }}>
              <Link href="/check" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: RED, color: "#fff",
                fontWeight: 700, fontSize: "15px",
                padding: "14px 24px", borderRadius: "10px",
                textDecoration: "none",
                boxShadow: `0 12px 28px ${RED}40, 0 0 0 1px ${RED_DARK}`,
              }}>
                지금 무료로 검토하기 <span style={{ fontSize: "17px" }}>→</span>
              </Link>
              <Link href="/calendar" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#fff", color: TEXT,
                fontWeight: 600, fontSize: "15px",
                padding: "14px 22px", borderRadius: "10px",
                textDecoration: "none",
                border: `1.5px solid ${BORDER}`,
              }}>
                리스크 캘린더 보기
              </Link>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: "16px",
              fontSize: "12.5px", color: FAINT, flexWrap: "wrap",
            }}>
              <span>✓ 회원가입 불필요</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: FAINT }} />
              <span>✓ 한국 사건 60+ 큐레이션</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: FAINT }} />
              <span>✓ 5초 안에 결과</span>
            </div>
          </div>

          {/* ── 우측 데모 카드 스택 ─────────────────────────── */}
          <div style={{ position: "relative", minHeight: "440px" }}>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              gap: "16px", justifyContent: "center",
              maxWidth: "440px", margin: "0 auto",
            }}>
              <div style={{ marginLeft: "0px" }}>
                <HeroDemoCard {...HERO_CARDS[0]} offset={-8} rotate={-1.2} />
              </div>
              <div style={{ marginLeft: "32px" }}>
                <HeroDemoCard {...HERO_CARDS[1]} offset={4} rotate={0.6} />
              </div>
              <div style={{ marginLeft: "8px" }}>
                <HeroDemoCard {...HERO_CARDS[2]} offset={-2} rotate={-0.4} />
              </div>
            </div>
          </div>
        </div>

        {/* 반응형 스타일 — 작은 화면에서 1-column */}
        <style>{`
          @media (max-width: 880px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-grid > div:last-child { min-height: 360px; }
          }
        `}</style>
      </section>

      {/* ════════════════════════════════════════════════════════
          2. STATS
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "48px 24px", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "24px",
        }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                fontWeight: 900, color: RED,
                letterSpacing: "-0.03em", lineHeight: 1,
                marginBottom: "8px",
              }}>{s.n}</div>
              <div style={{ fontSize: "13px", color: MUTED, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          3. BEFORE / AFTER
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: BG_SOFT, padding: "clamp(64px, 10vw, 112px) 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            gap: "48px", alignItems: "start",
          }} className="ba-grid">
            <div>
              <SectionLabel>왜 필요한가</SectionLabel>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                fontWeight: 900, letterSpacing: "-0.03em",
                color: TEXT, margin: "0 0 16px",
                lineHeight: 1.15,
              }}>
                마케터가 놓치기 쉬운<br />
                <span style={{ color: RED }}>날짜 리스크</span>
              </h2>
              <p style={{ fontSize: "15px", color: MUTED, margin: 0, lineHeight: 1.65 }}>
                특정 날짜에 어떤 사건이 있었는지, 어떤 표현이 어떤 사건을 연상시키는지
                — 마케터 한 명이 다 알 수 없습니다. Noonchi가 대신합니다.
              </p>
            </div>

            <div style={{
              background: "#fff", borderRadius: "16px",
              border: `1px solid ${BORDER}`, overflow: "hidden",
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                background: RED_SOFT, borderBottom: `1px solid ${BORDER}`,
              }}>
                <div style={{
                  padding: "14px 20px", fontSize: "11px", fontWeight: 800,
                  letterSpacing: "0.12em", color: RED, textTransform: "uppercase",
                  borderRight: `1px solid ${RED_MID}`,
                }}>Before</div>
                <div style={{
                  padding: "14px 20px", fontSize: "11px", fontWeight: 800,
                  letterSpacing: "0.12em", color: "var(--grade-b-text)",
                  textTransform: "uppercase", background: "var(--grade-b-bg)",
                }}>After Noonchi</div>
              </div>
              {BEFORE_AFTER.map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  borderBottom: i === BEFORE_AFTER.length - 1 ? "none" : `1px solid ${BORDER}`,
                }}>
                  <div style={{
                    padding: "16px 20px", fontSize: "14px", color: MUTED,
                    borderRight: `1px solid ${BORDER}`,
                    display: "flex", gap: "8px", alignItems: "flex-start",
                  }}>
                    <span style={{ color: RED, fontWeight: 700, marginTop: "1px" }}>✗</span>
                    <span>{row.before}</span>
                  </div>
                  <div style={{
                    padding: "16px 20px", fontSize: "14px", color: TEXT, fontWeight: 600,
                    display: "flex", gap: "8px", alignItems: "flex-start",
                  }}>
                    <span style={{ color: "var(--grade-b-text)", fontWeight: 700, marginTop: "1px" }}>✓</span>
                    <span>{row.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 880px) { .ba-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* ════════════════════════════════════════════════════════
          4. FEATURES
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "clamp(64px, 10vw, 112px) 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>핵심 기능</SectionLabel>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 3.25rem)",
            fontWeight: 900, letterSpacing: "-0.03em",
            color: TEXT, margin: "0 0 48px",
            maxWidth: "640px", lineHeight: 1.15,
          }}>
            단어 검색이 아닙니다.
            <br />
            <span style={{ color: RED }}>맥락</span>을 이해합니다.
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {FEATURES.map((f) => (
              <article key={f.badge} style={{
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: "16px", padding: "28px",
                display: "flex", flexDirection: "column", gap: "16px",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44,
                  background: RED_SOFT, color: RED,
                  fontFamily: "var(--font-display)",
                  fontWeight: 900, fontSize: "16px",
                  borderRadius: "10px", border: `1px solid ${RED_MID}`,
                }}>{f.badge}</div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "19px", fontWeight: 800, color: TEXT,
                  margin: 0, letterSpacing: "-0.02em",
                }}>{f.title}</h3>
                <p style={{
                  fontSize: "14px", color: MUTED,
                  lineHeight: 1.7, margin: 0, flex: 1,
                }}>{f.body}</p>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: "8px",
                  paddingTop: "16px", borderTop: `1px solid ${BORDER}`,
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "24px", fontWeight: 900, color: RED,
                    letterSpacing: "-0.02em",
                  }}>{f.metric}</span>
                  <span style={{ fontSize: "12px", color: FAINT, fontWeight: 500 }}>{f.metricLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          5. GRADE LADDER
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: BG_SOFT, padding: "clamp(64px, 10vw, 112px) 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>5단계 등급</SectionLabel>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 3.25rem)",
            fontWeight: 900, letterSpacing: "-0.03em",
            color: TEXT, margin: "0 0 14px",
            maxWidth: "640px", lineHeight: 1.15,
          }}>
            위험과 호재를<br />동시에 봅니다.
          </h2>
          <p style={{
            fontSize: "15px", color: MUTED,
            margin: "0 0 48px", maxWidth: "520px",
          }}>
            단순 차단이 아닙니다. F등급으로 위험을 막고 A등급으로 호재 타이밍까지 알려드립니다.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}>
            {GRADES.map((grade) => (
              <div key={grade.g} style={{
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: "14px", padding: "22px 20px",
                display: "flex", flexDirection: "column", gap: "14px",
              }}>
                <GradeBadge g={grade.g} size={42} />
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "16px", fontWeight: 800,
                    color: TEXT, marginBottom: "4px",
                  }}>{grade.label}</div>
                  <div style={{ fontSize: "13px", color: MUTED, lineHeight: 1.5 }}>{grade.sub}</div>
                </div>
                <div style={{
                  fontSize: "11px", color: FAINT,
                  paddingTop: "12px", borderTop: `1px solid ${BORDER}`,
                }}>예: {grade.ex}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          6. LIVE DEMOS
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "clamp(64px, 10vw, 112px) 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>지금 직접 확인하기</SectionLabel>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 3.25rem)",
            fontWeight: 900, letterSpacing: "-0.03em",
            color: TEXT, margin: "0 0 12px",
            maxWidth: "720px", lineHeight: 1.15,
          }}>
            3가지 시나리오로 체험해보세요.
          </h2>
          <p style={{ fontSize: "15px", color: MUTED, margin: "0 0 48px" }}>
            클릭 한 번으로 실제 검토 결과까지 확인할 수 있습니다.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {DEMOS.map((demo) => (
              <Link key={demo.href} href={demo.href} style={{
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: "14px", padding: "24px",
                textDecoration: "none", color: TEXT,
                display: "flex", flexDirection: "column", gap: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <GradeBadge g={demo.g} size={40} />
                  <span style={{ fontSize: "12px", color: FAINT, fontWeight: 600 }}>{demo.date}</span>
                </div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "16px", fontWeight: 700, color: TEXT,
                    marginBottom: "6px", letterSpacing: "-0.01em",
                  }}>{demo.concept}</div>
                  <div style={{ fontSize: "13px", color: MUTED, marginBottom: "4px" }}>{demo.verdict}</div>
                  <div style={{ fontSize: "12px", color: FAINT }}>{demo.reason}</div>
                </div>
                <div style={{
                  fontSize: "13px", fontWeight: 600, color: RED,
                  paddingTop: "12px", borderTop: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  검토 결과 보기 <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          7. FAQ
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: BG_SOFT, padding: "clamp(64px, 10vw, 112px) 24px" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <SectionLabel>자주 묻는 질문</SectionLabel>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 3.25rem)",
            fontWeight: 900, letterSpacing: "-0.03em",
            color: TEXT, margin: "0 0 40px",
            lineHeight: 1.15,
          }}>
            궁금하실 만한 것들
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                q: "AI 분석은 얼마나 정확한가요?",
                a: "큐레이션된 60+ 한국 사건 DB와 Gemini LLM을 결합해 사건의 맥락·키워드·시각 모티프를 동시 분석합니다. 다만 결과는 참고용이며, 최종 캠페인 결정은 마케터 본인의 판단과 법무·홍보 팀 검토를 병행하시기 바랍니다.",
              },
              {
                q: "어떤 사건들을 포함하나요?",
                a: "국가 추모일(5·18, 4·16, 6·25, 10·29 등), 국가 기념일(광복절, 한글날, 어린이날 등), 정치·사회 사건, 상업 이벤트(빼빼로데이, 발렌타인 등)까지 5가지 카테고리로 분류된 한국 컨텍스트 사건을 우선 큐레이션합니다.",
              },
              {
                q: "내 캠페인 데이터가 학습에 사용되나요?",
                a: "아니요. 검토 요청은 익명화되어 캐싱 목적으로만 저장되며, 외부 LLM 학습에는 일절 사용되지 않습니다. 회사명·브랜드명·제품명은 검토 결과 맞춤화에만 사용되고 외부로 전송되지 않습니다.",
              },
              {
                q: "F등급이 나오면 무조건 안 해야 하나요?",
                a: "F등급은 '즉각 회피 권고'이지만 절대 금지는 아닙니다. 노출되는 메시지의 톤·시각 모티프를 추모·중립으로 조정하거나 일자를 옮기는 등 대안이 함께 제시됩니다. 최종 판단은 브랜드 정체성과 캠페인 목적에 맞춰 결정하시면 됩니다.",
              },
              {
                q: "유료 플랜이 있나요?",
                a: "현재는 베타 기간으로 모든 기능 무료입니다. 정식 출시 시 검토 횟수 기반 구독제(개인·팀·기업) 도입을 검토 중이며, 베타 사용자에게는 혜택을 제공할 예정입니다.",
              },
              {
                q: "글로벌 캠페인도 지원하나요?",
                a: "현재는 한국 컨텍스트에 집중하고 있습니다. 한국 마케터·대행사가 한국 시장에 출시하는 캠페인 검토를 우선 지원하며, 글로벌 확장은 PMF 확인 후 일본·미국·동남아 순으로 검토할 예정입니다.",
              },
            ].map((item, i) => (
              <details
                key={i}
                style={{
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "14px",
                  padding: "0",
                  overflow: "hidden",
                }}
              >
                <summary style={{
                  cursor: "pointer",
                  padding: "20px 24px",
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: TEXT,
                  letterSpacing: "-0.01em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  listStyle: "none",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "26px", height: "26px",
                      background: RED_SOFT, color: RED,
                      fontFamily: "var(--font-display)",
                      fontSize: "12px", fontWeight: 800,
                      borderRadius: "6px",
                      border: `1px solid ${RED_MID}`,
                      flexShrink: 0,
                    }}>Q</span>
                    {item.q}
                  </span>
                  <span style={{
                    color: RED, fontSize: "20px", fontWeight: 700,
                    flexShrink: 0, transition: "transform 0.2s",
                  }}>+</span>
                </summary>
                <div style={{
                  padding: "0 24px 22px 62px",
                  fontSize: "14px",
                  color: MUTED,
                  lineHeight: 1.75,
                }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          8. FINAL CTA
      ════════════════════════════════════════════════════════ */}
      <section style={{
        background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
        padding: "clamp(64px, 10vw, 112px) 24px",
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", top: "-100px", left: "-100px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
        }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", textAlign: "center" }}>
          <Eyebrow dark>지금 시작</Eyebrow>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.875rem, 4vw, 3rem)",
            fontWeight: 900, letterSpacing: "-0.04em",
            lineHeight: 1.1, margin: "20px 0 18px", color: "#fff",
          }}>
            다음 캠페인이<br />사고가 되기 전에.
          </h2>
          <p style={{
            fontSize: "clamp(0.95rem, 1.4vw, 1.075rem)",
            color: "rgba(255,255,255,0.86)",
            margin: "0 auto 32px", maxWidth: "480px", lineHeight: 1.65,
          }}>
            지금 베타 무료. 회원가입 없이 첫 검토를 시작하세요.
          </p>
          <Link href="/check" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "#fff", color: RED,
            fontWeight: 800, fontSize: "16px",
            padding: "16px 32px", borderRadius: "10px",
            textDecoration: "none",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          }}>
            무료로 검토 시작하기 <span style={{ fontSize: "18px" }}>→</span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          8. FOOTER (공용 컴포넌트)
      ════════════════════════════════════════════════════════ */}
      <SiteFooter variant="default" />
    </div>
  );
}
