"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NoonchiLogo } from "./NoonchiLogo";
import { getSupabase } from "@/lib/supabase";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { Icon } from "./ui/Icon";

interface User {
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

const NAV: { label: string; href: string }[] = [
  { label: "캠페인 검토", href: "/check" },
  { label: "리스크 캘린더", href: "/calendar" },
  { label: "문의하기", href: "/contact" },
];

const MOBILE_BREAKPOINT = 880;

export function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // 라우트 변경 시 모바일 드로어 자동 닫기
  useEffect(() => {
    setMobileNavOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // 드로어 열려 있을 때 body scroll lock
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        style={{
          borderBottom: "1px solid var(--ms-border)",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 20px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* 로고 */}
          <Link href="/" style={{ textDecoration: "none", color: "var(--ms-text)", flexShrink: 0 }}>
            <NoonchiLogo size={30} />
          </Link>

          {/* ─── 데스크탑 nav (>= 880px) ─── */}
          <nav className="appheader-desktop-nav" style={{ display: "flex", gap: "2px", alignItems: "center" }}>
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "13.5px",
                  fontWeight: isActive(href) ? 700 : 500,
                  color: isActive(href) ? "var(--brand-red)" : "var(--ms-text-2)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: isActive(href) ? "var(--brand-red-soft)" : "transparent",
                  transition: "all 0.12s var(--ease-out)",
                  letterSpacing: "-0.005em",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            ))}

            <div style={{ width: "1px", height: "20px", background: "var(--ms-border)", margin: "0 8px" }} />

            {user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
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
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "var(--brand-red)", color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 800,
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  {displayName}
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#fff", border: "1px solid var(--ms-border)",
                    borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
                    minWidth: "180px", overflow: "hidden", zIndex: 50,
                  }}>
                    <Link href="/mypage" onClick={() => setUserMenuOpen(false)} style={{
                      display: "block", padding: "12px 16px", fontSize: "13px",
                      color: "var(--ms-text)", textDecoration: "none", fontWeight: 500,
                    }}>내 정보</Link>
                    <div style={{ height: "1px", background: "var(--ms-border)" }} />
                    <button onClick={handleLogout} style={{
                      display: "block", width: "100%", padding: "12px 16px",
                      fontSize: "13px", color: "var(--brand-red)",
                      textAlign: "left", background: "none", border: "none",
                      cursor: "pointer", fontWeight: 600,
                    }}>로그아웃</button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontSize: "13.5px", fontWeight: 700,
                  background: "var(--brand-red)", color: "#fff",
                  padding: "9px 18px", borderRadius: "10px",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(225, 29, 72, 0.22), 0 0 0 1px var(--brand-red-dark)",
                  transition: "transform 0.12s", whiteSpace: "nowrap",
                }}
              >
                무료로 시작하기 <span style={{ fontSize: "15px" }}>→</span>
              </button>
            )}
          </nav>

          {/* ─── 모바일 햄버거 (< 880px) ─── */}
          <button
            className="appheader-mobile-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileNavOpen}
            style={{
              display: "none",
              alignItems: "center", justifyContent: "center",
              width: "40px", height: "40px",
              background: mobileNavOpen ? "var(--brand-red-soft)" : "#fff",
              border: `1px solid ${mobileNavOpen ? "var(--brand-red-mid)" : "var(--ms-border)"}`,
              borderRadius: "10px",
              color: mobileNavOpen ? "var(--brand-red)" : "var(--ms-text)",
              cursor: "pointer",
              transition: "all 0.15s var(--ease-out)",
              flexShrink: 0,
            }}
          >
            <Icon name={mobileNavOpen ? "x" : "menu"} size={20} />
          </button>
        </div>
      </header>

      {/* ─── 모바일 드로어 ─── */}
      {mobileNavOpen && (
        <div
          className="appheader-mobile-drawer"
          style={{
            position: "fixed",
            top: "68px",
            left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 25,
            display: "none",
            animation: "fadeIn 0.18s var(--ease-out)",
          }}
          onClick={() => setMobileNavOpen(false)}
        >
          <nav
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderBottom: "1px solid var(--ms-border)",
              padding: "12px 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
              animation: "slideDown 0.22s var(--ease-out)",
            }}
          >
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: isActive(href) ? 700 : 500,
                  color: isActive(href) ? "var(--brand-red)" : "var(--ms-text)",
                  textDecoration: "none",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: isActive(href) ? "var(--brand-red-soft)" : "transparent",
                  letterSpacing: "-0.01em",
                  fontFamily: "var(--font-display)",
                }}
              >
                {label}
                <Icon name="arrow-right" size={16} />
              </Link>
            ))}

            <div style={{ height: "1px", background: "var(--ms-border)", margin: "8px 0" }} />

            {user ? (
              <>
                <Link
                  href="/mypage"
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 16px",
                    fontSize: "15px", color: "var(--ms-text)",
                    textDecoration: "none", fontWeight: 600, borderRadius: "10px",
                  }}
                >
                  <span style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "var(--brand-red)", color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 800,
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  {displayName} <span style={{ color: "var(--ms-text-2)", fontWeight: 400, fontSize: "13px" }}>· 내 정보</span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "14px 16px",
                    fontSize: "15px", fontWeight: 600,
                    color: "var(--brand-red)",
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", borderRadius: "10px",
                  }}
                >
                  <Icon name="log-out" size={18} />
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  fontSize: "15px", fontWeight: 700,
                  background: "var(--brand-red)", color: "#fff",
                  padding: "14px 16px", borderRadius: "10px",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(225, 29, 72, 0.22), 0 0 0 1px var(--brand-red-dark)",
                  marginTop: "4px",
                }}
              >
                무료로 시작하기 <span style={{ fontSize: "17px" }}>→</span>
              </button>
            )}

            {/* 모바일 드로어 하단 — 법적 링크 */}
            <div style={{
              display: "flex", gap: "16px", justifyContent: "center",
              paddingTop: "16px", marginTop: "8px",
              borderTop: "1px solid var(--ms-border)",
              fontSize: "12px",
            }}>
              <Link href="/terms" style={{ color: "var(--ms-text-3)", textDecoration: "none", fontWeight: 500 }}>이용약관</Link>
              <Link href="/privacy" style={{ color: "var(--ms-text-3)", textDecoration: "none", fontWeight: 500 }}>개인정보처리방침</Link>
            </div>
          </nav>
        </div>
      )}

      {/* 반응형 스타일 */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
        @media (max-width: ${MOBILE_BREAKPOINT}px) {
          .appheader-desktop-nav { display: none !important; }
          .appheader-mobile-toggle { display: inline-flex !important; }
          .appheader-mobile-drawer { display: block !important; }
        }
      `}</style>
    </>
  );
}
