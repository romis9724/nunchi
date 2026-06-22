"use client";

import { BETA_BADGE } from "../lib/badge-config";

/**
 * NoonchiLogo — "Hyphen as Mark" 컨셉
 *
 * 구조:    nunch  ●  i  [Beta]
 *                  ↑
 *           브랜드 시그니처 점 (빨강, 단독 마크로도 사용)
 *
 * - 풀 로고: 텍스트 + 빨강 점 + (옵션) Beta 배지
 * - markOnly: 빨강 점만 — favicon·소셜·앱 아이콘용
 * - 점은 baseline 살짝 위로 raised — 시각 리듬 형성
 * - 점에 group-hover pulse 미세 애니메이션 (CSS 클래스 nl-dot)
 */

interface NoonchiLogoProps {
  /** 전체 컨테이너 높이 기준 px. 폰트는 이 값의 0.78배 자동 계산 */
  size?: number;
  color?: string;
  /** false면 텍스트 숨김 (마크만 표시) */
  showText?: boolean;
  showBeta?: boolean;
  /** true면 점 마크만 렌더 (favicon, 소셜용 단독 마크) */
  markOnly?: boolean;
  className?: string;
}

export function NoonchiLogo({
  size = 28,
  color = "currentColor",
  showText = true,
  showBeta = true,
  markOnly = false,
}: NoonchiLogoProps) {
  // 점 마크 크기 — 텍스트 폰트 크기의 36%
  const dotSize = Math.max(6, Math.round(size * 0.78 * 0.36));

  // markOnly 모드: 점만 표시 (favicon, 소셜용)
  if (markOnly) {
    return (
      <span
        aria-label="nunch-i"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          background: "var(--brand-red, #E11D48)",
          borderRadius: Math.round(size * 0.22) + "px",
        }}
      >
        <span
          style={{
            width: Math.round(size * 0.32),
            height: Math.round(size * 0.32),
            background: "#fff",
            borderRadius: "50%",
          }}
        />
      </span>
    );
  }

  const fontSize = size * 0.78;

  return (
    <span
      className="noonchi-logo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      {/* 워드마크 + 점 마크 */}
      {showText && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "var(--font-display, 'Inter Tight', sans-serif)",
            fontWeight: 900,
            fontSize: fontSize + "px",
            letterSpacing: "-0.045em",
            color,
            lineHeight: 1,
            gap: Math.round(fontSize * 0.15) + "px",
          }}
        >
          nunch
          {/* 빨강 점 — 브랜드 시그니처 */}
          <span
            aria-hidden="true"
            className="noonchi-dot"
            style={{
              width: dotSize + "px",
              height: dotSize + "px",
              borderRadius: "50%",
              background: "var(--brand-red, #E11D48)",
              flexShrink: 0,
              display: "inline-block",
              // baseline에서 살짝 위로 올려 시각 리듬 형성
              transform: `translateY(-${Math.round(fontSize * 0.06)}px)`,
              transition: "transform 0.2s var(--ease-out, ease-out)",
            }}
          />
          i
        </span>
      )}

      {/* Beta 배지 — 마크와 분리 (마진으로 시각 공간 확보) */}
      {showBeta && (
        <span
          aria-label="베타 서비스"
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginLeft: "4px",
            fontSize: Math.max(9, Math.round(fontSize * 0.4)) + "px",
            fontWeight: BETA_BADGE.fontWeight,
            letterSpacing: BETA_BADGE.letterSpacing,
            color: BETA_BADGE.color,
            background: BETA_BADGE.background,
            border: `1px solid ${BETA_BADGE.border}`,
            borderRadius: BETA_BADGE.borderRadius + "px",
            padding: "2px 6px",
            lineHeight: 1,
            fontFamily: "var(--font-display, 'Inter Tight', sans-serif)",
            textTransform: "uppercase",
          }}
        >
          {BETA_BADGE.label}
        </span>
      )}

      <style>{`
        .noonchi-logo:hover .noonchi-dot {
          transform: translateY(-${Math.round(fontSize * 0.06)}px) scale(1.15);
        }
      `}</style>
    </span>
  );
}
