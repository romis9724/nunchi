"use client";

import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";

/* ─────────────────────────────────────────────────────────────
   Nunchi Landing — AdCreative.ai-inspired layout
   - 밝은 배경 + 빨강(브랜드) 액센트
   - 좌측 정렬 hero · 굵은 헤드라인 · 구체적 숫자
   - 실제 사고 사례를 hero 직후 사회적 증거로 노출
─────────────────────────────────────────────────────────────── */

/* ── Design constants ────────────────────────────────────────── */
const RED = "var(--brand-red)";
const RED_DARK = "var(--brand-red-dark)";
const RED_SOFT = "var(--brand-red-soft)";
const RED_MID = "var(--brand-red-mid)";
const RED_TEXT = "var(--brand-red-text)";

const TEXT = "var(--ms-text)";
const MUTED = "var(--ms-text-2)";
const FAINT = "var(--ms-text-3)";
const BG = "#FFFFFF";
const BG_SOFT = "var(--ms-surface)";
const BORDER = "var(--ms-border)";

/* ── Content ─────────────────────────────────────────────────── */
const TRUST_LOGOS = ["스타벅스", "펩시", "H&M", "D&G", "네이버", "카카오"];

const STATS = [
  { n: "60+", label: "큐레이션 리스크 이벤트" },
  { n: "5초", label: "캠페인 검토 소요 시간" },
  { n: "F→A", label: "5단계 등급 자동 분류" },
  { n: "0원", label: "베타 기간 무료" },
];

const BEFORE_AFTER = [
  { before: "추모일·기념일 맥락 모름", after: "F등급 즉시 경고", icon: "📅" },
  { before: "출시 후 사후 대응", after: "출시 전 사전 검토", icon: "⚡" },
  { before: "브랜드 위기·임원 해임", after: "대안 카피 자동 제안", icon: "🛡️" },
  { before: "팀 전체 긴급 대응 비용", after: "5초 안에 1인 검토", icon: "⏱️" },
];

const FEATURES = [
  {
    badge: "01",
    title: "한국 역사 60+ 사건 DB",
    body: "5·18, 4·16, 6·25, 이태원 등 검증된 민감일을 캘린더 형태로 정리. 각 사건의 키워드·시각 모티프·권장 톤까지 한눈에.",
    metric: "60+",
    metricLabel: "등록 이벤트",
  },
  {
    badge: "02",
    title: "AI 맥락 교차 검토",
    body: "날짜 + 캠페인명 + 카피 + 시각 키워드를 동시에 분석. 단순 단어 매칭이 아닌 사건 맥락과 의미를 이해합니다.",
    metric: "5초",
    metricLabel: "분석 시간",
  },
  {
    badge: "03",
    title: "대안 카피 자동 제안",
    body: "F등급 위험 발견 시 안전한 대안 표현, 다른 적합 일자, 호재 활용 포인트까지 함께 제시. 단순 경고에 그치지 않습니다.",
    metric: "F→A",
    metricLabel: "5단계 등급",
  },
];

const GRADES = [
  { g: "F", label: "즉각 회피", sub: "역사적 비극과 직접 충돌", ex: "5·18, 세월호, 이태원" },
  { g: "D", label: "재검토 필요", sub: "민감 요소 감지", ex: "6·25, 현충일 전후" },
  { g: "C", label: "일반 주의", sub: "특별한 위험·호재 없음", ex: "대부분의 평일" },
  { g: "B", label: "안전", sub: "민감 요소 없음", ex: "제헌절, 식목일" },
  { g: "A", label: "최적 타이밍", sub: "강한 긍정 연관", ex: "광복절, 빼빼로데이" },
];

const DEMOS = [
  {
    href: "/check?date=2027-05-18&copy=탱크 시리즈 신상 출시",
    g: "F",
    date: "5월 18일",
    concept: "탱크 시리즈 신상 출시",
    verdict: "F등급 — 즉각 위험",
    reason: "광주민주화운동 기념일",
  },
  {
    href: "/check?date=2027-04-16&copy=봄 리브랜드 런칭 파티",
    g: "D",
    date: "4월 16일",
    concept: "봄 리브랜드 런칭 파티",
    verdict: "D등급 — 재검토 권고",
    reason: "세월호 참사 추모일",
  },
  {
    href: "/check?date=2027-08-15&copy=광복 한정판 독립 에디션",
    g: "A",
    date: "8월 15일",
    concept: "광복 한정판 에디션",
    verdict: "A등급 — 최적 타이밍",
    reason: "광복절 호재 매칭",
  },
];

const GRADE_BG: Record<string, string> = {
  F: "var(--grade-f-bg)",
  D: "var(--grade-d-bg)",
  C: "var(--grade-c-bg)",
  B: "var(--grade-b-bg)",
  A: "var(--grade-a-bg)",
};
const GRADE_TEXT: Record<string, string> = {
  F: "var(--grade-f-text)",
  D: "var(--grade-d-text)",
  C: "var(--grade-c-text)",
  B: "var(--grade-b-text)",
  A: "var(--grade-a-text)",
};

