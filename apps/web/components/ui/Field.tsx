/**
 * Field — 통일된 폼 라벨 + 입력 그룹
 *
 * - label + 옵션 required 마커 + 옵션 hint
 * - input | textarea | select children 전달
 * - error 메시지 슬롯
 */

"use client";

import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  children,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: "12.5px",
          fontWeight: 700,
          color: "var(--ms-text-2)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--brand-red)", fontWeight: 800 }}>*</span>
        )}
        {optional && (
          <span
            style={{
              fontWeight: 500,
              color: "var(--ms-text-3)",
              textTransform: "none",
              letterSpacing: 0,
              fontSize: "11px",
            }}
          >
            (선택)
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: "12px", color: "var(--ms-text-3)", margin: 0, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ fontSize: "12.5px", color: "var(--brand-red)", margin: 0, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Input/Textarea 기본 스타일 ───────────────────────────── */
export const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--input-py) var(--input-px)",
  border: "1.5px solid var(--ms-border)",
  borderRadius: "var(--input-radius)",
  background: "#fff",
  fontSize: "14px",
  color: "var(--ms-text)",
  outline: "none",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

export const inputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--brand-red)";
    e.target.style.boxShadow = "0 0 0 3px var(--brand-red-soft)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--ms-border)";
    e.target.style.boxShadow = "none";
  },
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
export function Input(props: InputProps) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      {...inputFocusHandlers}
      style={{ ...inputBaseStyle, height: "var(--input-h)", ...style }}
    />
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}
export function Textarea(props: TextareaProps) {
  const { style, ...rest } = props;
  return (
    <textarea
      {...rest}
      {...inputFocusHandlers}
      style={{ ...inputBaseStyle, resize: "none", lineHeight: 1.5, ...style }}
    />
  );
}
