/**
 * Route path constants and navigation metadata for the Noonchi web app.
 *
 * Pure data module — no DOM, no React, no side effects.
 * Safe to import in any environment and unit-testable without a browser.
 *
 * NavItem.icon is a string identifier that UI components resolve to an
 * actual icon component, keeping this module dependency-free.
 */

// ── Path constants ──────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  CHECK: "/check",
  CALENDAR: "/calendar",
  ONBOARDING: "/onboarding",
  ADMIN: "/admin",
  ADMIN_EVENTS: "/admin/events",
  CONTACT: "/contact",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

// ── Navigation metadata ─────────────────────────────────────────────────────

export interface NavItem {
  /** Unique key for the route */
  key: string;
  /** Human-readable label (Korean) */
  label: string;
  /** URL path */
  href: RoutePath;
  /** String identifier resolved to an icon component by the UI layer */
  icon: string;
}

/**
 * Ordered list of all 7 application routes with their navigation metadata.
 * Ordered by natural user journey: public → authenticated → admin.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: "home",
    label: "홈",
    href: ROUTES.HOME,
    icon: "home",
  },
  {
    key: "check",
    label: "캠페인 검토",
    href: ROUTES.CHECK,
    icon: "shield-check",
  },
  {
    key: "calendar",
    label: "리스크 캘린더",
    href: ROUTES.CALENDAR,
    icon: "calendar",
  },
  {
    key: "onboarding",
    label: "온보딩",
    href: ROUTES.ONBOARDING,
    icon: "user-circle",
  },
  {
    key: "admin",
    label: "관리자",
    href: ROUTES.ADMIN,
    icon: "lock",
  },
  {
    key: "admin-events",
    label: "이벤트 관리",
    href: ROUTES.ADMIN_EVENTS,
    icon: "list",
  },
  {
    key: "contact",
    label: "문의하기",
    href: ROUTES.CONTACT,
    icon: "mail",
  },
] as const;
