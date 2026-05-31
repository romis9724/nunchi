/**
 * Unit tests for the routes/navigation metadata module — Sub-AC 1
 *
 * Verifies:
 *  - All 7 route path constants are defined with correct values
 *  - NAV_ITEMS has exactly 7 entries
 *  - Each NavItem has a non-empty label, a valid href, and a non-empty icon
 *  - Each href matches the corresponding ROUTES constant
 *  - No duplicate keys or hrefs
 *
 * Pure data test — no DOM, no React, no network.
 * Run: tsx --test regression/nav_routes.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ROUTES,
  NAV_ITEMS,
  type RoutePath,
  type NavItem,
} from "../../apps/web/lib/routes.js";

// ── ROUTES constant tests ───────────────────────────────────────────────────

describe("ROUTES path constants", () => {
  it("HOME is '/'", () => {
    assert.strictEqual(ROUTES.HOME, "/");
  });

  it("CHECK is '/check'", () => {
    assert.strictEqual(ROUTES.CHECK, "/check");
  });

  it("CALENDAR is '/calendar'", () => {
    assert.strictEqual(ROUTES.CALENDAR, "/calendar");
  });

  it("ONBOARDING is '/onboarding'", () => {
    assert.strictEqual(ROUTES.ONBOARDING, "/onboarding");
  });

  it("ADMIN is '/admin'", () => {
    assert.strictEqual(ROUTES.ADMIN, "/admin");
  });

  it("ADMIN_EVENTS is '/admin/events'", () => {
    assert.strictEqual(ROUTES.ADMIN_EVENTS, "/admin/events");
  });

  it("CONTACT is '/contact'", () => {
    assert.strictEqual(ROUTES.CONTACT, "/contact");
  });

  it("has exactly 7 route entries", () => {
    const count = Object.keys(ROUTES).length;
    assert.strictEqual(count, 7, `Expected 7 routes, got ${count}`);
  });

  it("all route values start with '/'", () => {
    for (const [key, path] of Object.entries(ROUTES)) {
      assert.ok(
        typeof path === "string" && path.startsWith("/"),
        `ROUTES.${key} ('${path}') must start with '/'`,
      );
    }
  });
});

// ── NAV_ITEMS tests ─────────────────────────────────────────────────────────

describe("NAV_ITEMS navigation metadata", () => {
  it("has exactly 7 items", () => {
    assert.strictEqual(
      NAV_ITEMS.length,
      7,
      `Expected 7 nav items, got ${NAV_ITEMS.length}`,
    );
  });

  it("each item has a non-empty key", () => {
    for (const item of NAV_ITEMS) {
      assert.ok(
        typeof item.key === "string" && item.key.trim().length > 0,
        `NavItem key is empty or missing: ${JSON.stringify(item)}`,
      );
    }
  });

  it("each item has a non-empty label", () => {
    for (const item of NAV_ITEMS) {
      assert.ok(
        typeof item.label === "string" && item.label.trim().length > 0,
        `NavItem label is empty: key='${item.key}'`,
      );
    }
  });

  it("each item has a non-empty icon identifier", () => {
    for (const item of NAV_ITEMS) {
      assert.ok(
        typeof item.icon === "string" && item.icon.trim().length > 0,
        `NavItem icon is empty: key='${item.key}'`,
      );
    }
  });

  it("each href starts with '/'", () => {
    for (const item of NAV_ITEMS) {
      assert.ok(
        typeof item.href === "string" && item.href.startsWith("/"),
        `NavItem href '${item.href}' must start with '/'`,
      );
    }
  });

  it("no duplicate keys", () => {
    const keys = NAV_ITEMS.map((i) => i.key);
    const unique = new Set(keys);
    assert.strictEqual(
      unique.size,
      keys.length,
      `Duplicate keys found: ${keys.join(", ")}`,
    );
  });

  it("no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    const unique = new Set(hrefs);
    assert.strictEqual(
      unique.size,
      hrefs.length,
      `Duplicate hrefs found: ${hrefs.join(", ")}`,
    );
  });

  // ── Each expected route is present ────────────────────────────────────────

  const expectedRoutes: Array<{ label: string; href: RoutePath }> = [
    { label: "홈", href: ROUTES.HOME },
    { label: "캠페인 검토", href: ROUTES.CHECK },
    { label: "민감일 캘린더", href: ROUTES.CALENDAR },
    { label: "온보딩", href: ROUTES.ONBOARDING },
    { label: "관리자", href: ROUTES.ADMIN },
    { label: "이벤트 관리", href: ROUTES.ADMIN_EVENTS },
    { label: "문의하기", href: ROUTES.CONTACT },
  ];

  for (const { label, href } of expectedRoutes) {
    it(`contains item with label='${label}' and href='${href}'`, () => {
      const found = NAV_ITEMS.find(
        (i: NavItem) => i.href === href && i.label === label,
      );
      assert.ok(
        found !== undefined,
        `No NavItem with label='${label}' and href='${href}' found.\n` +
          `Available: ${JSON.stringify(NAV_ITEMS.map((i) => ({ label: i.label, href: i.href })))}`,
      );
    });
  }

  // ── Structural shape check ─────────────────────────────────────────────────

  it("every item satisfies the NavItem interface shape (key, label, href, icon)", () => {
    const requiredKeys: (keyof NavItem)[] = ["key", "label", "href", "icon"];
    for (const item of NAV_ITEMS) {
      for (const k of requiredKeys) {
        assert.ok(
          k in item,
          `NavItem with key='${item.key}' is missing field '${k}'`,
        );
      }
    }
  });
});
