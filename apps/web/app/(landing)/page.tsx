"use client";

import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";

/* ── Grade badge ──────────────────────────────────────────── */
function GMini({ g }: { g: string }) {
  const map: Record<string, [string, string]> = {
    F: ["var(--grade-f-text)", "var(--grade-f-bg)"],
    D: ["var(--grade-d-text)", "var(--grade-d-bg)"],
    C: ["var(--grade-c-text)", "var(--grade-c-bg)"],
    B: ["var(--grade-b-text)", "var(--grade-b-bg)"],
    A: ["var(--grade-a-text)", "var(--grade-a-bg)"],
  };
  const [text, bg] = map[g] ?? map["C"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 800,
        fontSize: "12px",
        color: text,
        background: bg,
        padding: "2px 10px",
        borderRadius: "3px",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.02em",
      }}
    >
      {g}
    </span>
  );
}

/* ── Constants ────────────────────────────────────────────── */
const DARK_BG = "#0B0F1C";
const DARK_BG2 = "#0F1523";
const MUTED = "#8FA3BF";
const BLUE = "#3B82F6";

const STATS = [
  { n: "60+", label: "큐레이션 리스크 이벤트" },
  { n: "F → A", label: "5단계 위험·호재 등급" },
  { n: "AI 분석", label: "맥락 기반 자동 교차 검토" },
  { n: "베타 무료", label: "지금 바로 시작 가능" },
];

const BEFORE_AFTER = [
  { before: "✗ 추모일·기념일 맥락 모름", after: "✓ F등급 즉시 경고" },
  { before: "✗ 출시 후 사후 대응", after: "✓ 출시 전 사전 검토" },
  { before: "✗ 브랜드 위기·임원 해임", after: "✓ 대안 카피 자동 제안" },
  { before: "✗ 팀 전체 긴급 대응 비용", after: "✓ 마케터 한 명이 5초에 검토" },
];

const FEATURES = [
  {
    icon: "📅",
    title: "날짜 리스크 분석",
    body: "입력한 캠페인 날짜가 한국 역사 민감일과 충돌하는지 즉시 판단합니다. F부터 A까지 5단계 등급으로 한눈에 확인.",
    example: "5·18 / 4·16 / 6·25 / 이태원 등 60건+",
  },
  {
    icon: "🔍",
    title: "키워드 위험 감지",
    body: '"탱크", "책상 탁", "봄 런칭" 등 맥락 위험 키워드를 자동으로 감지하고 사유와 함께 플래그합니다.',
    example: "블랙리스트 키워드 자동 매칭",
  },
  {
    icon: "✏️",
    title: "AI 맞춤 제안",
    body: "위험 등급과 함께 대안 카피, 대체 날짜, 안전한 컨셉을 제시합니다. 단순 경고에 그치지 않습니다.",
    example: "업종·채널별 맞춤 분석",
  },
];

const GRADES = [
  {
    g: "F",
    label: "즉각 회피",
    sub: "역사적 비극과 직접 충돌. 캠페인 재설계 권고.",
    ex: "5·18, 세월호, 이태원",
    accent: "#DC2626",
    tc: "var(--grade-f-text)",
    bg: "var(--grade-f-bg)",
    bc: "var(--grade-f-border)",
  },
  {
    g: "D",
    label: "재검토 필요",
    sub: "민감 요소 감지. 컨셉·카피 전면 재검토.",
    ex: "6·25, 현충일 전후",
    accent: "#D97706",
    tc: "var(--grade-d-text)",
    bg: "var(--grade-d-bg)",
    bc: "var(--grade-d-border)",
  },
  {
    g: "C",
    label: "일반 주의",
    sub: "특별한 위험·호재 없음. 표준 주의.",
    ex: "대부분의 평일",
    accent: "#6B7280",
    tc: "var(--grade-c-text)",
    bg: "var(--ms-surface-2)",
    bc: "var(--ms-border)",
  },
  {
    g: "B",
    label: "안전",
    sub: "긍정적 연관 있거나 민감 요소 없음.",
    ex: "제헌절, 식목일",
    accent: "#16A34A",
    tc: "var(--grade-b-text)",
    bg: "var(--grade-b-bg)",
    bc: "var(--grade-b-border)",
  },
  {
    g: "A",
    label: "최적 타이밍",
    sub: "기념일·이벤트 시즌과 강한 긍정 연관.",
    ex: "광복절, 빼빼로데이",
    accent: "#2563EB",
    tc: "var(--grade-a-text)",
    bg: "var(--grade-a-bg)",
    bc: "var(--grade-a-border)",
  },
];

const DEMOS = [
  {
    href: "/check?date=2027-05-18&copy=탱크 시리즈 신상 출시",
    g: "F",
    label: "5월 18일 · 군사 테마 신제품",
    sub: "F등급 — 즉각 위험 감지",
    accent: "#DC2626",
    tc: "var(--grade-f-text)",
  },
  {
    href: "/check?date=2027-04-16&copy=봄 리브랜드 런칭 파티",
    g: "D",
    label: "4월 16일 · 런칭 파티",
    sub: "D등급 — 날짜 재검토 권고",
    accent: "#D97706",
    tc: "var(--grade-d-text)",
  },
  {
    href: "/check?date=2027-08-15&copy=광복 한정판 독립 에디션",
    g: "A",
    label: "8월 15일 · 광복 한정판",
    sub: "A등급 — 최적 타이밍",
    accent: "#2563EB",
    tc: "var(--grade-a-text)",
  },
];

