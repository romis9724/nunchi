/**
 * Card — 통일된 카드 컨테이너
 *
 * - tone: default(흰색) / soft(연한 회색) / red(빨강 액센트 좌측 보더)
 * - padding: lg(28px) / md(20px) / sm(14px)
 */

import type { ReactNode, CSSProperties } from "react";

type Tone = "default" | "soft" | "red" | "blue";
type Padding = "sm" | "md" | "lg" | "none";

interface CardProps {
  tone?: Tone;
  padding?: Padding;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  as?: "div" | "section" | "article";
}

const PADDING_MAP: Record<Padding, string> = {
  none: "0",
  sm: "14px",
  md: "20px",
  lg: "28px",
};

function toneStyle(tone: Tone): CSSProperties {
  switch (tone) {
    case "soft":
      return {
        background: "var(--ms-surface)",
        border: "1px solid var(--ms-border)",
      };
    case "red":
      return {
        background: "#fff",
        border: "1px solid var(--brand-red-mid)",
        borderLeft: "4px solid var(--brand-red)",
      };
    case "blue":
      return {
        background: "var(--ms-blue-light)",
        border: "1px solid var(--ms-blue-mid)",
      };
    default:
      return {
        background: "#fff",
        border: "1px solid var(--ms-border)",
      };
  }
}

export function Card({
  tone = "default",
  padding = "lg",
  className,
  style,
  children,
  as = "div",
}: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={className}
      style={{
        borderRadius: "var(--card-radius)",
        padding: PADDING_MAP[padding],
        boxShadow: "var(--card-shadow)",
        ...toneStyle(tone),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
