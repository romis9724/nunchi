/**
 * AC 1: No /api/waitlist* route files exist on disk — Sub-AC 1.1
 *
 * File-system assertion confirming that the waitlist API route handlers have
 * been fully removed from the Next.js App Router source tree.
 *
 * Any request to /api/waitlist* will therefore return 404 (Next.js default
 * behaviour when no route handler file is present).
 *
 * Run: tsx --test regression/waitlist_route_removed.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

describe("AC 1 — Waitlist API routes fully removed", () => {
  it("apps/web/app/api/waitlist directory does not exist", () => {
    const waitlistDir = join(ROOT, "apps/web/app/api/waitlist");
    assert.ok(
      !existsSync(waitlistDir),
      `Expected no waitlist route directory, but found: ${waitlistDir}`
    );
  });

  it("no entry starting with 'waitlist' exists under apps/web/app/api", () => {
    const apiDir = join(ROOT, "apps/web/app/api");

    // If the entire api directory is absent, there can be no waitlist route.
    if (!existsSync(apiDir)) {
      return;
    }

    const entries = readdirSync(apiDir, { withFileTypes: true });
    const waitlistEntries = entries.filter((e) => e.name.startsWith("waitlist"));

    assert.equal(
      waitlistEntries.length,
      0,
      `Expected no waitlist entries under ${apiDir}, found: ${waitlistEntries
        .map((e) => e.name)
        .join(", ")}`
    );
  });
});
