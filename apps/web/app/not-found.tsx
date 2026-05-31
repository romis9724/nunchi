import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-body)" }}>
      <AppHeader />
      <main style={{
        maxWidth: "640px", margin: "0 auto",
        padding: "120px 24px",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(4rem, 14vw, 9rem)",
          fontWeight: 900,
          color: "var(--brand-red)",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          marginBottom: "24px",
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 900,
          color: "var(--ms-text)",
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}>
          페이지를 찾을 수 없습니다
        </h1>
        <p style={{
          fontSize: "15px", color: "var(--ms-text-2)",
          lineHeight: 1.7, margin: "0 0 36px",
        }}>
          요청하신 페이지가 이동했거나 삭제되었을 수 있습니다.<br />
          홈 또는 캠페인 검토 페이지에서 다시 시도해주세요.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--brand-red)", color: "#fff",
            fontWeight: 700, fontSize: "14px",
            padding: "13px 22px", borderRadius: "10px",
            textDecoration: "none",
            boxShadow: "0 6px 16px rgba(225, 29, 72, 0.22), 0 0 0 1px var(--brand-red-dark)",
          }}>
            홈으로 <span style={{ fontSize: "16px" }}>→</span>
          </Link>
          <Link href="/calendar" style={{
            display: "inline-flex", alignItems: "center",
            background: "#fff", color: "var(--ms-text)",
            fontWeight: 600, fontSize: "14px",
            padding: "13px 20px", borderRadius: "10px",
            textDecoration: "none",
            border: "1.5px solid var(--ms-border)",
          }}>
            리스크 캘린더
          </Link>
        </div>
      </main>
    </div>
  );
}
