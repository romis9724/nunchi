"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CONTACT_FORM_FIELDS } from "@/lib/contact-form";

const INPUT_STYLE = {
  width: "100%",
  padding: "12px 16px",
  border: "1.5px solid var(--border-warm)",
  borderRadius: "12px",
  background: "#FFFFFF",
  fontSize: "14px",
  color: "var(--charcoal)",
  outline: "none",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.15s",
  boxSizing: "border-box" as const,
} as const;

const LABEL_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--muted-ink)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const FIELD_ICONS: Record<string, string> = {
  name:    "👤",
  email:   "📧",
  message: "💬",
};

const FAQS = [
  {
    q: "베타 기간 동안 무료인가요?",
    a: "네, 베타 기간 동안은 전면 무료입니다. 요금제는 베타 종료 후 공지됩니다.",
  },
  {
    q: "검토 결과는 얼마나 정확한가요?",
    a: "AI가 한국 역사·사회 맥락 DB와 교차 검토합니다. 참고용으로 활용하시고, 최종 결정은 팀 내부에서 검토 후 진행하세요.",
  },
  {
    q: "입력한 카피가 외부에 공유되나요?",
    a: "절대 공유되지 않습니다. 검토 결과는 캐싱 목적으로만 저장되며, 제3자에게 제공하지 않습니다.",
  },
  {
    q: "API 연동이 가능한가요?",
    a: "베타 이후 API 플랜 제공 예정입니다. 관심 있으시면 문의 폼으로 남겨주세요.",
  },
];

type FormState = { name: string; email: string; message: string };
type Status = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "문의 전송 중 오류가 발생했습니다.");
      }
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  const isSubmitting = status === "submitting";
  const canSubmit =
    !isSubmitting &&
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.message.trim().length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--warm-white)", fontFamily: "var(--font-body)" }}>
      <AppHeader />

      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "48px 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          alignItems: "start",
        }}
        className="rg-2"
      >
        {/* Left: page header + form */}
        <div>
          {/* Page header */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--muted-ink)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}>
              <span>✉</span> 문의하기
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px,4vw,32px)",
              fontWeight: 800,
              color: "var(--charcoal)",
              letterSpacing: "-0.03em",
              margin: "0 0 8px",
            }}>
              문의 및 피드백
            </h1>
            <p style={{ fontSize: "14px", color: "var(--muted-ink)", lineHeight: 1.6, margin: 0 }}>
              질문, 제안, 파트너십 문의 — 무엇이든 보내주세요.
              <br />
              로그인 없이 누구나 문의할 수 있습니다.
            </p>
          </div>

          {/* Success state */}
          {status === "success" ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: "48px 32px",
                borderRadius: "16px",
                border: "1px solid var(--border-warm)",
                background: "#F6FAF3",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--charcoal)",
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}>
                문의가 접수되었습니다
              </h3>
              <p style={{ color: "var(--muted-ink)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px" }}>
                빠른 시일 내에 이메일로 답변 드리겠습니다.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                style={{
                  fontSize: "13px",
                  padding: "9px 22px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-warm)",
                  background: "#fff",
                  color: "var(--charcoal)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                }}
              >
                새 문의하기
              </button>
            </div>
          ) : (
            /* Form card */
            <div className="studio-card" style={{ padding: "32px", marginBottom: "32px" }}>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                noValidate
              >
                {/* Name field */}
                <div>
                  <label htmlFor="name" style={LABEL_STYLE}>
                    <span>{FIELD_ICONS[CONTACT_FORM_FIELDS[0].name]}</span>
                    {CONTACT_FORM_FIELDS[0].label}
                    <span style={{ color: "var(--coral)", marginLeft: "2px" }}>*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type={CONTACT_FORM_FIELDS[0].type}
                    required={CONTACT_FORM_FIELDS[0].required}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="홍길동"
                    maxLength={100}
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
                  />
                </div>

                {/* Email field */}
                <div>
                  <label htmlFor="email" style={LABEL_STYLE}>
                    <span>{FIELD_ICONS[CONTACT_FORM_FIELDS[1].name]}</span>
                    {CONTACT_FORM_FIELDS[1].label}
                    <span style={{ color: "var(--coral)", marginLeft: "2px" }}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type={CONTACT_FORM_FIELDS[1].type}
                    required={CONTACT_FORM_FIELDS[1].required}
                    value={form.email}
                    onChange={handleChange}
                    placeholder="hello@example.com"
                    maxLength={254}
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
                  />
                </div>

                {/* Message field */}
                <div>
                  <label htmlFor="message" style={LABEL_STYLE}>
                    <span>{FIELD_ICONS[CONTACT_FORM_FIELDS[2].name]}</span>
                    {CONTACT_FORM_FIELDS[2].label}
                    <span style={{ color: "var(--coral)", marginLeft: "2px" }}>*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required={CONTACT_FORM_FIELDS[2].required}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="문의 내용을 입력해주세요…"
                    rows={6}
                    maxLength={3000}
                    style={{ ...INPUT_STYLE, resize: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--charcoal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
                  />
                  <p style={{ fontSize: "11px", color: "var(--muted-ink)", textAlign: "right", marginTop: "4px" }}>
                    {form.message.length}/3000
                  </p>
                </div>

                {/* Error */}
                {status === "error" && errorMessage && (
                  <div
                    role="alert"
                    style={{
                      fontSize: "13px",
                      color: "var(--grade-f-text)",
                      background: "var(--grade-f-bg)",
                      border: "1px solid var(--grade-f-border)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    background: canSubmit ? "var(--charcoal)" : "var(--border-warm)",
                    color: canSubmit ? "#FFFFFF" : "var(--muted-ink)",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.01em",
                    transition: "all 0.15s",
                  }}
                >
                  {isSubmitting ? "전송 중…" : (
                    <>
                      문의 보내기
                      <span style={{ fontSize: "16px", lineHeight: 1 }}>→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: FAQ accordion */}
        <div>
          <h2 style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--charcoal)",
            marginBottom: "20px",
            fontFamily: "var(--font-display)",
          }}>
            자주 묻는 질문
          </h2>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {FAQS.map(({ q, a }, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={q}
                  style={{
                    borderBottom: "1px solid var(--border-warm)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "16px 0",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: "12px",
                    }}
                  >
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--charcoal)",
                      lineHeight: 1.4,
                    }}>
                      {q}
                    </span>
                    <span style={{
                      flexShrink: 0,
                      fontSize: "16px",
                      color: "var(--muted-ink)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s var(--ease-out)",
                      display: "inline-block",
                    }}>
                      ↓
                    </span>
                  </button>

                  {isOpen && (
                    <p style={{
                      fontSize: "13px",
                      color: "var(--muted-ink)",
                      lineHeight: 1.7,
                      margin: "0 0 16px",
                      paddingRight: "24px",
                    }}>
                      {a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
