"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Event {
  id: string;
  date: string;
  name: string;
  category: string;
  risk_level: string;
  status: string;
  source: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data: Event[]) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  }

  const filtered = filter === "all" ? events : events.filter((e) => e.status === filter);

  const STATUS_COLOR: Record<string, string> = {
    draft: "#9CA3AF",
    pending_review: "#F59E0B",
    approved: "#16A34A",
    archived: "#6B7280",
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <Link href="/admin" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 관리자</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>이벤트 관리</h1>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {["all", "approved", "pending_review", "draft", "archived"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                borderColor: filter === s ? "var(--charcoal)" : "var(--border-warm)",
                background: filter === s ? "var(--charcoal)" : "#fff",
                color: filter === s ? "#fff" : "var(--muted-ink)" }}>
              {s === "all" ? "전체" : s}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted-ink)" }}>불러오는 중…</p>
        ) : (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--border-warm)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-warm)", background: "#FAFAF8" }}>
                  {["날짜", "이름", "카테고리", "위험도", "상태", "출처", "액션"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted-ink)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} style={{ borderBottom: "1px solid var(--border-warm)" }}>
                    <td style={{ padding: "12px 16px" }}>{event.date}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{event.name}</td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-ink)" }}>{event.category}</td>
                    <td style={{ padding: "12px 16px" }}>{event.risk_level}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: STATUS_COLOR[event.status] + "20", color: STATUS_COLOR[event.status] }}>
                        {event.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-ink)" }}>{event.source}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={event.status}
                        onChange={(e) => updateStatus(event.id, e.target.value)}
                        style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-warm)", background: "#fff", cursor: "pointer" }}
                      >
                        {["draft", "pending_review", "approved", "archived"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--muted-ink)" }}>이벤트가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
