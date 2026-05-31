/**
 * Visual-regression snapshot: Hero h1 font-size token — Sub-AC 12.3.2
 *
 * Locks the current state of:
 *   1. The --text-hero CSS token value in globals.css
 *   2. The Hero <h1> element's fontSize referencing that token
 *
 * A failing test means someone has silently changed the font-size token
 * or detached the Hero component from the design token — both are regressions.
 *
 * Strategy: parse source files as plain text (no browser, no DOM, no network).
 * The "snapshot" is encoded as in-test constants that must match the live files.
 *
 * Run: tsx --test regression/hero_font_size_snapshot.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Path resolution ────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

const CSS_PATH = resolve(__dir, "../../apps/web/app/globals.css");
const HERO_PATH = resolve(__dir, "../../apps/web/app/(landing)/page.tsx");

// ── Snapshot constants (frozen expected state) ─────────────────────────────────

/** The CSS token name for hero heading font size */
const TOKEN_NAME = "--text-hero";

/** The expected clamp() value locked at the time this snapshot was written */
const SNAPSHOT_TOKEN_VALUE = "clamp(3rem, 1rem + 7vw, 8rem)";

/** The expected fontSize reference used in the Hero <h1> */
const SNAPSHOT_H1_FONT_SIZE = "var(--text-hero)";

// ── Helpers ────────────────────────────────────────────────────────────────────

function readCss(): string {
  return readFileSync(CSS_PATH, "utf-8");
}

function readHero(): string {
  return readFileSync(HERO_PATH, "utf-8");
}

/**
 * Extract the value of a CSS custom property declaration.
 * Matches:  --property-name: <value>;
 */
function extractCssVar(css: string, varName: string): string | null {
  const pattern = new RegExp(
    `${varName.replace(/-/g, "\\-")}\\s*:\\s*([^;]+);`,
  );
  const match = css.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Extract the fontSize value from the Hero <h1> style prop.
 * Looks for:  fontSize: "..."  inside the h1 style object.
 */
function extractH1FontSize(tsx: string): string | null {
  // Match the h1 opening tag's style prop to extract fontSize
  const h1Match = tsx.match(/<h1\s+style=\{\{([^}]+)\}\}/s);
  if (!h1Match) return null;
  const styleBlock = h1Match[1];
  const fontSizeMatch = styleBlock.match(/fontSize:\s*["']([^"']+)["']/);
  return fontSizeMatch ? fontSizeMatch[1].trim() : null;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("Hero font-size snapshot — Sub-AC 12.3.2", () => {
  // ── CSS token snapshot ────────────────────────────────────────────────────

  it("globals.css contains the --text-hero token", () => {
    const css = readCss();
    assert.ok(
      css.includes(TOKEN_NAME),
      `Token '${TOKEN_NAME}' not found in globals.css — regression detected`,
    );
  });

  it(`--text-hero snapshot matches '${SNAPSHOT_TOKEN_VALUE}'`, () => {
    const css = readCss();
    const value = extractCssVar(css, TOKEN_NAME);
    assert.ok(
      value !== null,
      `Could not extract '${TOKEN_NAME}' from globals.css`,
    );
    assert.strictEqual(
      value,
      SNAPSHOT_TOKEN_VALUE,
      `SNAPSHOT REGRESSION: --text-hero changed from '${SNAPSHOT_TOKEN_VALUE}' to '${value}'`,
    );
  });

  it("--text-hero clamp() arguments are frozen", () => {
    const css = readCss();
    const value = extractCssVar(css, TOKEN_NAME);
    assert.ok(value !== null, `Token '${TOKEN_NAME}' not found`);

    const args = value
      .replace(/^clamp\(/, "")
      .replace(/\)$/, "")
      .split(",")
      .map((s) => s.trim());

    assert.strictEqual(args.length, 3, "clamp() must have exactly 3 arguments");
    assert.strictEqual(args[0], "3rem", `min changed: expected '3rem', got '${args[0]}'`);
    assert.strictEqual(args[2], "8rem", `max changed: expected '8rem', got '${args[2]}'`);
  });

  // ── Hero component token-application snapshot ─────────────────────────────

  it("Hero page source file is readable", () => {
    let src: string;
    try {
      src = readHero();
    } catch (err) {
      assert.fail(`Could not read ${HERO_PATH}: ${(err as Error).message}`);
    }
    assert.ok(src.length > 0, "Landing page source must not be empty");
  });

  it(`Hero h1 fontSize is '${SNAPSHOT_H1_FONT_SIZE}' (token applied)`, () => {
    const tsx = readHero();
    const fontSize = extractH1FontSize(tsx);

    assert.ok(
      fontSize !== null,
      "Could not locate <h1 style={{ ... }}> in landing page — component structure changed",
    );
    assert.strictEqual(
      fontSize,
      SNAPSHOT_H1_FONT_SIZE,
      `SNAPSHOT REGRESSION: Hero h1 fontSize changed from '${SNAPSHOT_H1_FONT_SIZE}' to '${fontSize}'`,
    );
  });

  it("Hero h1 references the CSS token, not a hardcoded value", () => {
    const tsx = readHero();
    const fontSize = extractH1FontSize(tsx);

    assert.ok(fontSize !== null, "Could not extract h1 fontSize");
    assert.ok(
      fontSize.startsWith("var("),
      `Hero h1 fontSize must reference a CSS variable (var(...)). ` +
        `Got '${fontSize}' — hardcoded values break the design token system.`,
    );
    assert.ok(
      fontSize.includes(TOKEN_NAME),
      `Hero h1 fontSize must reference '${TOKEN_NAME}', got '${fontSize}'`,
    );
  });

  // ── Combined snapshot: token value is accessible from the component ───────

  it("token name used in h1 matches the token declared in globals.css", () => {
    const css = readCss();
    const tsx = readHero();

    const h1FontSize = extractH1FontSize(tsx);
    assert.ok(h1FontSize !== null, "Could not extract h1 fontSize");

    // Extract the var name referenced in the h1 fontSize: var(--token-name)
    const varRefMatch = h1FontSize.match(/var\((--[\w-]+)\)/);
    assert.ok(
      varRefMatch !== null,
      `h1 fontSize must be a var() reference, got: '${h1FontSize}'`,
    );

    const referencedToken = varRefMatch[1];
    assert.ok(
      css.includes(referencedToken),
      `Token '${referencedToken}' referenced in h1 is not declared in globals.css`,
    );

    // Verify the referenced token has the snapshotted value
    const tokenValue = extractCssVar(css, referencedToken);
    assert.strictEqual(
      tokenValue,
      SNAPSHOT_TOKEN_VALUE,
      `Token '${referencedToken}' value changed — snapshot mismatch`,
    );
  });
});
