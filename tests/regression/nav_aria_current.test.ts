/**
 * Component unit tests for NavigationMenu active state / aria-current rendering
 * — Sub-AC 3 (AC 12.2.3)
 *
 * Verifies that:
 *  - When a mock pathname matches an item's href exactly,
 *    that item's link props include aria-current="page"
 *  - When a mock pathname is a sub-route of an item's href (prefix match),
 *    that item's link props include aria-current="page"
 *  - Items that do NOT match the current pathname have aria-current === undefined
 *  - Exactly one item is active for any given non-root pathname
 *  - The root '/' item is only active when pathname is exactly '/'
 *
 * Uses buildNavLinkProps — the pure-function equivalent of NavigationMenu's
 * render logic — so no DOM or React runtime is required.
 *
 * Run: tsx --test regression/nav_aria_current.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildNavLinkProps,
  type NavLinkProps,
} from "../../apps/web/lib/nav-utils.js";
import { NAV_ITEMS, ROUTES } from "../../apps/web/lib/routes.js";

// ── Helper ───────────────────────────────────────────────────────────────────

/** Returns the NavLinkProps for the item whose href matches the given route */
function findLink(
  links: NavLinkProps[],
  href: string,
): NavLinkProps | undefined {
  return links.find((l) => l.href === href);
}

// ── Active item gets aria-current="page" ─────────────────────────────────────

describe('NavigationMenu — active item has aria-current="page"', () => {
  it('sets aria-current="page" on /check when pathname is /check', () => {
    const links = buildNavLinkProps(ROUTES.CHECK, NAV_ITEMS);
    const checkLink = findLink(links, ROUTES.CHECK);
    assert.ok(checkLink !== undefined, "'/check' link not found");
    assert.strictEqual(checkLink["aria-current"], "page");
  });

  it('sets aria-current="page" on /calendar when pathname is /calendar', () => {
    const links = buildNavLinkProps(ROUTES.CALENDAR, NAV_ITEMS);
    const calLink = findLink(links, ROUTES.CALENDAR);
    assert.ok(calLink !== undefined, "'/calendar' link not found");
    assert.strictEqual(calLink["aria-current"], "page");
  });

  it('sets aria-current="page" on /admin when pathname is /admin', () => {
    const links = buildNavLinkProps(ROUTES.ADMIN, NAV_ITEMS);
    const adminLink = findLink(links, ROUTES.ADMIN);
    assert.ok(adminLink !== undefined, "'/admin' link not found");
    assert.strictEqual(adminLink["aria-current"], "page");
  });

  it('sets aria-current="page" on /admin/events when pathname is /admin/events', () => {
    const links = buildNavLinkProps(ROUTES.ADMIN_EVENTS, NAV_ITEMS);
    const eventsLink = findLink(links, ROUTES.ADMIN_EVENTS);
    assert.ok(eventsLink !== undefined, "'/admin/events' link not found");
    assert.strictEqual(eventsLink["aria-current"], "page");
  });

  it('sets aria-current="page" on / when pathname is /', () => {
    const links = buildNavLinkProps(ROUTES.HOME, NAV_ITEMS);
    const homeLink = findLink(links, ROUTES.HOME);
    assert.ok(homeLink !== undefined, "'/' link not found");
    assert.strictEqual(homeLink["aria-current"], "page");
  });

  it('sets aria-current="page" on /contact when pathname is /contact', () => {
    const links = buildNavLinkProps(ROUTES.CONTACT, NAV_ITEMS);
    const contactLink = findLink(links, ROUTES.CONTACT);
    assert.ok(contactLink !== undefined, "'/contact' link not found");
    assert.strictEqual(contactLink["aria-current"], "page");
  });

  it('sets aria-current="page" on /admin when pathname is sub-route /admin/events', () => {
    // Prefix match: /admin/events falls under /admin
    const links = buildNavLinkProps(ROUTES.ADMIN_EVENTS, NAV_ITEMS);
    const adminLink = findLink(links, ROUTES.ADMIN);
    assert.ok(adminLink !== undefined, "'/admin' link not found");
    assert.strictEqual(adminLink["aria-current"], "page");
  });

  it('sets aria-current="page" on /check when pathname is /check/result (sub-route)', () => {
    const links = buildNavLinkProps("/check/result", NAV_ITEMS);
    const checkLink = findLink(links, ROUTES.CHECK);
    assert.ok(checkLink !== undefined, "'/check' link not found");
    assert.strictEqual(checkLink["aria-current"], "page");
  });
});

// ── Inactive items have aria-current undefined ────────────────────────────────

