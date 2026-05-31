/**
 * Navigation utility functions for the Nunchi web app.
 *
 * Pure functions — no DOM, no React, no side effects.
 * Safe to import in any environment and unit-testable without a browser.
 */

import type { NavItem, RoutePath } from "./routes.js";

/**
 * Determines whether a navigation item should be rendered as "active"
 * based on the current pathname and the item's href.
 *
 * Rules:
 *  1. Exact match   — pathname === itemHref
 *  2. Prefix match  — pathname starts with itemHref + '/' (sub-routes)
 *  3. Root edge case — '/' only matches exactly; it never activates via prefix
 *
 * @param pathname  - The current URL pathname (e.g. '/admin/events')
 * @param itemHref  - The navigation item's href (e.g. '/admin')
 * @returns true if the item should be considered active, false otherwise
 *
 * @example
 * isActiveItem('/check', '/check')          // true  — exact match
 * isActiveItem('/admin/events', '/admin')   // true  — prefix match
 * isActiveItem('/calendar', '/')            // false — root only matches exactly
 * isActiveItem('/', '/')                    // true  — root exact match
 */
export function isActiveItem(pathname: string, itemHref: string): boolean {
  // Exact match always wins
  if (pathname === itemHref) {
    return true;
  }

  // Root path '/' must only match exactly — never as a prefix
  if (itemHref === "/") {
    return false;
  }

  // Prefix match: pathname must start with itemHref followed by '/'
  // e.g. '/admin/events' starts with '/admin/'
  return pathname.startsWith(itemHref + "/");
}

// ── NavigationMenu link props ────────────────────────────────────────────────

/**
 * Props generated for each navigation link, including the resolved
 * aria-current attribute value for accessibility.
 *
 * When the link is active, aria-current is 'page'.
 * When the link is inactive, aria-current is undefined (attribute omitted).
 */
export interface NavLinkProps {
  key: string;
  href: RoutePath;
  label: string;
  icon: string;
  "aria-current": "page" | undefined;
}

/**
 * Derives the full set of navigation link props (including aria-current)
 * from the current pathname and the list of navigation items.
 *
 * This is the pure-function equivalent of the NavigationMenu component's
 * rendering logic and is used both by the component and by unit tests.
 *
 * @param pathname - The current URL pathname (e.g. '/check')
 * @param items    - The ordered list of navigation items to render
 * @returns        Array of NavLinkProps with aria-current resolved
 *
 * @example
 * buildNavLinkProps('/check', NAV_ITEMS)
 * // The '/check' item will have { 'aria-current': 'page' }
 * // All other items will have { 'aria-current': undefined }
 */
export function buildNavLinkProps(
  pathname: string,
  items: readonly NavItem[],
): NavLinkProps[] {
  return items.map((item) => ({
    key: item.key,
    href: item.href,
    label: item.label,
    icon: item.icon,
    "aria-current": isActiveItem(pathname, item.href) ? "page" : undefined,
  }));
}
