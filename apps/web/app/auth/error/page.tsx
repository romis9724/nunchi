import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rice-paper, #F8F7F4)" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "var(--charcoal)", marginBottom: "12px" }}>
          로그인에 실패했습니다
        </h1>
        <p style={{ color: "var(--muted-ink)", fontSize: "15px", marginBottom: "24px" }}>
          Google 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.
        </p>
        <Link
          href="/"
          style={{ display: "inline-block", padding: "10px 24px", background: "var(--charcoal)", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
