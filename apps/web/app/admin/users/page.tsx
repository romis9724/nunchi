"use client";
import { AdminGuard } from "@/components/AdminGuard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

interface BetaUser {
  id: string;
  email: string;
  role: string;
  industries: string[];
  channels: string[];
  onboarding_completed_at: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then((data: BetaUser[]) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const setRole = async (id: string, role: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const stats = {
    total: users.length,
    onboarded: users.filter(u => u.onboarding_completed_at).length,
    admins: users.filter(u => u.role === "admin").length,
  };

  return (
    <AdminGuard>
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)" }}>
      <AppHeader />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <Link href="/admin" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 관리자</Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>베타 유저 관리</h1>
        </div>

        {/* 통계 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "전체 가입자", count: stats.total, color: "var(--ms-blue)" },
            { label: "온보딩 완료", count: stats.onboarded, color: "#107C10" },
            { label: "관리자", count: stats.admins, color: "#8764B8" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid var(--ms-border)", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color, margin: "0 0 4px" }}>{count}</p>
              <p style={{ fontSize: "12px", color: "var(--muted-ink)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted-ink)" }}>불러오는 중…</p>
        ) : (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--ms-border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ms-border)", background: "#FAFAF8" }}>
                  {["이메일", "역할", "온보딩", "업종", "채널", "가입일", "권한 변경"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted-ink)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--ms-border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{user.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: user.role === "admin" ? "#EDE7F6" : "var(--ms-blue-light)", color: user.role === "admin" ? "#5E35B1" : "var(--ms-blue)" }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {user.onboarding_completed_at
                        ? <span style={{ color: "#107C10", fontWeight: 600 }}>✓ 완료</span>
                        : <span style={{ color: "var(--muted-ink)" }}>미완료</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-ink)" }}>{user.industries?.slice(0,2).join(", ") || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-ink)" }}>{user.channels?.slice(0,2).join(", ") || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "var(--muted-ink)", whiteSpace: "nowrap" }}>
                      {new Date(user.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select value={user.role} onChange={e => setRole(user.id, e.target.value)}
                        style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--ms-border)", background: "#fff", cursor: "pointer" }}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--muted-ink)" }}>등록된 유저가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
    </AdminGuard>
  );
}
