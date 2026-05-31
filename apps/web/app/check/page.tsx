"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CheckRequest, CheckResponse } from "@nunchi/shared";
import { ResultCard } from "@/components/result-card/ResultCard";
import { AppHeader } from "@/components/AppHeader";
import { NearbyEventsPreview } from "@/components/NearbyEventsPreview";
import { PageHeader, Card, Field, Input, Textarea, Button, Icon, inputBaseStyle, inputFocusHandlers } from "@/components/ui";

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
      <AppHeader />

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <PageHeader
          eyebrow="브랜드 안전 분석"
          eyebrowIcon="shield"
          title="캠페인 검토"
          subtitle="날짜와 카피를 입력하면 위험 등급과 호재 기회를 즉시 분석합니다."
        />

        {/* Form card */}
        <Card padding="lg" style={{ marginBottom: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Date + Campaign row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid">
              <Field label="캠페인 날짜" htmlFor="date" required>
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </Field>
              <Field label="캠페인명" htmlFor="campaign" optional>
                <Input
                  id="campaign"
                  type="text"
                  placeholder="예: 여름 한정 에디션"
                  maxLength={200}
                  value={form.campaignName}
                  onChange={(e) => setForm((p) => ({ ...p, campaignName: e.target.value }))}
                />
              </Field>
            </div>

            {/* Nearby events preview — full-width below date+campaign row */}
            <NearbyEventsPreview date={form.date} />

            {/* Copy */}
            <Field
              label="카피 / 슬로건"
              htmlFor="copy"
              required
              hint={`${form.copy.length} / 2000`}
            >
              <Textarea
                id="copy"
                required
                placeholder="예: 봄 항해 컬렉션, 빼빼로 1+1 한정, 광복 75주년 에디션 등 사용하려는 카피를 입력하세요"
                rows={4}
                maxLength={2000}
                value={form.copy}
                onChange={(e) => setForm((p) => ({ ...p, copy: e.target.value }))}
              />
            </Field>

            {/* Visual keywords */}
            <Field label="비주얼 키워드" htmlFor="keywords" optional hint="Enter로 추가">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  id="keywords"
                  type="text"
                  placeholder="예: 노란 리본, 추모, 평화…"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                  {...inputFocusHandlers}
                  style={{ ...inputBaseStyle, height: "var(--input-h)", flex: 1 }}
                />
                <Button type="button" variant="secondary" onClick={addKeyword}>
                  추가
                </Button>
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
            </Field>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  background: "var(--brand-red-soft)",
                  border: "1px solid var(--brand-red-mid)",
                  borderLeft: "3px solid var(--brand-red)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "var(--brand-red-text)",
                  fontSize: "13px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <Icon name="alert" size={16} style={{ color: "var(--brand-red)", flexShrink: 0, marginTop: "1px" }} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              iconRight={loading ? undefined : "arrow-right"}
              disabled={loading || !form.copy.trim()}
              style={
                loading || !form.copy.trim()
                  ? { opacity: 0.5, cursor: "not-allowed", boxShadow: "none" }
                  : undefined
              }
            >
              {loading ? "분석 중…" : "검토 시작"}
            </Button>
          </form>
        </Card>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{
              width: "32px", height: "32px",
              border: "3px solid var(--brand-red-mid)",
              borderTopColor: "var(--brand-red)",
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ fontSize: "14px", color: "var(--muted-ink)", marginTop: "16px", fontWeight: 500 }}>
              날짜·카피를 한국 역사 데이터와 교차 검토 중…
            </p>
            <p style={{ fontSize: "12px", color: "var(--ms-text-3)", marginTop: "4px" }}>
              보통 5–10초 소요됩니다
            </p>
          </div>
        )}

        {/* Empty state — shown before first submit */}
        {!result && !loading && !error && (
          <Card tone="soft" padding="lg" style={{ textAlign: "center" }}>
            <Icon name="search" size={32} style={{ color: "var(--brand-red)", margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ms-text)", margin: "0 0 6px" }}>
              날짜와 카피를 입력하고 검토해보세요
            </p>
            <p style={{ fontSize: "12.5px", color: "var(--ms-text-2)", margin: 0, lineHeight: 1.6 }}>
              5·18, 세월호, 이태원 등 60개+ 민감일과 즉시 교차 분석합니다
            </p>
          </Card>
        )}

        {/* Result */}
        {result && (
          <div ref={resultRef}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
              검토 결과
            </p>
            <ResultCard result={result} date={form.date} campaignName={form.campaignName} />
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
