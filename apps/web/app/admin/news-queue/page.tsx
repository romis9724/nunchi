"use client";
import { AdminGuard } from "@/components/AdminGuard";
import { useState, useEffect } from "react";
import Link from "next/link";

interface PendingEvent {
  id: string;
  date: string;
  month: number;
  day: number;
  name: string;
  category: string;
  risk_level: string;
  summary: string;
  source: string;
}

const RISK_COLOR: Record<string, string> = {
  critical: "#DC2626",
  high:     "#EA580C",
  medium:   "#CA8A04",
  low:      "#16A34A",
};

const RISK_LABEL: Record<string, string> = {
  critical: "즉각회피",
  high:     "재검토",
  medium:   "주의",
  low:      "안전",
};

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  massacre:     { label: "학살·인권", color: "#7F1D1D", bg: "#FEE2E2" },
  disaster:     { label: "재난·사고", color: "#7C2D12", bg: "#FFEDD5" },
  political:    { label: "정치",      color: "#1E3A8A", bg: "#DBEAFE" },
  social:       { label: "사회",      color: "#1E40AF", bg: "#EFF6FF" },
  human_rights: { label: "인권·민주", color: "#6B21A8", bg: "#F3E8FF" },
  memorial:     { label: "기념일",    color: "#065F46", bg: "#D1FAE5" },
  independence: { label: "독립·광복", color: "#0F766E", bg: "#CCFBF1" },
  labor:        { label: "노동",      color: "#92400E", bg: "#FEF3C7" },
  celebration:  { label: "경축",      color: "#047857", bg: "#D1FAE5" },
  commercial:   { label: "상업",      color: "#0369A1", bg: "#E0F2FE" },
};

function RiskBadge({ level }: { level: string }) {
  const color = RISK_COLOR[level] ?? "#9CA3AF";
  const label = RISK_LABEL[level] ?? level;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: "6px",
      background: color + "18",
      color: color,
      letterSpacing: "0.01em",
    }}>
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const c = CAT[category] ?? { label: category, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span style={{
      display: "inline-block",
      whiteSpace: "nowrap",
      padding: "3px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: c.color,
      background: c.bg,
    }}>
      {c.label}
    </span>
  );
}