/* ── Small atoms ─────────────────────────────────────────────── */
function GradeBadge({ g, size = 36 }: { g: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontWeight: 900,
        fontSize: size * 0.5,
        color: GRADE_TEXT[g] ?? GRADE_TEXT.C,
        background: GRADE_BG[g] ?? GRADE_BG.C,
        borderRadius: "8px",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.02em",
        lineHeight: 1,
      }}
    >
      {g}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: RED,
        background: RED_SOFT,
        border: `1px solid ${RED_MID}`,
        padding: "6px 14px",
        borderRadius: "999px",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED }} />
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: RED,
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "var(--font-body)", color: TEXT }}>
      <AppHeader />

      {/* ════════════════════════════════════════════════════════
          1. HERO — 좌측 정렬 · 굵은 헤드라인 · 빨강 액센트
      ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(180deg, ${BG} 0%, ${BG} 60%, ${RED_SOFT} 100%)`,
          padding: "72px 24px 96px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 장식 — 우상단 큰 빨강 글로우 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "640px",
            height: "640px",
            background: `radial-gradient(circle, ${RED}22 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
          <Eyebrow>브랜드 안전 · 날짜 리스크 분석</Eyebrow>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.75rem, 6vw, 5rem)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              color: TEXT,
              margin: "28px 0 24px",
              maxWidth: "920px",
            }}
          >
            광고 사고는 <span style={{ color: RED }}>출시 전</span>에 막습니다.
            <br />
            5초면 됩니다.
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
              lineHeight: 1.6,
              color: MUTED,
              maxWidth: "640px",
              margin: "0 0 36px",
            }}
          >
            마케팅 캠페인의 <strong style={{ color: TEXT }}>날짜 × 카피</strong>가 한국 역사·사회 맥락과
            충돌하는지 AI가 즉시 분석합니다. F부터 A까지 5단계 등급으로 한눈에.
          </p>

          {/* Dual CTA */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "32px" }}>
            <Link
              href="/check"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: RED,
                color: "#fff",
                fontWeight: 700,
                fontSize: "16px",
                padding: "16px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                boxShadow: `0 12px 32px ${RED}40, 0 0 0 1px ${RED_DARK}`,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              지금 무료로 검토하기 <span style={{ fontSize: "18px" }}>→</span>
            </Link>
            <Link
              href="/calendar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#fff",
                color: TEXT,
                fontWeight: 600,
                fontSize: "16px",
                padding: "16px 24px",
                borderRadius: "10px",
                textDecoration: "none",
                border: `1.5px solid ${BORDER}`,
              }}
            >
              리스크 캘린더 보기
            </Link>
          </div>

          <p style={{ fontSize: "13px", color: FAINT, margin: 0 }}>
            ✓ 회원가입 불필요 &nbsp;·&nbsp; ✓ 한국 사건 60+ 큐레이션 &nbsp;·&nbsp; ✓ 5초 안에 결과
          </p>

          {/* Hero에 바로 붙는 실제 사례 카드 — 강력한 사회적 증거 */}
          <div
            style={{
              marginTop: "56px",
              background: "#fff",
              border: `1px solid ${RED_MID}`,
              borderLeft: `4px solid ${RED}`,
              borderRadius: "14px",
              padding: "24px 28px",
              maxWidth: "720px",
              boxShadow: "0 24px 56px rgba(225, 29, 72, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <GradeBadge g="F" size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: RED,
                    marginBottom: "6px",
                  }}
                >
                  실제 사고 사례 · 2026.05.18
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: TEXT,
                    margin: "0 0 6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  스타벅스 “탱크데이” 텀블러 · “책상에 탁!” 런칭 카피
                </p>
                <p style={{ fontSize: "13.5px", color: MUTED, margin: 0, lineHeight: 1.55 }}>
                  → 전국 불매 운동 · 대표 해임 · 정부 보이콧 · 미국 본사 공식 사과
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          2. STATS — 빨강 강조 숫자 4개
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "56px 24px", borderTop: `1px solid ${BORDER}` }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "32px",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.25rem, 4vw, 3rem)",
                  fontWeight: 900,
                  color: RED,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: "13px", color: MUTED, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          3. BEFORE / AFTER
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: BG_SOFT, padding: "96px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>왜 필요한가</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: TEXT,
              margin: "0 0 48px",
              maxWidth: "640px",
              lineHeight: 1.15,
            }}
          >
            마케터가 놓치기 쉬운
            <br />
            <span style={{ color: RED }}>날짜 리스크</span>
          </h2>

          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: `1px solid ${BORDER}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: RED_SOFT,
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: RED,
                  textTransform: "uppercase",
                  borderRight: `1px solid ${RED_MID}`,
                }}
              >
                Before Nunchi
              </div>
              <div
                style={{
                  padding: "16px 24px",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "var(--ms-blue)",
                  textTransform: "uppercase",
                  background: "var(--ms-blue-light)",
                }}
              >
                After Nunchi
              </div>
            </div>

            {BEFORE_AFTER.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: i === BEFORE_AFTER.length - 1 ? "none" : `1px solid ${BORDER}`,
                }}
              >
                <div
                  style={{
                    padding: "20px 24px",
                    fontSize: "15px",
                    color: MUTED,
                    borderRight: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: RED, fontWeight: 700 }}>✗</span> {row.before}
                </div>
                <div
                  style={{
                    padding: "20px 24px",
                    fontSize: "15px",
                    color: TEXT,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: "var(--ms-blue)", fontWeight: 700 }}>✓</span> {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          4. FEATURES — 좌측 빨강 번호 카드
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>핵심 기능</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: TEXT,
              margin: "0 0 56px",
              maxWidth: "720px",
              lineHeight: 1.15,
            }}
          >
            단순 검색이 아닙니다.
            <br />
            <span style={{ color: RED }}>맥락을 이해</span>합니다.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {FEATURES.map((f) => (
              <article
                key={f.badge}
                style={{
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "16px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    background: RED_SOFT,
                    color: RED,
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "16px",
                    borderRadius: "10px",
                    border: `1px solid ${RED_MID}`,
                  }}
                >
                  {f.badge}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: TEXT,
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.65, margin: 0, flex: 1 }}>
                  {f.body}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", paddingTop: "12px", borderTop: `1px solid ${BORDER}` }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "26px",
                      fontWeight: 900,
                      color: RED,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {f.metric}
                  </span>
                  <span style={{ fontSize: "12px", color: FAINT, fontWeight: 500 }}>{f.metricLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          5. GRADE LADDER (F → A)
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: BG_SOFT, padding: "96px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>5단계 등급</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: TEXT,
              margin: "0 0 16px",
              maxWidth: "720px",
              lineHeight: 1.15,
            }}
          >
            한눈에 위험 · 호재를
            <br />
            동시에 판단합니다.
          </h2>
          <p style={{ fontSize: "15px", color: MUTED, margin: "0 0 48px", maxWidth: "560px" }}>
            F부터 A까지 5단계로 자동 분류. 위험만 차단하는 게 아니라 호재 타이밍도 알려드립니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            {GRADES.map((grade) => (
              <div
                key={grade.g}
                style={{
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "14px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <GradeBadge g={grade.g} size={44} />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 800,
                      color: TEXT,
                      marginBottom: "4px",
                    }}
                  >
                    {grade.label}
                  </div>
                  <div style={{ fontSize: "13px", color: MUTED, lineHeight: 1.5 }}>{grade.sub}</div>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: FAINT,
                    fontFamily: "var(--font-body)",
                    paddingTop: "12px",
                    borderTop: `1px solid ${BORDER}`,
                  }}
                >
                  예: {grade.ex}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          6. LIVE DEMOS — 실제 케이스 클릭 가능
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionLabel>지금 직접 확인하기</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: TEXT,
              margin: "0 0 48px",
              maxWidth: "720px",
              lineHeight: 1.15,
            }}
          >
            3가지 시나리오로 체험해보세요.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {DEMOS.map((demo) => (
              <Link
                key={demo.href}
                href={demo.href}
                style={{
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "14px",
                  padding: "24px",
                  textDecoration: "none",
                  color: TEXT,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "border-color 0.15s, transform 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <GradeBadge g={demo.g} size={40} />
                  <span style={{ fontSize: "12px", color: FAINT, fontWeight: 600 }}>{demo.date}</span>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: TEXT,
                      marginBottom: "6px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {demo.concept}
                  </div>
                  <div style={{ fontSize: "13px", color: MUTED, marginBottom: "4px" }}>{demo.verdict}</div>
                  <div style={{ fontSize: "12px", color: FAINT }}>{demo.reason}</div>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: RED,
                    paddingTop: "12px",
                    borderTop: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  검토 결과 보기 <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          7. FINAL CTA — 큰 빨강 CTA 섹션
      ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
          padding: "96px 24px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              margin: "0 0 20px",
              color: "#fff",
            }}
          >
            다음 캠페인이
            <br />
            사고가 되기 전에.
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
              color: "rgba(255,255,255,0.85)",
              margin: "0 auto 40px",
              maxWidth: "520px",
              lineHeight: 1.6,
            }}
          >
            지금 베타 무료. 회원가입 없이 첫 검토를 시작하세요.
          </p>
          <Link
            href="/check"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "#fff",
              color: RED,
              fontWeight: 800,
              fontSize: "17px",
              padding: "18px 36px",
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
              transition: "transform 0.15s",
            }}
          >
            무료로 검토 시작하기 <span style={{ fontSize: "20px" }}>→</span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          8. FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: "#0F0F11",
          color: "rgba(255,255,255,0.6)",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color: "#fff",
                fontSize: "18px",
                marginBottom: "6px",
                letterSpacing: "-0.01em",
              }}
            >
              nunchi
            </div>
            <div style={{ fontSize: "12px" }}>
              한국 마케터를 위한 브랜드 안전 인텔리전스 · Beta
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
            <Link href="/calendar" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              캘린더
            </Link>
            <Link href="/check" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              캠페인 검토
            </Link>
            <Link href="/contact" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              문의하기
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
