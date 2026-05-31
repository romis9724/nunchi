"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NunchiLogo } from "./NunchiLogo";
import { getSupabase } from "@/lib/supabase";
import { signInWithGoogle, signOut } from "@/lib/auth";

interface User {
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

const NAV: { label: string; href: string }[] = [
  { label: "캠페인 검토", href: "/check" },
  { label: "리스크 캘린더", href: "/calendar" },
  { label: "문의하기", href: "/contact" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const result = await signInWithGoogle({ origin: window.location.origin });
    if (result.url) window.location.href = result.url;
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await signOut(undefined, supabase as Parameters<typeof signOut>[1]);
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";

  return (
    <header style={{ borderBottom: "1px solid var(--ms-border)", background: "rgba(250,249,248,0.96)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 20 }}>
      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* 로고 */}
        <Link href="/" style={{ textDecoration: "none", color: "var(--ms-text)" }}>
          <NunchiLogo size={22} />
        </Link>

        {/* 데스크탑 nav */}
        <nav style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {NAV.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--ms-blue)" : "var(--ms-text-2)",
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid",
                  borderColor: active ? "var(--ms-blue-mid)" : "var(--ms-border)",
                  background: active ? "var(--ms-blue-light)" : "#fff",
                  transition: "all 0.12s",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* 인증 버튼 */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--ms-text)", padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--ms-border)", background: "#fff", cursor: "pointer" }}
              >
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--ms-blue)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
                {displayName}
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", border: "1px solid var(--ms-border)", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: "140px", overflow: "hidden", zIndex: 50 }}>
                  <button onClick={handleLogout} style={{ display: "block", width: "100%", padding: "10px 14px", fontSize: "13px", color: "var(--ms-red, #D13438)", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{ fontSize: "13px", fontWeight: 600, background: "var(--ms-blue)", color: "#fff", padding: "7px 16px", borderRadius: "4px", border: "none", cursor: "pointer" }}
            >
              Google 로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
