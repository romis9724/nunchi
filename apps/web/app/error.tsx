"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-body)", padding: "120px 24px" }}>
      <main style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: "64px", height: "64px",
          borderRadius: "16px", background: "var(--brand-red-soft)",
          border: "1px solid var(--brand-red-mid)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "32px",
        }}>
          ⚠️
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 900,
          color: "var(--ms-text)",
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}>
          예상치 못한 오류가 발생했습니다
        </h1>
        <p style={{
          fontSize: "15px", color: "var(--ms-text-2)",
          lineHeight: 1.7, margin: "0 0 32px",
        }}>
          잠시 후 다시 시도해주세요. 문제가 지속되면 문의해주세요.
        </p>
        {error.digest && (
          <p style={{
            fontSize: "12px", color: "var(--ms-text-3)",
            fontFamily: "monospace", marginBottom: "24px",
            padding: "8px 14px", background: "var(--ms-surface)",
            borderRadius: "6px", display: "inline-block",
          }}>
            오류 ID: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              background: "var(--brand-red)", color: "#fff",
              fontWeight: 700, fontSize: "14px",
              padding: "13px 22px", borderRadius: "10px",
              border: "none", cursor: "pointer",
              boxShadow: "0 6px 16px rgba(225, 29, 72, 0.22), 0 0 0 1px var(--brand-red-dark)",
            }}
          >
            다시 시도
          </button>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center",
            background: "#fff", color: "var(--ms-text)",
            fontWeight: 600, fontSize: "14px",
            padding: "13px 20px", borderRadius: "10px",
            textDecoration: "none",
            border: "1.5px solid var(--ms-border)",
          }}>
            홈으로
          </Link>
        </div>
      </main>
    </div>
  );
}
