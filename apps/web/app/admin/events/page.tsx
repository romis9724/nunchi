"use client";
import { AdminGuard } from "@/components/AdminGuard";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Event {
  id: string;
  date: string;
  name: string;
  category: string;
  risk_level: string;
  status: string;
}

// DB 값 → 화면 표시
const RISK_LABEL: Record<string, string> = {
  critical: "즉각 회피",
  high:     "재검토",
  medium:   "주의",
  low:      "안전",
};
const RISK_COLOR: Record<string, string> = {
  critical: "#C50F1F",
  high:     "#BC4B09",
  medium:   "#CA8A04",
  low:      "#107C10",
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

function Badge({ category }: { category: string }) {
  const c = CAT[category] ?? { label: category, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span style={{
      display: "inline-block", whiteSpace: "nowrap",
      padding: "2px 8px", borderRadius: "10px",
      fontSize: "12px", fontWeight: 600,
      color: c.color, background: c.bg,
    }}>
      {c.label}
    </span>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // 승인된 이벤트만 로드
    fetch("/api/admin/events?status=approved")
      .then(r => r.json())
      .then((data: Event[]) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function changeStatus(id: string, newStatus: string) {
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    // 승인 외 상태로 변경되면 목록에서 제거
    setEvents(prev => prev.filter(e => e.id !== id || newStatus === "approved"));
  }

  const visible = events.filter(e =>
    search === "" || e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <div style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)" }}>
        <AppHeader />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>

          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/admin" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 관리자</Link>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>
                이벤트 관리
              </h1>
              <span style={{ fontSize: "12px", color: "var(--muted-ink)", background: "#fff", border: "1px solid var(--border-warm)", borderRadius: "12px", padding: "2px 10px" }}>
                승인 {visible.length}건
              </span>
            </div>
            <Link href="/admin/news-queue"
              style={{ fontSize: "13px", color: "var(--brand-red)", textDecoration: "none", fontWeight: 600, padding: "6px 14px", border: "1px solid var(--brand-red-mid)", borderRadius: "6px", background: "var(--brand-red-soft)" }}>
              검토 대기 →
            </Link>
          </div>

          {/* 검색 */}
          <input
            type="text"
            placeholder="이슈 검색…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-warm)", borderRadius: "8px", fontSize: "13px", background: "#fff", color: "var(--charcoal)", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
          />

          {/* 테이블 */}
          {loading ? (
            <p style={{ color: "var(--muted-ink)" }}>불러오는 중…</p>
          ) : (
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--border-warm)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-warm)", background: "#FAFAF8" }}>
                    {["날짜", "이슈", "카테고리", "위험도", "상태 변경"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted-ink)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(event => (
                    <tr key={event.id} style={{ borderBottom: "1px solid var(--border-warm)" }}>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap", color: "var(--muted-ink)", fontSize: "12px" }}>
                        {event.date}
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 500, maxWidth: "340px" }}>
                        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {event.name}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                        <Badge category={event.category} />
                      </td>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ color: RISK_COLOR[event.risk_level] ?? "#666", fontWeight: 700, fontSize: "12px" }}>
                          {RISK_LABEL[event.risk_level] ?? event.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => changeStatus(event.id, "pending_review")}
                            style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #F59E0B", background: "#FFFBEB", color: "#92400E", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                          >
                            대기
                          </button>
                          <button
                            onClick={() => { if (confirm(`"${event.name.slice(0,20)}…" 을 삭제하시겠습니까?`)) changeStatus(event.id, "archived"); }}
                            style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--muted-ink)" }}>
                        {search ? `"${search}" 검색 결과가 없습니다.` : "승인된 이벤트가 없습니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
