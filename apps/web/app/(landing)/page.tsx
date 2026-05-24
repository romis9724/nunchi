"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Waitlist form ─────────────────────────────────────────── */
function WaitlistForm({ source, dark = false }: { source: string; dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "오류가 발생했습니다."); setStatus("error"); return; }
      setStatus("done");
    } catch { setErr("네트워크 오류"); setStatus("error"); }
  };

  if (status === "done") return (
    <p style={{ fontSize: "14px", color: dark ? "rgba(255,255,255,0.8)" : "var(--grade-b-text)", fontWeight: 500 }}>
      ✓ 신청 완료 — 오픈 시 가장 먼저 알려드릴게요.
    </p>
  );

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "480px" }}>
      <input
        type="email" required value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="이메일 주소"
        style={{
          flex: "1 1 200px", padding: "10px 14px",
          border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : "var(--ms-border)"}`,
          borderRadius: "4px",
          background: dark ? "rgba(255,255,255,0.1)" : "#fff",
          color: dark ? "#fff" : "var(--ms-text)",
          fontSize: "14px", fontFamily: "var(--font-body)",
          outline: "none",
        }}
        onFocus={e => (e.target.style.borderColor = dark ? "rgba(255,255,255,0.5)" : "var(--ms-blue)")}
        onBlur={e => (e.target.style.borderColor = dark ? "rgba(255,255,255,0.25)" : "var(--ms-border)")}
      />
      <button type="submit" disabled={status === "loading"} style={{
        padding: "10px 20px", borderRadius: "4px", border: "none",
        background: "var(--ms-blue)", color: "#fff",
        fontSize: "14px", fontWeight: 600, cursor: "pointer",
        fontFamily: "var(--font-body)",
        opacity: status === "loading" ? 0.6 : 1, whiteSpace: "nowrap",
      }}
      onMouseEnter={e => ((e.target as HTMLElement).style.background = "var(--ms-blue-dark)")}
      onMouseLeave={e => ((e.target as HTMLElement).style.background = "var(--ms-blue)")}
      >
        {status === "loading" ? "신청 중…" : "사전 신청"}
      </button>
      {status === "error" && <p style={{ width: "100%", fontSize: "12px", color: dark ? "#ffb3b3" : "var(--grade-f-text)" }}>{err}</p>}
    </form>
  );
}

/* ── Grade badge inline ─────────────────────────────────────── */
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700, fontSize: "12px", color: text, background: bg, padding: "2px 10px", borderRadius: "3px", fontFamily: "var(--font-display)" }}>
      {g}
    </span>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: "var(--ms-surface)", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* NAV */}
      <header style={{ borderBottom: "1px solid var(--ms-border)", background: "rgba(250,249,248,0.96)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.04em", color: "var(--ms-text)" }}>
            nunchi
          </Link>
          <nav style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <Link href="/calendar" style={{ fontSize: "13px", color: "var(--ms-text-2)", textDecoration: "none", padding: "6px 12px", borderRadius: "4px", fontWeight: 500 }}>
              민감일 캘린더
            </Link>
            <Link href="/check" style={{ fontSize: "13px", fontWeight: 600, background: "var(--ms-blue)", color: "#fff", padding: "7px 16px", borderRadius: "4px", textDecoration: "none" }}>
              무료로 시작
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: "1160px", margin: "0 auto", padding: "72px 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>

          {/* Left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ms-blue)", background: "var(--ms-blue-light)", border: "1px solid var(--ms-blue-mid)", padding: "4px 12px", borderRadius: "3px", marginBottom: "24px" }}>
              브랜드 안전 · 날짜 리스크 분석
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "var(--ms-text)", margin: "0 0 20px" }}>
              캠페인 날짜,<br />
              <span style={{ color: "var(--ms-blue)" }}>안전하게</span><br />
              출시하세요
            </h1>

            <p style={{ fontSize: "16px", color: "var(--ms-text-2)", lineHeight: 1.7, maxWidth: "400px", marginBottom: "32px" }}>
              날짜 × 카피의 역사적·사회적 맥락을 교차 검토합니다.<br />
              위험은 출시 전에 잡고, 호재는 놓치지 않게.
            </p>

            <WaitlistForm source="hero" />

            <p style={{ fontSize: "12px", color: "var(--ms-text-3)", marginTop: "12px" }}>
              회원가입 불필요 ·{" "}
              <Link href="/check" style={{ color: "var(--ms-blue)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                지금 바로 1건 검토해보기 →
              </Link>
            </p>
          </div>

          {/* Right — case cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "8px" }}>
            <div style={{ background: "var(--grade-f-bg)", border: "1px solid var(--grade-f-border)", borderRadius: "6px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ms-text-3)" }}>실제 사례 · 국내</span>
                <GMini g="F" />
              </div>
              <p style={{ fontSize: "14px", color: "var(--ms-text)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                국가 추모일 당일, 군사·무력 모티프 제품 출시
              </p>
              <p style={{ fontSize: "12px", color: "var(--ms-text-2)", margin: "6px 0 0", lineHeight: 1.5 }}>
                → 전국 불매 운동 · 임원 해임 · 정부 보이콧
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#fff", border: "1px solid var(--ms-border)", borderRadius: "6px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ms-text-3)" }}>미국</span>
                  <GMini g="F" />
                </div>
                <p style={{ fontSize: "12px", color: "var(--ms-text)", lineHeight: 1.55, margin: 0 }}>사회운동 시기 광고 캠페인 → 전 세계 조롱·즉시 철회</p>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--ms-border)", borderRadius: "6px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ms-text-3)" }}>글로벌</span>
                  <GMini g="F" />
                </div>
                <p style={{ fontSize: "12px", color: "var(--ms-text)", lineHeight: 1.55, margin: 0 }}>문화 비하 광고 → 수억 달러 손실·CEO 공개 사과</p>
              </div>
            </div>

            <div style={{ background: "var(--grade-a-bg)", border: "1px solid var(--grade-a-border)", borderRadius: "6px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--ms-text-3)", fontWeight: 600, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>광복절 8월 15일</p>
                <p style={{ fontSize: "13px", color: "var(--ms-text)", margin: 0 }}>독립 테마 캠페인 최적 타이밍</p>
              </div>
              <GMini g="A" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: "var(--ms-blue)", padding: "24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
          {[
            { n: "31+", label: "큐레이션된 한국 민감일" },
            { n: "F → A", label: "5단계 위험·호재 등급" },
            { n: "5초 이내", label: "AI 검토 응답속도" },
            { n: "무료", label: "베타 기간 전면 무료" },
          ].map(item => (
            <div key={item.n} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.04em" }}>{item.n}</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0, fontWeight: 500 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "64px", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ms-blue)", margin: "0 0 14px" }}>사용 방법</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ms-text)", margin: 0, lineHeight: 1.12 }}>
              3단계로<br />끝납니다
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { n: "01", title: "날짜 + 카피 입력", body: "캠페인 날짜, 카피, 비주얼 키워드를 입력합니다. 회원가입 불필요, 즉시 시작." },
              { n: "02", title: "AI 교차 검토", body: "한국 민감일 31건+ 및 긍정 기념일 DB와 실시간 교차 분석. Gemini가 맥락을 읽습니다." },
              { n: "03", title: "F–A 등급 확인", body: "회피(F)부터 최적 타이밍(A)까지 5단계 등급 + 구체적 사유 + 대안 카피." },
            ].map((step, i) => (
              <div key={step.n} style={{ display: "flex", gap: "24px", padding: "28px 0", borderBottom: i < 2 ? `1px solid var(--ms-surface-3)` : "none" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 700, color: "var(--ms-border)", letterSpacing: "0.04em", paddingTop: "3px", minWidth: "28px" }}>{step.n}</span>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--ms-text)", margin: "0 0 7px", letterSpacing: "-0.02em" }}>{step.title}</h3>
                  <p style={{ fontSize: "14px", color: "var(--ms-text-2)", lineHeight: 1.65, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GRADE SYSTEM */}
      <section style={{ background: "var(--ms-surface-2)", borderTop: "1px solid var(--ms-border)", borderBottom: "1px solid var(--ms-border)", padding: "72px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ marginBottom: "36px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ms-blue)", margin: "0 0 10px" }}>등급 시스템</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ms-text)", margin: 0 }}>
              위험만 체크하지 않습니다. 기회도 찾아드립니다.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px" }}>
            {[
              { g: "F", label: "즉각 회피",   sub: "역사적 비극과 직접 충돌. 캠페인 재설계 권고.", ex: "5·18, 세월호, 이태원" },
              { g: "D", label: "재검토 필요", sub: "민감 요소 감지. 컨셉·카피 전면 재검토.", ex: "6·25, 현충일 전후" },
              { g: "C", label: "일반 주의",   sub: "특별한 위험·호재 없음. 표준 주의.", ex: "대부분의 평일" },
              { g: "B", label: "안전",        sub: "긍정적 연관 있거나 민감 요소 없음.", ex: "제헌절, 식목일" },
              { g: "A", label: "최적 타이밍", sub: "기념일·이벤트 시즌과 강한 긍정 연관.", ex: "광복절, 빼빼로데이" },
            ].map(item => {
              const colors: Record<string, [string,string,string]> = {
                F: ["var(--grade-f-text)","var(--grade-f-bg)","var(--grade-f-border)"],
                D: ["var(--grade-d-text)","var(--grade-d-bg)","var(--grade-d-border)"],
                C: ["var(--grade-c-text)","var(--ms-surface-2)","var(--ms-border)"],
                B: ["var(--grade-b-text)","var(--grade-b-bg)","var(--grade-b-border)"],
                A: ["var(--grade-a-text)","var(--grade-a-bg)","var(--grade-a-border)"],
              };
              const [tc, bg, bc] = colors[item.g];
              return (
                <div key={item.g} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: "6px", padding: "18px 16px" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 800, color: tc, margin: "0 0 4px", letterSpacing: "-0.04em" }}>{item.g}</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ms-text)", margin: "0 0 8px" }}>{item.label}</p>
                  <p style={{ fontSize: "11px", color: "var(--ms-text-2)", lineHeight: 1.55, margin: "0 0 10px" }}>{item.sub}</p>
                  <p style={{ fontSize: "10px", color: tc, fontWeight: 600, margin: 0 }}>예: {item.ex}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEMO LINKS */}
      <section style={{ maxWidth: "1160px", margin: "0 auto", padding: "64px 24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ms-blue)", marginBottom: "20px" }}>
          직접 체험해보기
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
          {[
            { href: "/check?date=2027-05-18&copy=탱크 시리즈 신상 출시", g: "F", label: "5월 18일 · 군사 테마 신제품", sub: "F등급 — 즉각 위험 감지" },
            { href: "/check?date=2027-04-16&copy=봄 리브랜드 런칭 파티", g: "D", label: "4월 16일 · 런칭 파티", sub: "D등급 — 날짜 재검토 권고" },
            { href: "/check?date=2027-08-15&copy=광복 한정판 독립 에디션", g: "A", label: "8월 15일 · 광복 한정판", sub: "A등급 — 최적 타이밍" },
          ].map(item => {
            const colors: Record<string,[string,string,string]> = {
              F: ["var(--grade-f-text)","var(--grade-f-bg)","var(--grade-f-border)"],
              D: ["var(--grade-d-text)","var(--grade-d-bg)","var(--grade-d-border)"],
              A: ["var(--grade-a-text)","var(--grade-a-bg)","var(--grade-a-border)"],
            };
            const [tc,bg,bc] = colors[item.g];
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none", background: bg, border: `1px solid ${bc}`, borderRadius: "6px", padding: "18px 20px", display: "block" }}>
                <div style={{ marginBottom: "10px" }}>
                  <GMini g={item.g} />
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--ms-text)", margin: "0 0 5px" }}>{item.label}</p>
                <p style={{ fontSize: "12px", color: tc, fontWeight: 600, margin: 0 }}>{item.sub} →</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA DARK */}
      <section style={{ background: "var(--ms-text)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "14px" }}>
            얼리 액세스
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, letterSpacing: "-0.045em", color: "#fff", margin: "0 0 14px", lineHeight: 1.1 }}>
            내 브랜드를 운영하는<br />마케터를 위한 도구
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: "30px" }}>
            단순한 일정 관리가 아닙니다.<br />브랜드 캘린더 스튜디오입니다.
          </p>
          <WaitlistForm source="bottom" dark />
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "12px" }}>스팸 없음 · 언제든 수신 취소 가능</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--ms-border)", padding: "22px 24px", background: "var(--ms-surface)" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "16px", color: "var(--ms-text)", letterSpacing: "-0.03em" }}>nunchi</span>
          <p style={{ fontSize: "12px", color: "var(--ms-text-3)", margin: 0 }}>이 서비스의 결과는 참고용입니다. © 2026 Nunchi.</p>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/calendar" style={{ fontSize: "12px", color: "var(--ms-text-2)", textDecoration: "none" }}>민감일 캘린더</Link>
            <Link href="/check" style={{ fontSize: "12px", color: "var(--ms-text-2)", textDecoration: "none" }}>캠페인 검토</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
