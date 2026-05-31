/**
 * Sub-AC 1.2.2 — WaitlistForm / WaitlistPage absent from page render trees
 *
 * Reads the source of every application entry-point page (route modules) and
 * asserts that no React node named WaitlistForm, WaitlistPage, or a matching
 * displayName/type would appear in the rendered component tree.
 *
 * Strategy: static analysis of the JSX source is the render-tree inspection
 * for this test environment (Node.js built-in runner, no DOM/JSDOM). Any of
 * the following patterns in the page source indicates the node WOULD appear in
 * the rendered output:
 *
 *   • JSX open-tag:                 <WaitlistForm   or  <WaitlistPage
 *   • React.createElement by name:  React.createElement("WaitlistForm"/"WaitlistPage")
 *   • Function component declaration (displayName = function name):
 *       function WaitlistForm(  |  function WaitlistPage(
 *   • Arrow / const component declaration:
 *       const WaitlistForm =   |  const WaitlistPage =
 *   • Class component declaration:
 *       class WaitlistForm     |  class WaitlistPage
 *
 * The test FAILS if any such pattern is detected. It PASSES when the
 * patterns are absent, confirming the nodes are not renderable from the page.
 *
 * Run: tsx --test regression/no_waitlist_in_render.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ---------------------------------------------------------------------------
// Entry-point pages — every route that Next.js renders as an application page
// ---------------------------------------------------------------------------
const PAGE_FILES: string[] = [
  "apps/web/app/(landing)/page.tsx",
  "apps/web/app/check/page.tsx",
  "apps/web/app/calendar/page.tsx",
];

// ---------------------------------------------------------------------------
// Forbidden patterns
//
// Each pattern represents a way that a WaitlistForm or WaitlistPage React node
// could appear in the rendered component tree.
// ---------------------------------------------------------------------------
interface ForbiddenPattern {
  label: string;
  regex: RegExp;
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // ── JSX element open-tags ────────────────────────────────────────────────
  {
    label: "JSX element <WaitlistForm",
    regex: /<WaitlistForm[\s/>]/,
  },
  {
    label: "JSX element <WaitlistPage",
    regex: /<WaitlistPage[\s/>]/,
  },
  // ── React.createElement calls with string name ───────────────────────────
  {
    label: 'React.createElement("WaitlistForm")',
    regex: /React\.createElement\s*\(\s*["']WaitlistForm["']/,
  },
  {
    label: 'React.createElement("WaitlistPage")',
    regex: /React\.createElement\s*\(\s*["']WaitlistPage["']/,
  },
  // ── Function component declarations (displayName equals function name) ───
  {
    label: "function WaitlistForm declaration",
    regex: /function\s+WaitlistForm\s*[(<]/,
  },
  {
    label: "function WaitlistPage declaration",
    regex: /function\s+WaitlistPage\s*[(<]/,
  },
  // ── Arrow / const component declarations ────────────────────────────────
  {
    label: "const WaitlistForm = ... (component declaration)",
    regex: /\bconst\s+WaitlistForm\s*=/,
  },
  {
    label: "const WaitlistPage = ... (component declaration)",
    regex: /\bconst\s+WaitlistPage\s*=/,
  },
  // ── Class component declarations ─────────────────────────────────────────
  {
    label: "class WaitlistForm",
    regex: /\bclass\s+WaitlistForm\b/,
  },
  {
    label: "class WaitlistPage",
    regex: /\bclass\s+WaitlistPage\b/,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Sub-AC 1.2.2 — no WaitlistForm / WaitlistPage node in page render trees", () => {
  for (const relPath of PAGE_FILES) {
    const absPath = resolve(ROOT, relPath);

    // Confirm the page file exists so that the scan below is meaningful
    it(`${relPath} — page file exists on disk`, () => {
      assert.ok(
        existsSync(absPath),
        `Expected page file to exist: ${relPath}. ` +
          "If this route is intentionally absent, remove it from PAGE_FILES."
      );
    });

    // Check each forbidden pattern against the page's source
    for (const { label, regex } of FORBIDDEN_PATTERNS) {
      it(`${relPath} — render tree must not contain: ${label}`, () => {
        // If the file is absent (caught by the existence test above) skip the
        // source scan — there is no render tree to check.
        if (!existsSync(absPath)) return;

        const source = readFileSync(absPath, "utf-8");
        const matched = regex.test(source);

        assert.ok(
          !matched,
          `Forbidden render-tree node detected in ${relPath}.\n` +
            `Pattern "${label}" matched ${regex}.\n` +
            "WaitlistForm and WaitlistPage must not appear anywhere in " +
            "entry-point page render trees after the MVP → Beta transition."
        );
      });
    }
  }
});
