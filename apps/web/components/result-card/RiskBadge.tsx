"use client";

import type { RiskScore } from "@nunchi/shared";
import { RISK_SCORE_LABEL } from "@nunchi/shared";

const BADGE_STYLES: Record<RiskScore, string> = {
  critical:
    "bg-[var(--color-critical-bg)] text-[var(--color-critical)] border border-[var(--color-critical)]/30",
  danger:
    "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/30",
  caution:
    "bg-[var(--color-caution-bg)] text-[var(--color-caution)] border border-[var(--color-caution)]/30",
  safe: "bg-[var(--color-safe-bg)] text-[var(--color-safe)] border border-[var(--color-safe)]/30",
};

const BADGE_ICON: Record<RiskScore, string> = {
  critical: "🔴",
  danger: "🟠",
  caution: "🟡",
  safe: "🟢",
};

interface RiskBadgeProps {
  score: RiskScore;
  size?: "sm" | "lg";
}

export function RiskBadge({ score, size = "sm" }: RiskBadgeProps) {
  const isLarge = size === "lg";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-semibold rounded-full",
        isLarge ? "text-lg px-4 py-1.5" : "text-sm px-3 py-1",
        BADGE_STYLES[score],
      ].join(" ")}
    >
      <span aria-hidden="true">{BADGE_ICON[score]}</span>
      {BADGE_STYLES[score] && RISK_SCORE_LABEL[score]}
    </span>
  );
}
