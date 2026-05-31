/**
 * Unit test: CSS token --text-hero — Sub-AC 12.3.1
 *
 * Verifies that the main-title font-size design token `--text-hero` is
 * declared in apps/web/app/globals.css with the expected clamp() value.
 *
 * Strategy: parse the CSS file as plain text and extract the token value via
 * regex — no browser, no DOM, no network required.
 *
 * Run: tsx --test regression/css_token_text_hero.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Resolve path relative to this test file ──────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const CSS_PATH = resolve(__dir, "../../apps/web/app/globals.css");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read `globals.css` once and return its contents.
 */
function readGlobalsCss(): string {
  return readFileSync(CSS_PATH, "utf-8");
}

/**
 * Extract the value of a CSS custom property from a stylesheet string.
 * Matches lines of the form:   --property-name: <value>;
 * Returns the trimmed value string, or null if not found.
 */
function extractCssVar(css: string, varName: string): string | null {
  // Pattern: `--varName` followed by optional whitespace, `:`, whitespace, value, `;`
  const pattern = new RegExp(
    `${varName.replace(/-/g, "\\-")}\\s*:\\s*([^;]+);`,
  );
  const match = css.match(pattern);
  return match ? match[1].trim() : null;
}

// ── Token definition ──────────────────────────────────────────────────────────

const TOKEN_NAME = "--text-hero";
const EXPECTED_VALUE = "clamp(3rem, 1rem + 7vw, 8rem)";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CSS token --text-hero — Sub-AC 12.3.1", () => {
  it("globals.css is readable", () => {
    // If the file does not exist, readFileSync throws — surface the error clearly.
    let css: string;
    try {
      css = readGlobalsCss();
    } catch (err) {
      assert.fail(`Could not read ${CSS_PATH}: ${(err as Error).message}`);
    }
    assert.ok(css.length > 0, "globals.css must not be empty");
  });

  it(`--text-hero is declared in globals.css`, () => {
    const css = readGlobalsCss();
    assert.ok(
      css.includes(TOKEN_NAME),
      `Token '${TOKEN_NAME}' not found in globals.css`,
    );
  });

  it(`--text-hero is declared inside the :root block`, () => {
    const css = readGlobalsCss();
    // Find the :root block — from ':root {' up to the matching '}'
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/s);
    assert.ok(
      rootMatch !== null,
      "Could not locate :root { } block in globals.css",
    );
    const rootBlock = rootMatch[1];
    assert.ok(
      rootBlock.includes(TOKEN_NAME),
      `Token '${TOKEN_NAME}' is not inside the :root block`,
    );
  });

  it(`--text-hero value is '${EXPECTED_VALUE}'`, () => {
    const css = readGlobalsCss();
    const value = extractCssVar(css, TOKEN_NAME);
    assert.ok(
      value !== null,
      `Could not extract a value for '${TOKEN_NAME}' from globals.css`,
    );
    assert.strictEqual(
      value,
      EXPECTED_VALUE,
      `Expected --text-hero to be '${EXPECTED_VALUE}', got '${value}'`,
    );
  });

  it("--text-hero uses clamp() for fluid typography", () => {
    const css = readGlobalsCss();
    const value = extractCssVar(css, TOKEN_NAME);
    assert.ok(value !== null, `No value found for '${TOKEN_NAME}'`);
    assert.ok(
      value.startsWith("clamp("),
      `--text-hero must use clamp() for fluid typography, got: '${value}'`,
    );
  });

  it("--text-hero clamp() min value is 3rem", () => {
    const css = readGlobalsCss();
    const value = extractCssVar(css, TOKEN_NAME);
    assert.ok(value !== null, `No value found for '${TOKEN_NAME}'`);
    // First argument of clamp(min, preferred, max)
    const args = value
      .replace(/^clamp\(/, "")
      .replace(/\)$/, "")
      .split(",")
      .map((s) => s.trim());
    assert.strictEqual(
      args[0],
      "3rem",
      `--text-hero clamp() min must be '3rem', got '${args[0]}'`,
    );
  });

  it("--text-hero clamp() max value is 8rem", () => {
    const css = readGlobalsCss();
    const value = extractCssVar(css, TOKEN_NAME);
    assert.ok(value !== null, `No value found for '${TOKEN_NAME}'`);
    const args = value
      .replace(/^clamp\(/, "")
      .replace(/\)$/, "")
      .split(",")
      .map((s) => s.trim());
    assert.strictEqual(
      args[2],
      "8rem",
      `--text-hero clamp() max must be '8rem', got '${args[2]}'`,
    );
  });
});
