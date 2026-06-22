"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

/**
 * 관리자 페이지 클라이언트 가드(UX 용). 세션의 role 을 확인해 비관리자를 홈으로 보낸다.
 * 데이터 접근의 최종 권위는 서버의 requireAdmin 가드(/api/admin/*)이며, 이 컴포넌트는
 * 비관리자에게 관리자 UI 셸을 노출하지 않기 위한 보조 장치다.
 */
export function AdminGuard({ children }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const denied = status === "authenticated" && session?.user?.role !== "admin";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }
    if (denied) {
      const t = setTimeout(() => router.replace("/"), 2000);
      return () => clearTimeout(t);
    }
  }, [status, denied, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rice-paper, #F8F7F4)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "28px", height: "28px", border: "3px solid var(--ms-border)", borderTopColor: "var(--brand-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "13px", color: "var(--muted-ink)" }}>권한 확인 중…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || denied) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rice-paper, #F8F7F4)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "32px", margin: "0 0 12px" }}>🚫</p>
          <p style={{ fontSize: "15px", color: "var(--charcoal)", fontWeight: 600, margin: "0 0 6px" }}>관리자 권한이 필요합니다</p>
          <p style={{ fontSize: "13px", color: "var(--muted-ink)" }}>잠시 후 메인 페이지로 이동합니다…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
