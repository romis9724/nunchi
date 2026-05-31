"use client";

import type { Grade } from "@noonchi/shared";
import { GRADE_LABEL } from "@noonchi/shared";

const GRADE_STYLE: Record<Grade, { text: string; bg: string; border: string; dot: string }> = {
  F: { text: "var(--grade-f-text)", bg: "var(--grade-f-bg)",   border: "var(--grade-f-border)", dot: "#B53A2A" },
  D: { text: "var(--grade-d-text)", bg: "var(--grade-d-bg)",   border: "var(--grade-d-border)", dot: "#9A5A1A" },
  C: { text: "var(--grade-c-text)", bg: "var(--grade-c-bg)",   border: "var(--grade-c-border)", dot: "#5C5A70" },
  B: { text: "var(--grade-b-text)", bg: "var(--grade-b-bg)",   border: "var(--grade-b-border)", dot: "#2A6B47" },
  A: { text: "var(--grade-a-text)", bg: "var(--grade-a-bg)",   border: "var(--grade-a-border)", dot: "#3A6E1A" },
};

const GRADE_ICON: Record<Grade, string> = {
  F: "⛔",
  D: "⚠️",
  C: "○",
  B: "✓",
  A: "★",
};

interface GradeBadgeProps {
  grade: Grade;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function GradeBadge({ grade, size = "sm", showLabel = true }: GradeBadgeProps) {
  const s = GRADE_STYLE[grade];

  const padding = { xs: "2px 8px", sm: "4px 12px", md: "6px 14px", lg: "8px 20px" }[size];
  const fontSize = { xs: "10px", sm: "12px", md: "13px", lg: "15px" }[size];
  const letterSize = { xs: "13px", sm: "15px", md: "18px", lg: "24px" }[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding,
        borderRadius: "100px",
        border: `1.5px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.text,
        fontFamily: "var(--font-display)",
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
      aria-label={`${grade}등급 — ${GRADE_LABEL[grade]}`}
    >
      <span
        style={{
          fontWeight: 800,
          fontSize: letterSize,
          fontFamily: "var(--font-inter-tight, var(--font-display))",
          lineHeight: 1,
        }}
      >
        {grade}
      </span>
      {size !== "xs" && (
        <span aria-hidden="true" style={{ fontSize: parseInt(fontSize) - 1 + "px", opacity: 0.7 }}>
          {GRADE_ICON[grade]}
        </span>
      )}
      {showLabel && size === "lg" && (
        <span style={{ fontSize: "13px", opacity: 0.85, fontWeight: 500 }}>
          {GRADE_LABEL[grade]}
        </span>
      )}
    </span>
  );
}
