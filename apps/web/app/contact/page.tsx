"use client";

import { useState } from "react";
import Link from "next/link";
import { NunchiLogo } from "@/components/NunchiLogo";
import { CONTACT_FORM_FIELDS } from "@/lib/contact-form";

const NAV_LINK_STYLE = {
  fontSize: "13px",
  color: "var(--ms-text-2, var(--muted-ink))",
  textDecoration: "none",
  fontWeight: 500,
  padding: "6px 12px",
  borderRadius: "4px",
  border: "1px solid var(--ms-border, var(--border-warm))",
  background: "transparent",
  cursor: "pointer",
  transition: "all 0.12s",
} as const;

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

const LABEL_STYLE = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--muted-ink)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

type FormState = {
  name: string;
  email: string;
  message: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      setErrorMessage(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    }
  };

  const isSubmitting = status === "submitting";
  const canSubmit =
    !isSubmitting &&
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.message.trim().length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--warm-white)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Navigation */}
      <header
        style={{
          borderBottom: "1px solid var(--border-warm)",
          background: "rgba(248,247,244,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "0 24px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{ textDecoration: "none", color: "var(--ms-text, var(--charcoal))" }}
          >
            <NunchiLogo size={22} />
          </Link>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/check" style={NAV_LINK_STYLE}>
              캠페인 검토
            </Link>
            <Link href="/calendar" style={NAV_LINK_STYLE}>
              민감일 캘린더
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--muted-ink)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <span>✉</span> 문의하기
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px,4vw,32px)",
              fontWeight: 800,
              color: "var(--charcoal)",
              letterSpacing: "-0.03em",
              margin: "0 0 8px",
            }}
          >
            문의 및 피드백
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--muted-ink)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
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
              padding: "32px",
              borderRadius: "16px",
              border: "1px solid var(--border-warm)",
              background: "#F6FAF3",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>✓</div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--charcoal)",
                margin: "0 0 8px",
              }}
            >
              문의가 접수되었습니다
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted-ink)", margin: "0 0 24px" }}>
              빠른 시일 내에 이메일로 답변 드리겠습니다.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-warm)",
                background: "transparent",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--charcoal)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              새 문의 작성
            </button>
          </div>
        ) : (
          /* Form card */
          <div
            className="studio-card"
            style={{ padding: "32px", marginBottom: "32px" }}
          >
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              noValidate
            >
              {/* Name field */}
              <div>
                <label htmlFor="name" style={LABEL_STYLE}>
                  {CONTACT_FORM_FIELDS[0].label}{" "}
                  <span style={{ color: "var(--coral)" }}>*</span>
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
                  {CONTACT_FORM_FIELDS[1].label}{" "}
                  <span style={{ color: "var(--coral)" }}>*</span>
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
                  {CONTACT_FORM_FIELDS[2].label}{" "}
                  <span style={{ color: "var(--coral)" }}>*</span>
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
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--muted-ink)",
                    textAlign: "right",
                    marginTop: "4px",
                  }}
                >
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
                {isSubmitting ? "전송 중…" : "문의 보내기"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
