"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./SiteFooter";

/**
 * GlobalFooter — 모든 페이지에 자동으로 SiteFooter를 렌더
 *
 * 제외 경로:
 *  - / (landing): 자체 dark footer를 가짐
 *  - /admin/*: 관리자 화면 (불필요)
 *  - /onboarding: 가입 도중 (UX 흐름 끊김 방지)
 *  - /auth/*: OAuth 콜백 등 시스템 페이지
 *
 * default(landing dark)와 compact(인앱) variant 자동 선택.
 */

const EXCLUDED_PATHS: string[] = [
  "/",                  // landing은 자체 dark footer
  "/onboarding",
  "/auth",
  "/admin",
];

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => {
    if (path === pathname) return true;
    return pathname.startsWith(path + "/");
  });
}

export function GlobalFooter() {
  const pathname = usePathname();
  if (isExcluded(pathname)) return null;
  return <SiteFooter variant="compact" />;
}
