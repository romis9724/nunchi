"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CheckRequest, CheckResponse } from "@nunchi/shared";
import { ResultCard } from "@/components/result-card/ResultCard";
import { NunchiLogo } from "@/components/NunchiLogo";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/auth";

const NAV_LINK_STYLE = {
  fontSize: "13px",
  color: "var(--ms-text-2, var(--muted-ink))",
  textDecoration: "none",
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: "4px",
  border: "1px solid var(--ms-border, var(--border-warm))",
  background: "transparent",
  cursor: "pointer",
  transition: "all 0.12s",
} as const;

const INPUT_STYLE = {
  width: "100%",
  padding: "12px 16px",
  border: "1.5px solid var(--border-warm)",
  borderRadius: "12px",
  background: "#FFFFFF",
  fontSize: "14px",
  color: "var(--charcoal)",
  outline: "none",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.15s",
} as const;

const LABEL_STYLE = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--muted-ink)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

function CheckForm() {
  const searchParams = useSearchParams();
  const resultRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CheckRequest>({
    date: searchParams.get("date") ?? new Date().toISOString().split("T")[0],
    campaignName: searchParams.get("campaign") ?? "",
    copy: searchParams.get("copy") ?? "",
    assetKeywords: [],
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !(form.assetKeywords ?? []).includes(kw)) {
      setForm((p) => ({ ...p, assetKeywords: [...(p.assetKeywords ?? []), kw] }));
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) =>
    setForm((p) => ({ ...p, assetKeywords: (p.assetKeywords ?? []).filter((k) => k !== kw) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.copy.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "검토 중 오류가 발생했습니다."); return; }
      setResult(data as CheckResponse);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--warm-white)", fontFamily: "var(--font-body)" }}>
      {/* Nav */}
      <header style={{
        borderBottom: "1px solid var(--border-warm)",
        background: "rgba(248,247,244,0.92)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--ms-text, var(--charcoal))" }}>
            <NunchiLogo size={22} />
          </Link>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <Link href="/calendar" style={NAV_LINK_STYLE}>
              민감일 캘린더
            </Link>
            <Link href="/contact" style={NAV_LINK_STYLE}>
              문의하기
            </Link>
            <button
              onClick={async () => {
                const result = await signInWithGoogle({ origin: window.location.origin });
                if (result.url) window.location.href = result.url;
              }}
              style={{ ...NAV_LINK_STYLE, background: "var(--ms-blue)", color: "#fff", border: "none", fontWeight: 600 }}
            >
              Google 로그인
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--muted-ink)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
            <span>◈</span> 캠페인 검토
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", fontWeight: 800, color: "var(--charcoal)", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
            캠페인 날짜 검토
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted-ink)", lineHeight: 1.6, margin: 0 }}>
            날짜와 카피를 입력하면 위험 등급과 호재 기회를 즉시 분석합니다.
          </p>
        </div>

        {/* Form card */}
        <div className="studio-card" style={{ padding: "32px", marginBottom: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Date + Campaign row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid">
              <div>
                <label htmlFor="date" style={LABEL_STYLE}>
                  캠페인 날짜 <span style={{ color: "var(--coral)" }}>*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
                />
              </div>
              <div>
                <label htmlFor="campaign" style={LABEL_STYLE}>
                  캠페인명 <span style={{ fontWeight: 400, color: "var(--muted-ink)" }}>(선택)</span>
                </label>
                <input
                  id="campaign"
                  type="text"
                  placeholder="예: 여름 한정 에디션"
                  maxLength={200}
                  value={form.campaignName}
                  onChange={(e) => setForm((p) => ({ ...p, campaignName: e.target.value }))}
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
                />
              </div>
            </div>

            {/* Copy */}
            <div>
              <label htmlFor="copy" style={LABEL_STYLE}>
                카피 / 슬로건 <span style={{ color: "var(--coral)" }}>*</span>
              </label>
              <textarea
                id="copy"
                required
                placeholder="사용하려는 카피 또는 슬로건을 입력하세요…"
                rows={4}
                maxLength={2000}
                value={form.copy}
                onChange={(e) => setForm((p) => ({ ...p, copy: e.target.value }))}
                style={{ ...INPUT_STYLE, resize: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
              />
              <p style={{ fontSize: "11px", color: "var(--muted-ink)", textAlign: "right", marginTop: "4px" }}>
                {form.copy.length}/2000
              </p>
            </div>

            {/* Visual keywords */}
            <div>
              <label htmlFor="keywords" style={LABEL_STYLE}>
                비주얼 키워드 <span style={{ fontWeight: 400, color: "var(--muted-ink)" }}>(선택 · Enter로 추가)</span>
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  id="keywords"
                  type="text"
                  placeholder="예: 탱크, 군복, 노란 리본…"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  style={{
                    padding: "0 18px",
                    borderRadius: "12px",
                    border: "1.5px solid var(--border-warm)",
                    background: "var(--soft-beige)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--charcoal)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  추가
                </button>
              </div>
              {(form.assetKeywords ?? []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {(form.assetKeywords ?? []).map((kw) => (
                    <span
                      key={kw}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        fontSize: "12px", fontWeight: 500,
                        background: "var(--lavender-gray)",
                        border: "1px solid var(--border-warm)",
                        padding: "4px 12px", borderRadius: "100px",
                        color: "var(--charcoal)",
                      }}
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        aria-label={`${kw} 삭제`}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-ink)", fontSize: "14px", padding: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  fontSize: "13px",
                  color: "var(--grade-f-text)",
                  background: "var(--grade-f-bg)",
                  border: "1px solid var(--grade-f-border)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.copy.trim()}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: loading || !form.copy.trim() ? "var(--border-warm)" : "var(--charcoal)",
                color: loading || !form.copy.trim() ? "var(--muted-ink)" : "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading || !form.copy.trim() ? "not-allowed" : "pointer",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
            >
              {loading ? "분석 중…" : "검토 시작"}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div ref={resultRef}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
              ◈ 검토 결과
            </p>
            <ResultCard result={result} date={form.date} campaignName={form.campaignName} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "var(--muted-ink)" }}>
        로딩 중…
      </div>
    }>
      <CheckForm />
    </Suspense>
  );
}
