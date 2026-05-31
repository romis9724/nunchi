"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PendingEvent {
  id: string;
  date: string;
  name: string;
  category: string;
  risk_level: string;
  summary: string;
  source: string;
}

export default function NewsQueuePage() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/events?status=pending_review")
      .then((r) => r.json())
      .then((data: PendingEvent[]) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function decide(id: string, action: "approved" | "archived") {
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const RISK_COLOR: Record<string, string> = {
    critical: "#DC2626", high: "#EA580C", medium: "#CA8A04", low: "#16A34A",
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <Link href="/admin" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 관리자</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>
            뉴스 승인 큐
          </h1>
          {events.length > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
              {events.length}
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted-ink)" }}>불러오는 중…</p>
        ) : events.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid var(--border-warm)" }}>
            <p style={{ color: "var(--muted-ink)", fontSize: "15px" }}>검토 대기 중인 이벤트가 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {events.map((event) => (
              <div key={event.id} style={{ background: "#fff", border: "1px solid var(--border-warm)", borderRadius: "12px", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted-ink)", fontWeight: 500 }}>{event.date}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "8px", background: (RISK_COLOR[event.risk_level] ?? "#9CA3AF") + "20", color: RISK_COLOR[event.risk_level] ?? "#9CA3AF" }}>
                        {event.risk_level}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--muted-ink)" }}>{event.category}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--charcoal)", margin: "0 0 6px" }}>{event.name}</p>
                    {event.summary && (
                      <p style={{ fontSize: "13px", color: "var(--muted-ink)", margin: 0, lineHeight: 1.6 }}>{event.summary}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => decide(event.id, "approved")}
                      style={{ padding: "8px 16px", background: "#16A34A", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                    >
                      승인
                    </button>
                    <button
                      onClick={() => decide(event.id, "archived")}
                      style={{ padding: "8px 16px", background: "#fff", color: "#6B7280", border: "1px solid var(--border-warm)", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                    >
                      거부
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
