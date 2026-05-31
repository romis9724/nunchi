"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    const supabase = getSupabase();

    // Supabase JS v2 PKCE: getSession()이 URL의 code를 감지해 자동 교환
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session) {
        setMessage("오류가 발생했습니다. 이동 중...");
        router.push("/auth/error");
        return;
      }

      // 온보딩 완료 여부 확인
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed_at")
          .eq("id", session.user.id)
          .single();

        if (profile?.onboarding_completed_at) {
          router.push("/check");
        } else {
          router.push("/onboarding");
        }
      } catch {
        router.push("/onboarding");
      }
    });
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rice-paper, #F8F7F4)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid var(--ms-border)", borderTopColor: "var(--brand-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--muted-ink)", fontSize: "15px" }}>{message}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  );
}
