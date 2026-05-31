"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NoonchiLogo } from "./NoonchiLogo";
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
    <header style={{
      borderBottom: "1px solid var(--ms-border)",
      background: "rgba(255,255,255,0.94)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 20,
    }}>
      <div style={{
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* 로고 */}
        <Link href="/" style={{ textDecoration: "none", color: "var(--ms-text)" }}>
          <NoonchiLogo size={24} />
        </Link>

        {/* 데스크탑 nav */}
        <nav style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          {NAV.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "13.5px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--brand-red)" : "var(--ms-text-2)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: active ? "var(--brand-red-soft)" : "transparent",
                  transition: "all 0.12s var(--ease-out)",
                  letterSpacing: "-0.005em",
                }}
              >
                {label}
              </Link>
            );
          })}

          <div style={{ width: "1px", height: "20px", background: "var(--ms-border)", margin: "0 8px" }} />

          {/* 인증 버튼 */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ms-text)",
                  padding: "6px 12px 6px 6px",
                  borderRadius: "999px",
                  border: "1px solid var(--ms-border)",
                  background: "#fff",
                  cursor: "pointer",
                  transition: "border-color 0.12s",
                }}
              >
                <span style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "var(--brand-red)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 800,
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
                {displayName}
              </button>
              {menuOpen && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#fff",
                  border: "1px solid var(--ms-border)",
                  borderRadius: "12px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
                  minWidth: "180px",
                  overflow: "hidden",
                  zIndex: 50,
                }}>
                  <Link href="/mypage" onClick={() => setMenuOpen(false)} style={{
                    display: "block",
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "var(--ms-text)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}>내 정보</Link>
                  <div style={{ height: "1px", background: "var(--ms-border)" }} />
                  <button onClick={handleLogout} style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "var(--brand-red)",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}>로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13.5px",
                fontWeight: 700,
                background: "var(--brand-red)",
                color: "#fff",
                padding: "9px 18px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(225, 29, 72, 0.22), 0 0 0 1px var(--brand-red-dark)",
                transition: "transform 0.12s",
              }}
            >
              무료로 시작하기
              <span style={{ fontSize: "15px" }}>→</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
