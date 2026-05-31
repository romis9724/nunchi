"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

interface Props {
  children: React.ReactNode;
}

export function AdminGuard({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || data?.role !== "admin") {
        setStatus("denied");
        setTimeout(() => router.replace("/"), 2000);
        return;
      }

      setStatus("authorized");
    });
  }, [router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rice-paper, #F8F7F4)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "28px", height: "28px", border: "3px solid var(--ms-border)", borderTopColor: "var(--ms-blue)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "13px", color: "var(--muted-ink)" }}>권한 확인 중…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (status === "denied") {
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
