"use client";

import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";
import { AppHeader } from "@/components/AppHeader";
import { PageHeader, Card } from "@/components/ui";

const ADMIN_TILES = [
  { href: "/admin/events", icon: "📅", title: "이벤트 관리", desc: "민감일 CRUD · 상태·출처 관리" },
  { href: "/admin/news-queue", icon: "📰", title: "뉴스 승인 큐", desc: "자동 수집 이벤트 검토·승인" },
  { href: "/admin/users", icon: "👥", title: "베타 유저", desc: "가입자 목록·역할 관리" },
  { href: "/admin/inquiries", icon: "✉️", title: "문의 관리", desc: "문의 확인·이메일 답장" },
] as const;

export default function AdminPage() {
  return (
    <AdminGuard>
    <div style={{ minHeight: "100vh", background: "var(--ms-surface)", fontFamily: "var(--font-body)" }}>
      <AppHeader />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        <PageHeader
          eyebrow="관리자"
          eyebrowIcon="lock"
          title={<>noonch-i <span style={{ color: "var(--brand-red)" }}>관리 패널</span></>}
          subtitle="이벤트·유저·문의·뉴스 큐를 한곳에서 관리합니다."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {ADMIN_TILES.map((tile) => (
            <Link key={tile.href} href={tile.href} style={{ textDecoration: "none" }}>
              <Card padding="lg" tone="default" style={{
                display: "flex", flexDirection: "column", gap: "10px",
                transition: "transform 0.15s, border-color 0.15s",
                cursor: "pointer", height: "100%",
              }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "10px",
                  background: "var(--brand-red-soft)", border: "1px solid var(--brand-red-mid)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px",
                }}>{tile.icon}</div>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800, fontSize: "16px",
                  color: "var(--ms-text)", letterSpacing: "-0.01em",
                }}>{tile.title}</div>
                <div style={{ fontSize: "13px", color: "var(--ms-text-2)", lineHeight: 1.5 }}>
                  {tile.desc}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
    </AdminGuard>
  );
}
