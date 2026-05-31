/**
 * PageHeader — 매거진 스타일 페이지 상단 헤더
 *
 * - 선택적 eyebrow (빨강 알약 + 아이콘)
 * - h1 (display font, 큼직한 임팩트)
 * - 부제목 또는 인사이트 메트릭
 * - actions 슬롯 (legend, CTA 등)
 * - metrics 슬롯 ("이달 위험 7건 · 호재 2건" 같은 인사이트)
 */

import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
  /** ['숫자 라벨', '의미 라벨'] 쌍의 배열 */
  metrics?: Array<{ value: ReactNode; label: ReactNode; tone?: "red" | "neutral" | "blue" }>;
  actions?: ReactNode;
  align?: "left" | "center";
  size?: "md" | "lg";
}

export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  metrics,
  actions,
  align = "left",
  size = "lg",
}: PageHeaderProps) {
  const titleFs =
    size === "lg"
      ? "clamp(2rem, 4vw, 3rem)"
      : "clamp(1.5rem, 2.8vw, 2.125rem)";

  const titleWeight = 900;
  const titleSpacing = "-0.04em";

  const toneColor = (tone?: string) => {
    if (tone === "red") return "var(--brand-red)";
    if (tone === "blue") return "var(--grade-a-text)";
    return "var(--ms-text)";
  };

  return (
    <header
      style={{
        marginBottom: "32px",
        display: "flex",
        justifyContent: align === "center" ? "center" : "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "24px",
        textAlign: align,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "720px", flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
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
            fontWeight: titleWeight,
            letterSpacing: titleSpacing,
            lineHeight: 1.05,
            color: "var(--ms-text)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "15px",
              color: "var(--ms-text-2)",
              lineHeight: 1.65,
              margin: 0,
              maxWidth: "640px",
            }}
          >
            {subtitle}
          </p>
        )}
        {metrics && metrics.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px 32px",
              marginTop: "8px",
              alignItems: "baseline",
            }}
          >
            {metrics.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "26px",
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                    color: toneColor(m.tone),
                    lineHeight: 1,
                  }}
                >
                  {m.value}
                </span>
                <span style={{ fontSize: "13px", color: "var(--ms-text-2)", fontWeight: 500 }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {actions}
        </div>
      )}
    </header>
  );
}
