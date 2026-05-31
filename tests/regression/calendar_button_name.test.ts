/**
 * Regression: AC6 — Calendar page button name changed to '캠페인 캘린더'
 *
 * Verifies that:
 *  1. CalendarClient.tsx renders '캠페인 캘린더' as the page h1 heading.
 *  2. The check page nav link to /calendar is labelled '캠페인 캘린더'.
 *
 * Both checks are pure source-file text scans — no DOM, no React, no network.
 *
 * Run: tsx --test regression/calendar_button_name.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

describe("AC6 — Calendar button name is '캠페인 캘린더'", () => {
  it("CalendarClient.tsx h1 heading contains '캠페인 캘린더'", () => {
    const src = readFileSync(
      join(ROOT, "apps/web/app/calendar/CalendarClient.tsx"),
      "utf8",
    );
    assert.ok(
      src.includes("캠페인 캘린더"),
      "CalendarClient.tsx must render '캠페인 캘린더' as the page heading",
    );
  });

  it("CalendarClient.tsx does not still use '민감일 캘린더' as the h1 heading", () => {
    const src = readFileSync(
      join(ROOT, "apps/web/app/calendar/CalendarClient.tsx"),
      "utf8",
    );
    // The old label must no longer appear as JSX content inside <h1>.
    // We check the full file — if the old string is absent, the rename is done.
    assert.ok(
      !src.includes("민감일 캘린더"),
      "Old label '민감일 캘린더' must be removed from CalendarClient.tsx",
    );
  });

  it("check/page.tsx nav link to /calendar is labelled '캠페인 캘린더'", () => {
    const src = readFileSync(
      join(ROOT, "apps/web/app/check/page.tsx"),
      "utf8",
    );
    assert.ok(
      src.includes("캠페인 캘린더"),
      "check/page.tsx nav link to /calendar must be labelled '캠페인 캘린더'",
    );
  });
});
