"use client";

import { BETA_BADGE } from "../lib/badge-config";

interface NunchiLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
  showBeta?: boolean;
  className?: string;
}

export function NunchiLogo({
  size = 28,
  color = "currentColor",
  showText = true,
  showBeta = true,
}: NunchiLogoProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        userSelect: "none",
      }}
    >
      {/* 눈치 보는 눈 아이콘 — 시선이 오른쪽 끝에 쏠린 side-eye */}
      <svg
        width={size * 1.7}
        height={size}
        viewBox="0 0 52 30"
        fill="none"
        aria-hidden="true"
      >
        {/* 눈꺼풀 위쪽 — 약간 내려온 모양 (반쯤 감은 눈) */}
        <path
          d="M2 15 C10 4 42 4 50 15"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* 눈꺼풀 아래쪽 */}
        <path
          d="M2 15 C10 24 42 24 50 15"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* 홍채 — 오른쪽으로 치우침 (옆 눈치 보는 시선) */}
        <circle cx="36" cy="15" r="7.5" fill={color} />
        {/* 동공 */}
        <circle cx="37.5" cy="15" r="4.2" fill={color === "currentColor" ? "var(--warm-white, #F8F7F4)" : "#F8F7F4"} />
        {/* 하이라이트 */}
        <circle cx="39" cy="13" r="1.8" fill={color} />
        {/* 속눈썹 — 위 (3개) */}
        <line x1="16" y1="6" x2="15" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="26" y1="4" x2="26" y2="0.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="36" y1="4.5" x2="37" y2="1" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>

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
          nunchi
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
