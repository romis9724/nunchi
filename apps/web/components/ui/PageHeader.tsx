/**
 * PageHeader — 모든 페이지 상단 헤더 패턴 통일
 *
 * - 선택적 eyebrow (빨강 알약 형태, 아이콘 옵션)
 * - h1 + 옵션 강조 (color="red"인 span 자식)
 * - 부제목 + 옵션 액션 슬롯
 */

import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  size?: "md" | "lg";
}

export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  actions,
  align = "left",
  size = "md",
}: PageHeaderProps) {
  const titleFs =
    size === "lg"
      ? "clamp(1.75rem, 3.4vw, 2.5rem)"
      : "clamp(1.375rem, 2.5vw, 1.875rem)";

  return (
    <header
      style={{
        marginBottom: "32px",
        display: "flex",
        justifyContent: align === "center" ? "center" : "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "16px",
        textAlign: align,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "640px" }}>
        {eyebrow && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--brand-red)",
              background: "var(--brand-red-soft)",
              border: "1px solid var(--brand-red-mid)",
              padding: "5px 12px",
              borderRadius: "999px",
              alignSelf: align === "center" ? "center" : "flex-start",
              width: "fit-content",
            }}
          >
            {eyebrowIcon && <Icon name={eyebrowIcon} size={13} />}
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: titleFs,
            fontWeight: 900,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            color: "var(--ms-text)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "14.5px",
              color: "var(--ms-text-2)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "560px",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{actions}</div>}
    </header>
  );
}
