/**
 * Sub-AC 1.2.1 — WaitlistForm and WaitlistPage source files absent
 *
 * File-system assertion confirming that no dedicated WaitlistForm or
 * WaitlistPage module files exist on disk at any of their conventional
 * paths.  If either file is present the test fails, signalling that the
 * removal step was not completed.
 *
 * "cannot be resolved via import" is satisfied when no matching file
 * exists — Node module resolution would throw ERR_MODULE_NOT_FOUND in
 * that case.
 *
 * Run: tsx --test regression/waitlist_form_page_removed.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

// All conventional paths where a standalone WaitlistForm module could live.
const WAITLIST_FORM_PATHS = [
  "apps/web/components/WaitlistForm.tsx",
  "apps/web/components/WaitlistForm.ts",
  "apps/web/components/WaitlistForm/index.tsx",
  "apps/web/components/WaitlistForm/index.ts",
  "apps/web/components/waitlist-form.tsx",
  "apps/web/components/waitlist-form.ts",
  "apps/web/components/waitlist/WaitlistForm.tsx",
  "apps/web/components/waitlist/WaitlistForm.ts",
  "apps/web/app/(landing)/WaitlistForm.tsx",
  "apps/web/app/(landing)/WaitlistForm.ts",
];

// All conventional paths where a standalone WaitlistPage module could live.
const WAITLIST_PAGE_PATHS = [
  "apps/web/app/waitlist/page.tsx",
  "apps/web/app/waitlist/page.ts",
  "apps/web/app/(landing)/WaitlistPage.tsx",
  "apps/web/app/(landing)/WaitlistPage.ts",
  "apps/web/app/(waitlist)/page.tsx",
  "apps/web/app/(waitlist)/page.ts",
  "apps/web/components/WaitlistPage.tsx",
  "apps/web/components/WaitlistPage.ts",
];

describe("Sub-AC 1.2.1 — WaitlistForm source file does not exist on disk", () => {
  for (const relPath of WAITLIST_FORM_PATHS) {
    it(`${relPath} — absent`, () => {
      const absPath = join(ROOT, relPath);
      assert.ok(
        !existsSync(absPath),
        `WaitlistForm module must not exist at ${relPath} — found on disk`
      );
    });
  }
});

describe("Sub-AC 1.2.1 — WaitlistPage source file does not exist on disk", () => {
  for (const relPath of WAITLIST_PAGE_PATHS) {
    it(`${relPath} — absent`, () => {
      const absPath = join(ROOT, relPath);
      assert.ok(
        !existsSync(absPath),
        `WaitlistPage module must not exist at ${relPath} — found on disk`
      );
    });
  }
});
