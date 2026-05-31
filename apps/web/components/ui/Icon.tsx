/**
 * Icon — outline-style 인라인 SVG 아이콘 세트
 *
 * - Lucide / Heroicons outline 스타일 (1.75 stroke)
 * - currentColor 상속으로 어디서든 색상 일관성
 * - Tree-shake 가능: 사용하지 않는 아이콘은 번들 제외 안 됨(작아서 OK)
 */

import type { SVGProps } from "react";

type IconName =
  | "arrow-right" | "arrow-left" | "check" | "x"
  | "calendar" | "clock" | "mail" | "user" | "shield"
  | "alert" | "info" | "search" | "send" | "log-in" | "log-out"
  | "external" | "menu" | "chevron-down" | "lock" | "list"
  | "play" | "spark" | "sparkle";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

const STROKE_W = 1.75;

export function Icon({ name, size = 18, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: STROKE_W,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };

  switch (name) {
    case "arrow-right":
      return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    case "arrow-left":
      return <svg {...common}><path d="M19 12H5M11 5l-7 7 7 7" /></svg>;
    case "check":
      return <svg {...common}><path d="M5 12l5 5L20 7" /></svg>;
    case "x":
      return <svg {...common}><path d="M18 6L6 18M6 6l12 12" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" /></svg>;
    case "alert":
      return <svg {...common}><path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z" /></svg>;
    case "info":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case "send":
      return <svg {...common}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
    case "log-in":
      return <svg {...common}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>;
    case "log-out":
      return <svg {...common}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
    case "external":
      return <svg {...common}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>;
    case "menu":
      return <svg {...common}><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
    case "chevron-down":
      return <svg {...common}><path d="M6 9l6 6 6-6" /></svg>;
    case "lock":
      return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>;
    case "list":
      return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "play":
      return <svg {...common}><path d="M5 3l14 9-14 9V3z" /></svg>;
    case "spark":
    case "sparkle":
      return <svg {...common}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>;
    default:
      return null;
  }
}

export type { IconName };
