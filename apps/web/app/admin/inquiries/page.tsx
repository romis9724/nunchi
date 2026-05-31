"use client";
import { AdminGuard } from "@/components/AdminGuard";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  replied?: boolean;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then(r => r.json())
      .then((data: Inquiry[]) => { setInquiries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openReply = (inquiry: Inquiry) => {
    setSelected(inquiry);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/inquiries/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: selected.id, to: selected.email, name: selected.name, message: replyText }),
      });
      if (res.ok) {
        setSentIds(prev => new Set([...prev, selected.id]));
        setSelected(null);
        setReplyText("");
      }
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <AdminGuard>
      <div style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)" }}>
        <AppHeader />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <Link href="/admin" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 관리자</Link>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>문의 관리</h1>
            <span style={{ fontSize: "12px", color: "var(--muted-ink)", background: "#fff", border: "1px solid var(--border-warm)", borderRadius: "12px", padding: "2px 10px" }}>
              {inquiries.length}건
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "16px", alignItems: "start" }}>
            {/* 목록 */}
            <div>
              {loading ? (
                <p style={{ color: "var(--muted-ink)", padding: "24px" }}>불러오는 중…</p>
              ) : inquiries.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid var(--border-warm)" }}>
                  <p style={{ fontSize: "32px", margin: "0 0 12px" }}>📭</p>
                  <p style={{ color: "var(--muted-ink)" }}>아직 문의가 없습니다.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {inquiries.map(inq => (
                    <button
                      key={inq.id}
                      onClick={() => openReply(inq)}
                      style={{
                        width: "100%", textAlign: "left", cursor: "pointer",
                        background: selected?.id === inq.id ? "var(--ms-blue-light)" : "#fff",
                        border: `1px solid ${selected?.id === inq.id ? "var(--ms-blue-mid)" : "var(--border-warm)"}`,
                        borderRadius: "10px", padding: "16px 20px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--charcoal)" }}>{inq.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--muted-ink)" }}>{inq.email}</span>
                          {sentIds.has(inq.id) && (
                            <span style={{ fontSize: "12px", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", padding: "1px 8px", fontWeight: 600 }}>답장 완료</span>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--muted-ink)", whiteSpace: "nowrap", marginLeft: "8px" }}>
                          {formatDate(inq.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--muted-ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inq.message}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 답장 패널 */}
            {selected && (
              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--border-warm)", padding: "24px", position: "sticky", top: "80px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--charcoal)" }}>
                    {selected.name}에게 답장
                  </h3>
                  <button onClick={() => setSelected(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--muted-ink)", lineHeight: 1 }}>×</button>
                </div>

                {/* 원문 */}
                <div style={{ background: "var(--rice-paper, #F8F7F4)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted-ink)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>원문 문의</p>
                  <p style={{ fontSize: "13px", color: "var(--charcoal)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{selected.message}</p>
                </div>

                {/* 수신 정보 */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted-ink)" }}>수신:</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--charcoal)" }}>{selected.email}</span>
                </div>

                {/* 답장 입력 */}
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="답장 내용을 입력하세요…"
                  rows={8}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border-warm)", borderRadius: "8px", fontSize: "13px", color: "var(--charcoal)", background: "#FAFAF8", outline: "none", resize: "vertical", fontFamily: "var(--font-body)", lineHeight: 1.7, boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "var(--ms-blue)"}
                  onBlur={e => e.target.style.borderColor = "var(--border-warm)"}
                />

                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  style={{ width: "100%", marginTop: "12px", padding: "11px", background: "var(--ms-blue)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: (sending || !replyText.trim()) ? "not-allowed" : "pointer", opacity: (sending || !replyText.trim()) ? 0.6 : 1 }}
                >
                  {sending ? "전송 중…" : "답장 보내기 →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