/* ── Main ─────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: DARK_BG, minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <AppHeader />

      {/* ── 1. DARK HERO ─────────────────────────────────────── */}
      <section style={{ background: DARK_BG, padding: "80px 24px 72px" }} className="hero-section">
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: BLUE,
              border: `1px solid ${BLUE}30`,
              background: `${BLUE}18`,
              padding: "4px 12px",
              borderRadius: "3px",
              marginBottom: "28px",
            }}
          >
            브랜드 안전 · 날짜 리스크 분석
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.06,
              color: "#FFFFFF",
              margin: "0 0 22px",
            }}
          >
            출시 전에,
            <br />
            <span style={{ color: BLUE }}>리스크를 잡습니다</span>
          </h1>

          <p
            style={{
              fontSize: "17px",
              color: MUTED,
              lineHeight: 1.65,
              maxWidth: "480px",
              marginBottom: "36px",
            }}
          >
            마케팅 캠페인의 날짜 × 카피가 한국 역사·사회
            맥락과 충돌하는지 AI가 즉시 분석합니다.
          </p>

          <div
            style={{ display: "flex", gap: "12px", flexWrap: "wrap" as const, alignItems: "center", marginBottom: "56px" }}
          >
            <Link
              href="/check"
              style={{
                display: "inline-block",
                padding: "13px 30px",
                borderRadius: "4px",
                background: BLUE,
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap" as const,
                boxShadow: `0 2px 16px ${BLUE}50`,
                transition: "background 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "#2563EB";
                el.style.boxShadow = `0 4px 20px ${BLUE}60`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = BLUE;
                el.style.boxShadow = `0 2px 16px ${BLUE}50`;
              }}
            >
              지금 무료로 시작하기 →
            </Link>
            <span style={{ fontSize: "13px", color: `${MUTED}99` }}>회원가입 불필요</span>
          </div>

          {/* Hero card */}
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(220,38,38,0.4)",
              borderLeft: "4px solid #DC2626",
              borderRadius: "12px",
              padding: "20px 24px",
              maxWidth: "560px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: MUTED }}>
                실제 사례 · 2026.05.18
              </span>
              <GMini g="F" />
            </div>
            <p style={{ fontSize: "14px", color: "#FFFFFF", lineHeight: 1.6, margin: "0 0 6px", fontWeight: 600 }}>
              "탱크데이" 텀블러 · "책상에 탁!" 런칭 카피
            </p>
            <p style={{ fontSize: "13px", color: MUTED, margin: 0, lineHeight: 1.5 }}>
              → 전국 불매 운동 · 대표 해임 · 정부 보이콧 · 미국 본사 공식 사과
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. STATS BAR ─────────────────────────────────────── */}
      <div
        style={{
          background: DARK_BG2,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 24px",
        }}
        className="stats-bar"
      >
        <div
          style={{ maxWidth: "1160px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}
          className="rg-4"
        >
          {STATS.map((item) => (
            <div key={item.n} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.04em" }}>
                {item.n}
              </p>
              <p style={{ fontSize: "12px", color: MUTED, margin: 0, fontWeight: 500 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. WHY — Before / After (white) ──────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "80px 24px" }} className="section-pad">
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--ms-blue)", margin: "0 0 12px" }}>
            왜 필요한가
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px,3.5vw,38px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ms-text)",
              margin: "0 0 40px",
              lineHeight: 1.12,
            }}
          >
            마케터가 놓치기 쉬운
            <br />
            날짜 리스크
          </h2>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", border: "1px solid var(--ms-border)", borderRadius: "10px", overflow: "hidden" }}
            className="rg-2"
          >
            <div style={{ background: "#FEF2F2", padding: "16px 24px", borderBottom: "1px solid #FECACA" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#DC2626", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                Before nunchi
              </span>
            </div>
            <div style={{ background: "#EFF6FF", padding: "16px 24px", borderBottom: "1px solid #BFDBFE" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563EB", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                After nunchi
              </span>
            </div>
            {BEFORE_AFTER.map((row, i) => [
              <div
                key={`b-${i}`}
                style={{
                  padding: "16px 24px",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                  borderBottom: i < BEFORE_AFTER.length - 1 ? "1px solid var(--ms-border)" : "none",
                  fontSize: "14px",
                  color: "var(--ms-text-2)",
                  lineHeight: 1.5,
                }}
              >
                {row.before}
              </div>,
              <div
                key={`a-${i}`}
                style={{
                  padding: "16px 24px",
                  background: i % 2 === 0 ? "#F8FAFF" : "#F0F6FF",
                  borderBottom: i < BEFORE_AFTER.length - 1 ? "1px solid #BFDBFE40" : "none",
                  fontSize: "14px",
                  color: "var(--ms-text)",
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                {row.after}
              </div>,
            ])}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES (white) ──────────────────────────────── */}
      <section style={{ background: "#FFFFFF", padding: "0 24px 80px" }} className="section-pad">
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--ms-blue)", margin: "0 0 12px" }}>
            핵심 기능
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px,3.5vw,38px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ms-text)",
              margin: "0 0 36px",
              lineHeight: 1.12,
            }}
          >
            3가지로 충분합니다
          </h2>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}
            className="rg-3"
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--ms-border)",
                  borderRadius: "8px",
                  padding: "28px 24px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "14px" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--ms-text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--ms-text-2)", lineHeight: 1.65, margin: "0 0 14px" }}>
                  {f.body}
                </p>
                <p style={{ fontSize: "11px", color: "var(--ms-text-3)", fontWeight: 600, margin: 0, background: "var(--ms-surface-2)", display: "inline-block", padding: "3px 10px", borderRadius: "3px" }}>
                  {f.example}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. GRADE SYSTEM (light gray) ─────────────────────── */}
      <section
        style={{ background: "#F8F9FC", borderTop: "1px solid var(--ms-border)", borderBottom: "1px solid var(--ms-border)", padding: "72px 24px" }}
        className="section-pad"
      >
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--ms-blue)", margin: "0 0 10px" }}>
            등급 시스템
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px,3vw,32px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ms-text)",
              margin: "0 0 32px",
            }}
          >
            위험만 체크하지 않습니다. 기회도 찾아드립니다.
          </h2>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px" }}
            className="rg-5"
          >
            {GRADES.map((item) => (
              <div
                key={item.g}
                style={{
                  background: item.bg,
                  border: `1px solid ${item.bc}`,
                  borderLeft: `4px solid ${item.accent}`,
                  borderRadius: "6px",
                  padding: "18px 16px",
                }}
              >
                <p style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 800, color: item.tc, margin: "0 0 4px", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {item.g}
                </p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ms-text)", margin: "0 0 8px" }}>
                  {item.label}
                </p>
                <p style={{ fontSize: "11px", color: "var(--ms-text-2)", lineHeight: 1.55, margin: "0 0 10px" }}>
                  {item.sub}
                </p>
                <p style={{ fontSize: "10px", color: item.tc, fontWeight: 700, margin: 0 }}>
                  예: {item.ex}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. DEMO CTA (dark) ───────────────────────────────── */}
      <section style={{ background: DARK_BG, padding: "80px 24px" }} className="section-pad">
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: BLUE, marginBottom: "12px" }}>
            직접 체험해보기
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px,3.5vw,36px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
              margin: "0 0 32px",
              lineHeight: 1.12,
            }}
          >
            3가지 시나리오로 바로 확인하세요
          </h2>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "56px" }}
            className="rg-3"
          >
            {DEMOS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderLeft: `4px solid ${item.accent}`,
                  borderRadius: "8px",
                  padding: "20px 22px",
                  display: "block",
                  transition: "background 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(255,255,255,0.10)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <GMini g={item.g} />
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "#FFFFFF", margin: "0 0 5px", letterSpacing: "-0.01em" }}>
                  {item.label}
                </p>
                <p style={{ fontSize: "12px", color: item.tc, fontWeight: 700, margin: 0 }}>
                  {item.sub} →
                </p>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px,3vw,32px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#fff",
                margin: "0 0 12px",
                lineHeight: 1.12,
              }}
            >
              내 브랜드를 운영하는
              <br />
              마케터를 위한 도구
            </h3>
            <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.65, marginBottom: "28px" }}>
              단순한 일정 관리가 아닙니다. 브랜드 리스크 스튜디오입니다.
            </p>
            <Link
              href="/check"
              style={{
                display: "inline-block",
                padding: "14px 36px",
                borderRadius: "4px",
                background: BLUE,
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                boxShadow: `0 2px 16px ${BLUE}50`,
                transition: "background 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "#2563EB";
                el.style.boxShadow = `0 4px 20px ${BLUE}60`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = BLUE;
                el.style.boxShadow = `0 2px 16px ${BLUE}50`;
              }}
            >
              무료로 시작하기 →
            </Link>
            <p style={{ fontSize: "12px", color: `${MUTED}80`, marginTop: "12px" }}>
              회원가입 없이 즉시 이용 · 완전 무료
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER (dark) ─────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "22px 24px",
          background: DARK_BG,
        }}
      >
        <div
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap" as const,
            gap: "10px",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "16px", color: "#FFFFFF", letterSpacing: "-0.03em" }}>
            nunchi
          </span>
          <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>
            이 서비스의 결과는 참고용입니다. © 2026 nunchi.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { href: "/calendar", label: "리스크 캘린더" },
              { href: "/check", label: "캠페인 검토" },
              { href: "/privacy", label: "개인정보처리방침" },
              { href: "/terms", label: "이용약관" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontSize: "12px", color: MUTED, textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
