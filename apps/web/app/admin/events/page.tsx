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

const RISK_COLOR: Record<string, string> = {
  critical: "#C50F1F",
  high: "#BC4B09",
  medium: "#CA8A04",
  low: "#107C10",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "#9CA3AF",
  pending_review: "#F59E0B",
  approved: "#16A34A",
  archived: "#6B7280",
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

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

  const filtered = events.filter((e) =>
    (filter === "all" || e.status === filter) &&
    (search === "" || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminGuard>
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <Link href="/admin" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 관리자</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>이벤트 관리</h1>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "전체", count: events.length, color: "var(--charcoal)" },
            { label: "승인됨", count: events.filter((e) => e.status === "approved").length, color: "#107C10" },
            { label: "검토 대기", count: events.filter((e) => e.status === "pending_review").length, color: "#BC4B09" },
            { label: "보관됨", count: events.filter((e) => e.status === "archived").length, color: "#8A8886" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid var(--border-warm)", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color, margin: "0 0 4px" }}>{count}</p>
              <p style={{ fontSize: "12px", color: "var(--muted-ink)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* 검색/필터 바 */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="이벤트 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border-warm)", borderRadius: "6px", fontSize: "13px", background: "#fff", color: "var(--charcoal)", outline: "none" }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid var(--border-warm)", borderRadius: "6px", fontSize: "13px", background: "#fff", color: "var(--charcoal)", cursor: "pointer" }}
          >
            <option value="all">전체</option>
            <option value="approved">승인됨</option>
            <option value="pending_review">검토 대기</option>
            <option value="draft">임시저장</option>
            <option value="archived">보관됨</option>
          </select>
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
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: RISK_COLOR[event.risk_level] ?? "#666", fontWeight: 600 }}>
                        {event.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: (STATUS_COLOR[event.status] ?? "#9CA3AF") + "20", color: STATUS_COLOR[event.status] ?? "#9CA3AF" }}>
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
    </AdminGuard>
  );
}
