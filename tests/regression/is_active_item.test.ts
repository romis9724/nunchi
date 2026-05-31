/**
 * Unit tests for isActiveItem — Sub-AC 2 (AC 12.2.2)
 *
 * Verifies:
 *  - Exact match: pathname === itemHref → true
 *  - Prefix match: pathname starts with itemHref + '/' → true
 *  - Non-match: unrelated paths → false
 *  - Root path edge cases: '/' only matches exactly, never as prefix
 *  - Deep sub-route prefix match
 *  - Similar-prefix non-match (e.g. '/admin-settings' does not activate '/admin')
 *
 * Pure function test — no DOM, no React, no network.
 * Run: tsx --test regression/is_active_item.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isActiveItem } from "../../apps/web/lib/nav-utils.js";

// ── Exact match ────────────────────────────────────────────────────────────

describe("isActiveItem — exact match", () => {
  it("returns true when pathname equals itemHref (/check)", () => {
    assert.strictEqual(isActiveItem("/check", "/check"), true);
  });

  it("returns true when pathname equals itemHref (/calendar)", () => {
    assert.strictEqual(isActiveItem("/calendar", "/calendar"), true);
  });

  it("returns true when pathname equals itemHref (/admin)", () => {
    assert.strictEqual(isActiveItem("/admin", "/admin"), true);
  });

  it("returns true when pathname equals itemHref (/admin/events)", () => {
    assert.strictEqual(isActiveItem("/admin/events", "/admin/events"), true);
  });

  it("returns true for root path exact match", () => {
    assert.strictEqual(isActiveItem("/", "/"), true);
  });
});

// ── Prefix match ───────────────────────────────────────────────────────────

describe("isActiveItem — prefix match", () => {
  it("returns true when pathname is a sub-route of itemHref (/admin/events under /admin)", () => {
    assert.strictEqual(isActiveItem("/admin/events", "/admin"), true);
  });

  it("returns true for a deep sub-route (/admin/events/123 under /admin)", () => {
    assert.strictEqual(isActiveItem("/admin/events/123", "/admin"), true);
  });

  it("returns true for a direct child route (/check/result under /check)", () => {
    assert.strictEqual(isActiveItem("/check/result", "/check"), true);
  });

  it("returns true for a deep path under /calendar", () => {
    assert.strictEqual(
      isActiveItem("/calendar/2026/05", "/calendar"),
      true
    );
  });
});

// ── Non-match ──────────────────────────────────────────────────────────────

describe("isActiveItem — non-match (returns false)", () => {
  it("returns false when pathname is completely different", () => {
    assert.strictEqual(isActiveItem("/calendar", "/check"), false);
  });

  it("returns false when pathname is a sibling route", () => {
    assert.strictEqual(isActiveItem("/admin/events", "/admin/users"), false);
  });

  it("returns false when itemHref is a sub-path of pathname (reversed)", () => {
    // /admin should not activate when pathname is /admin-settings (similar prefix but NOT a sub-route)
    assert.strictEqual(isActiveItem("/admin-settings", "/admin"), false);
  });

  it("returns false when similar but not a real prefix boundary (/checkup vs /check)", () => {
    assert.strictEqual(isActiveItem("/checkup", "/check"), false);
  });

  it("returns false for empty vs non-empty", () => {
    assert.strictEqual(isActiveItem("/contact", "/check"), false);
  });
});

// ── Root path edge cases ───────────────────────────────────────────────────

describe("isActiveItem — root path '/' edge cases", () => {
  it("returns true when both pathname and itemHref are '/' (exact match)", () => {
    assert.strictEqual(isActiveItem("/", "/"), true);
  });

  it("returns false when pathname is '/check' and itemHref is '/' (root must not match as prefix)", () => {
    assert.strictEqual(isActiveItem("/check", "/"), false);
  });

  it("returns false when pathname is '/calendar' and itemHref is '/' (root must not match as prefix)", () => {
    assert.strictEqual(isActiveItem("/calendar", "/"), false);
  });

  it("returns false when pathname is '/admin/events' and itemHref is '/' (root must not activate for deep paths)", () => {
    assert.strictEqual(isActiveItem("/admin/events", "/"), false);
  });

  it("returns false when pathname is '/onboarding' and itemHref is '/'", () => {
    assert.strictEqual(isActiveItem("/onboarding", "/"), false);
  });
});
