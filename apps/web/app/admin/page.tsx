import Link from "next/link";

const CARD_STYLE = {
  display: "block",
  padding: "24px",
  background: "#fff",
  border: "1px solid var(--border-warm)",
  borderRadius: "12px",
  textDecoration: "none",
  color: "var(--charcoal)",
  transition: "box-shadow 0.15s",
} as const;

export default function AdminPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "8px" }}>
          관리자
        </h1>
        <p style={{ color: "var(--muted-ink)", fontSize: "14px", marginBottom: "32px" }}>Nunchi Beta 관리 패널</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          <Link href="/admin/events" style={CARD_STYLE}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📅</div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>이벤트 관리</div>
            <div style={{ fontSize: "13px", color: "var(--muted-ink)" }}>민감일 CRUD (상태·출처 관리)</div>
          </Link>
          <Link href="/admin/news-queue" style={CARD_STYLE}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📰</div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>뉴스 승인 큐</div>
            <div style={{ fontSize: "13px", color: "var(--muted-ink)" }}>자동 수집 이벤트 검토·승인</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
