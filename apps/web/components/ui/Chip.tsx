/**
 * Chip — 등급/카테고리/상태 표시 작은 라벨
 *
 * - grade chip: F/D/C/B/A 등급 표시 (전용 색상)
 * - tone chip: red/blue/green/neutral
 * - size: xs(11px) / sm(12px) / md(13px)
 */

import type { ReactNode, CSSProperties } from "react";

type Grade = "F" | "D" | "C" | "B" | "A";
type Tone = "red" | "blue" | "green" | "amber" | "neutral";
type Size = "xs" | "sm" | "md";

interface BaseChipProps {
  size?: Size;
  style?: CSSProperties;
  children: ReactNode;
}

interface GradeChipProps extends BaseChipProps {
  grade: Grade;
  showLabel?: boolean;
}

interface ToneChipProps extends BaseChipProps {
  tone: Tone;
}

type ChipProps = GradeChipProps | ToneChipProps;

const SIZE_MAP: Record<Size, { fs: string; px: string; py: string; h: string }> = {
  xs: { fs: "10.5px", px: "6px", py: "2px", h: "18px" },
  sm: { fs: "11.5px", px: "8px", py: "3px", h: "22px" },
  md: { fs: "12.5px", px: "10px", py: "4px", h: "26px" },
};

const GRADE_STYLES: Record<Grade, CSSProperties> = {
  F: { color: "var(--grade-f-text)", background: "var(--grade-f-bg)", border: "1px solid var(--grade-f-border)" },
  D: { color: "var(--grade-d-text)", background: "var(--grade-d-bg)", border: "1px solid var(--grade-d-border)" },
  C: { color: "var(--grade-c-text)", background: "var(--grade-c-bg)", border: "1px solid var(--grade-c-border)" },
  B: { color: "var(--grade-b-text)", background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)" },
  A: { color: "var(--grade-a-text)", background: "var(--grade-a-bg)", border: "1px solid var(--grade-a-border)" },
};

const TONE_STYLES: Record<Tone, CSSProperties> = {
  red:     { color: "var(--brand-red)",       background: "var(--brand-red-soft)",  border: "1px solid var(--brand-red-mid)" },
  blue:    { color: "var(--grade-a-text)",    background: "var(--grade-a-bg)",      border: "1px solid var(--grade-a-border)" },
  green:   { color: "var(--grade-b-text)",    background: "var(--grade-b-bg)",      border: "1px solid var(--grade-b-border)" },
  amber:   { color: "var(--grade-d-text)",    background: "var(--grade-d-bg)",      border: "1px solid var(--grade-d-border)" },
  neutral: { color: "var(--ms-text-2)",       background: "var(--ms-surface)",      border: "1px solid var(--ms-border)" },
};

export function Chip(props: ChipProps) {
  const size = props.size ?? "sm";
  const sz = SIZE_MAP[size];

  let variantStyle: CSSProperties;
  let label: ReactNode = props.children;

  if ("grade" in props) {
    variantStyle = GRADE_STYLES[props.grade];
  } else {
    variantStyle = TONE_STYLES[props.tone];
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: sz.fs,
        fontWeight: 700,
        letterSpacing: "0.01em",
        padding: `${sz.py} ${sz.px}`,
        borderRadius: "6px",
        fontFamily: "var(--font-display)",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...variantStyle,
        ...props.style,
      }}
    >
      {label}
    </span>
  );
}
