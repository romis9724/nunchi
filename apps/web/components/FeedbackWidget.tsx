"use client";

import { useState } from "react";

type FeedbackType = "bug" | "suggestion" | "praise";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "🐛 버그 신고",
  suggestion: "💡 기능 제안",
  praise: "👍 칭찬하기",
};

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text }),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
        setText("");
      }, 2000);
    } catch {
      // silent: feedback failure should not disrupt the user
    }
    setSending(false);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="피드백"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 100,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "var(--brand-red)",
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 16px rgba(0,120,212,0.35)",
          cursor: "pointer",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.15s",
        }}
      >
        {open ? "×" : "💬"}
      </button>

      {/* 패널 */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "84px",
            right: "24px",
            zIndex: 100,
            width: "300px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid var(--ms-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--ms-border)",
              background: "var(--brand-red-soft)",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--ms-text)" }}>
              피드백 보내기
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ms-text-2)" }}>
              베타 기간 소중한 의견 감사합니다
            </p>
          </div>

          {sent ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: "24px", margin: "0 0 8px" }}>✅</p>
              <p style={{ fontSize: "14px", color: "var(--ms-text)", margin: 0 }}>
                전송됐습니다. 감사합니다!
              </p>
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                {(["bug", "suggestion", "praise"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      flex: 1,
                      fontSize: "12px",
                      padding: "5px 4px",
                      borderRadius: "4px",
                      border: "1px solid",
                      cursor: "pointer",
                      borderColor: type === t ? "var(--brand-red)" : "var(--ms-border)",
                      background: type === t ? "var(--brand-red-soft)" : "#fff",
                      color: type === t ? "var(--brand-red)" : "var(--ms-text-2)",
                      fontWeight: type === t ? 600 : 400,
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="자세한 내용을 적어주세요…"
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1.5px solid var(--ms-border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "var(--ms-text)",
                  background: "#FAFAF8",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                onClick={submit}
                disabled={sending || !text.trim()}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  background: "var(--brand-red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: sending || !text.trim() ? 0.6 : 1,
                }}
              >
                {sending ? "전송 중…" : "보내기"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