export default function NewsQueuePage() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/events?status=pending_review")
      .then((r) => r.json())
      .then((data: PendingEvent[]) => {
        // API may return {month, day} or just {date}; normalise missing fields
        const normalised = data.map((e) => ({
          ...e,
          month: e.month ?? (e.date ? parseInt(e.date.split("-")[1] ?? "0", 10) : 0),
          day:   e.day   ?? (e.date ? parseInt(e.date.split("-")[2] ?? "0", 10) : 0),
        }));
        setEvents(normalised);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function decide(id: string, action: "approved" | "archived" | "draft") {
    setDeciding(id);
    try {
      await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeciding(null);
    }
  }

  const triggerCron = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/admin/trigger-news", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTriggerResult(`수집 완료: ${data.eventsCreated ?? 0}건 추가됨`);
        const updated = await fetch("/api/admin/events?status=pending_review");
        const updatedData: PendingEvent[] = await updated.json();
        const normalised = updatedData.map((e) => ({
          ...e,
          month: e.month ?? (e.date ? parseInt(e.date.split("-")[1] ?? "0", 10) : 0),
          day:   e.day   ?? (e.date ? parseInt(e.date.split("-")[2] ?? "0", 10) : 0),
        }));
        setEvents(normalised);
      } else {
        setTriggerResult(`오류: ${data.error ?? "알 수 없는 오류"}`);
      }
    } catch {
      setTriggerResult("오류: 요청 실패");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <AdminGuard>
      <main style={{ minHeight: "100vh", background: "var(--ms-surface, #FAF9F8)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
            <Link
              href="/admin"
              style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none", flexShrink: 0 }}
            >
              ← 관리자
            </Link>

            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--charcoal)",
              margin: 0,
            }}>
              뉴스 승인 큐
            </h1>

            {events.length > 0 && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "22px",
                height: "22px",
                padding: "0 5px",
                borderRadius: "11px",
                background: "#EF4444",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
              }}>
                {events.length}
              </span>
            )}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
              {triggerResult && (
                <span style={{
                  fontSize: "12px",
                  color: triggerResult.startsWith("오류") ? "#DC2626" : "#16A34A",
                  fontWeight: 500,
                }}>
                  {triggerResult}
                </span>
              )}
              <button
                onClick={triggerCron}
                disabled={triggering}
                style={{
                  padding: "8px 16px",
                  background: triggering ? "var(--ms-surface-3)" : "var(--charcoal, #1C1C1C)",
                  color: triggering ? "var(--muted-ink)" : "#fff",
                  border: "none",
                  borderRadius: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: triggering ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {triggering ? "수집 중…" : "뉴스 수동 수집"}
              </button>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <p style={{ color: "var(--muted-ink)", fontSize: "14px" }}>불러오는 중…</p>
          ) : events.length === 0 ? (
            <div style={{
              padding: "56px 48px",
              textAlign: "center",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid var(--ms-border)",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.35 }}>📋</div>
              <p style={{ color: "var(--muted-ink)", fontSize: "14px", margin: 0 }}>
                검토 대기 중인 이벤트가 없습니다.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {events.map((event) => {
                const leftColor = RISK_COLOR[event.risk_level] ?? "#E1DFDD";
                const isProcessing = deciding === event.id;
                return (
                  <div
                    key={event.id}
                    style={{
                      background: "#fff",
                      border: "1px solid var(--ms-border)",
                      borderLeft: `4px solid ${leftColor}`,
                      borderRadius: "12px",
                      padding: "18px 22px",
                      opacity: isProcessing ? 0.55 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {/* Top row: badges + date + source */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <RiskBadge level={event.risk_level} />
                        <span style={{ fontSize: "13px", color: "var(--muted-ink)", fontWeight: 500 }}>
                          {event.month > 0 && event.day > 0
                            ? `${event.month}월 ${event.day}일`
                            : event.date}
                        </span>
                        <CategoryBadge category={event.category} />
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted-ink)", flexShrink: 0 }}>
                        {event.source === "naver_auto" ? "네이버 자동" : "수동 입력"}
                      </span>
                    </div>

                    {/* Title */}
                    <p style={{
                      fontWeight: 700,
                      fontSize: "15px",
                      margin: "0 0 6px",
                      color: "var(--charcoal)",
                      lineHeight: 1.4,
                    }}>
                      {event.name}
                    </p>

                    {/* Summary (2-line clamp) */}
                    {event.summary && (
                      <p style={{
                        fontSize: "13px",
                        color: "var(--muted-ink)",
                        lineHeight: 1.65,
                        margin: "0 0 16px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {event.summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "7px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => decide(event.id, "draft")}
                        disabled={isProcessing}
                        style={{
                          fontSize: "12px",
                          padding: "6px 14px",
                          borderRadius: "7px",
                          border: "1px solid var(--ms-border)",
                          background: "#fff",
                          color: "var(--muted-ink)",
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          fontWeight: 500,
                        }}
                      >
                        대기로
                      </button>
                      <button
                        onClick={() => decide(event.id, "approved")}
                        disabled={isProcessing}
                        style={{
                          fontSize: "12px",
                          padding: "6px 14px",
                          borderRadius: "7px",
                          border: "none",
                          background: "#16A34A",
                          color: "#fff",
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          fontWeight: 700,
                        }}
                      >
                        승인 ✓
                      </button>
                      <button
                        onClick={() => decide(event.id, "archived")}
                        disabled={isProcessing}
                        style={{
                          fontSize: "12px",
                          padding: "6px 14px",
                          borderRadius: "7px",
                          border: "1px solid #FCA5A5",
                          background: "#FEF2F2",
                          color: "#DC2626",
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          fontWeight: 700,
                        }}
                      >
                        삭제 ✗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
