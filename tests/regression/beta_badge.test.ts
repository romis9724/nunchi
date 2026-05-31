/**
 * Regression: BETA_BADGE config — AC5 (Beta badge next to logo)
 *
 * Verifies that the badge configuration used by NunchiLogo and all page
 * headers has the expected shape and values. This is a pure data test —
 * no DOM, no React, no network.
 *
 * Run: tsx --test regression/beta_badge.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BETA_BADGE,
  type BadgeConfig,
} from "../../apps/web/lib/badge-config.js";

describe("BETA_BADGE config — AC5", () => {
  it('label is exactly "Beta"', () => {
    assert.strictEqual(BETA_BADGE.label, "Beta");
  });

  it("has a non-empty background value", () => {
    assert.ok(
      typeof BETA_BADGE.background === "string" && BETA_BADGE.background.length > 0,
      "background must be a non-empty CSS string",
    );
  });

  it("has a non-empty color value", () => {
    assert.ok(
      typeof BETA_BADGE.color === "string" && BETA_BADGE.color.length > 0,
      "color must be a non-empty CSS string",
    );
  });

  it("has a non-empty border value", () => {
    assert.ok(
      typeof BETA_BADGE.border === "string" && BETA_BADGE.border.length > 0,
      "border must be a non-empty CSS string",
    );
  });

  it("fontSize is a positive number", () => {
    assert.ok(
      typeof BETA_BADGE.fontSize === "number" && BETA_BADGE.fontSize > 0,
      "fontSize must be a positive number",
    );
  });

  it("fontWeight is a positive number", () => {
    assert.ok(
      typeof BETA_BADGE.fontWeight === "number" && BETA_BADGE.fontWeight > 0,
      "fontWeight must be a positive number",
    );
  });

  it("borderRadius is a non-negative number", () => {
    assert.ok(
      typeof BETA_BADGE.borderRadius === "number" && BETA_BADGE.borderRadius >= 0,
      "borderRadius must be non-negative",
    );
  });

  it("paddingX is a positive number", () => {
    assert.ok(
      typeof BETA_BADGE.paddingX === "number" && BETA_BADGE.paddingX > 0,
      "paddingX must be a positive number",
    );
  });

  it("paddingY is a non-negative number", () => {
    assert.ok(
      typeof BETA_BADGE.paddingY === "number" && BETA_BADGE.paddingY >= 0,
      "paddingY must be non-negative",
    );
  });

  it("letterSpacing is a non-empty string", () => {
    assert.ok(
      typeof BETA_BADGE.letterSpacing === "string" && BETA_BADGE.letterSpacing.length > 0,
      "letterSpacing must be a non-empty CSS string",
    );
  });

  it("satisfies the BadgeConfig interface shape (all required keys present)", () => {
    const requiredKeys: (keyof BadgeConfig)[] = [
      "label",
      "background",
      "color",
      "border",
      "fontSize",
      "fontWeight",
      "borderRadius",
      "paddingX",
      "paddingY",
      "letterSpacing",
    ];
    for (const key of requiredKeys) {
      assert.ok(
        key in BETA_BADGE,
        `BETA_BADGE is missing required key: ${key}`,
      );
    }
  });
});