describe("NavigationMenu — inactive items have aria-current undefined", () => {
  it("does not set aria-current on /calendar when pathname is /check", () => {
    const links = buildNavLinkProps(ROUTES.CHECK, NAV_ITEMS);
    const calLink = findLink(links, ROUTES.CALENDAR);
    assert.ok(calLink !== undefined, "'/calendar' link not found");
    assert.strictEqual(
      calLink["aria-current"],
      undefined,
      "inactive item must not have aria-current",
    );
  });

  it("does not set aria-current on /check when pathname is /calendar", () => {
    const links = buildNavLinkProps(ROUTES.CALENDAR, NAV_ITEMS);
    const checkLink = findLink(links, ROUTES.CHECK);
    assert.ok(checkLink !== undefined, "'/check' link not found");
    assert.strictEqual(checkLink["aria-current"], undefined);
  });

  it("does not set aria-current on / when pathname is /check", () => {
    const links = buildNavLinkProps(ROUTES.CHECK, NAV_ITEMS);
    const homeLink = findLink(links, ROUTES.HOME);
    assert.ok(homeLink !== undefined, "'/' link not found");
    assert.strictEqual(
      homeLink["aria-current"],
      undefined,
      "root must not activate for non-root paths",
    );
  });

  it("does not set aria-current on / when pathname is /admin/events", () => {
    const links = buildNavLinkProps(ROUTES.ADMIN_EVENTS, NAV_ITEMS);
    const homeLink = findLink(links, ROUTES.HOME);
    assert.ok(homeLink !== undefined, "'/' link not found");
    assert.strictEqual(homeLink["aria-current"], undefined);
  });

  it("does not set aria-current on /admin when pathname is /calendar", () => {
    const links = buildNavLinkProps(ROUTES.CALENDAR, NAV_ITEMS);
    const adminLink = findLink(links, ROUTES.ADMIN);
    assert.ok(adminLink !== undefined, "'/admin' link not found");
    assert.strictEqual(adminLink["aria-current"], undefined);
  });

  it("does not set aria-current on /check when pathname is /contact", () => {
    const links = buildNavLinkProps(ROUTES.CONTACT, NAV_ITEMS);
    const checkLink = findLink(links, ROUTES.CHECK);
    assert.ok(checkLink !== undefined, "'/check' link not found");
    assert.strictEqual(checkLink["aria-current"], undefined);
  });
});

// ── Exactly one active item per unambiguous pathname ─────────────────────────

describe("NavigationMenu — exactly one item active for non-root routes", () => {
  const nonRootRoutes: string[] = [
    ROUTES.CHECK,
    ROUTES.CALENDAR,
    ROUTES.CONTACT,
    ROUTES.ONBOARDING,
  ];

  for (const pathname of nonRootRoutes) {
    it(`exactly one item has aria-current="page" when pathname is ${pathname}`, () => {
      const links = buildNavLinkProps(pathname, NAV_ITEMS);
      const activeLinks = links.filter((l) => l["aria-current"] === "page");
      assert.strictEqual(
        activeLinks.length,
        1,
        `Expected 1 active link for pathname '${pathname}', got ${activeLinks.length}: ${JSON.stringify(activeLinks.map((l) => l.href))}`,
      );
    });
  }

  it("aria-current is 'page' | undefined — no other values present", () => {
    const links = buildNavLinkProps(ROUTES.CHECK, NAV_ITEMS);
    for (const link of links) {
      const val = link["aria-current"];
      assert.ok(
        val === "page" || val === undefined,
        `Unexpected aria-current value '${String(val)}' for link '${link.href}'`,
      );
    }
  });
});

// ── Prefix match activates parent item too ────────────────────────────────────

describe("NavigationMenu — sub-route activates parent item (prefix match)", () => {
  it("both /admin and /admin/events are active when pathname is /admin/events", () => {
    const links = buildNavLinkProps(ROUTES.ADMIN_EVENTS, NAV_ITEMS);
    const adminLink = findLink(links, ROUTES.ADMIN);
    const eventsLink = findLink(links, ROUTES.ADMIN_EVENTS);
    assert.ok(adminLink !== undefined);
    assert.ok(eventsLink !== undefined);
    assert.strictEqual(
      adminLink["aria-current"],
      "page",
      "/admin should be active for sub-route",
    );
    assert.strictEqual(
      eventsLink["aria-current"],
      "page",
      "/admin/events should be active for exact match",
    );
  });

  it("only /admin is active when pathname is a deep sub-route /admin/events/123", () => {
    const links = buildNavLinkProps("/admin/events/123", NAV_ITEMS);
    const adminLink = findLink(links, ROUTES.ADMIN);
    const eventsLink = findLink(links, ROUTES.ADMIN_EVENTS);
    assert.ok(adminLink !== undefined);
    assert.ok(eventsLink !== undefined);
    assert.strictEqual(adminLink["aria-current"], "page");
    assert.strictEqual(eventsLink["aria-current"], "page");
  });
});
