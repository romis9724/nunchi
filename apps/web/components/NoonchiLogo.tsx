"use client";

import { BETA_BADGE } from "../lib/badge-config";

interface NoonchiLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
  showBeta?: boolean;
  className?: string;
}

export function NoonchiLogo({
  size = 28,
  color = "currentColor",
  showText = true,
  showBeta = true,
}: NoonchiLogoProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        userSelect: "none",
      }}
    >
      {/* 텍스트 */}
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-display, 'Inter Tight', sans-serif)",
            fontWeight: 800,
            fontSize: size * 0.72 + "px",
            letterSpacing: "-0.04em",
            color,
            lineHeight: 1,
          }}
        >
          noonch-i
        </span>
      )}

      {/* Beta 배지 */}
      {showBeta && (
        <span
          aria-label="베타 서비스"
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: BETA_BADGE.fontSize + "px",
            fontWeight: BETA_BADGE.fontWeight,
            letterSpacing: BETA_BADGE.letterSpacing,
            color: BETA_BADGE.color,
            background: BETA_BADGE.background,
            border: `1px solid ${BETA_BADGE.border}`,
            borderRadius: BETA_BADGE.borderRadius + "px",
            padding: `${BETA_BADGE.paddingY}px ${BETA_BADGE.paddingX}px`,
            lineHeight: 1,
            fontFamily: "var(--font-display, 'Inter Tight', sans-serif)",
          }}
        >
          {BETA_BADGE.label}
        </span>
      )}
    </span>
  );
}
