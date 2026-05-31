/**
 * Tests for countEventFiles()
 *
 * AC Sub-2: data/events/ 디렉토리에서 템플릿 제외 JSON 파일 수를 세는
 *           countEventFiles() 함수 + 테스트 (≥ 50건 assertion)
 *
 * Two test suites:
 *  1. Unit tests — isolated temp-dir scenarios proving filter logic
 *  2. Integration test — asserts real data/events/ has ≥ 50 curated files
 *
 * Run: tsx --test src/countEventFiles.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { countEventFiles } from "./countEventFiles.js";

// ---------------------------------------------------------------------------
// Helper: create isolated temp directory
// ---------------------------------------------------------------------------

function makeTempDir(suffix: string): string {
  const dir = join(tmpdir(), `noonchi-count-test-${process.pid}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ---------------------------------------------------------------------------
// Unit tests — controlled temp directories
// ---------------------------------------------------------------------------

describe("countEventFiles — unit", () => {
  it("returns 0 for an empty directory", () => {
    const dir = makeTempDir("empty");
    try {
      assert.equal(countEventFiles(dir), 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("counts a single non-template JSON file", () => {
    const dir = makeTempDir("single");
    writeFileSync(join(dir, "0518-gwangju.json"), "{}");
    try {
      assert.equal(countEventFiles(dir), 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("excludes _template.json (underscore prefix)", () => {
    const dir = makeTempDir("template");
    writeFileSync(join(dir, "_template.json"), "{}");
    writeFileSync(join(dir, "event1.json"), "{}");
    try {
      assert.equal(countEventFiles(dir), 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("excludes all underscore-prefixed files", () => {
    const dir = makeTempDir("underscore");
    writeFileSync(join(dir, "_template.json"), "{}");
    writeFileSync(join(dir, "_schema.json"), "{}");
    writeFileSync(join(dir, "_draft.json"), "{}");
    writeFileSync(join(dir, "real-event.json"), "{}");
    try {
      assert.equal(countEventFiles(dir), 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("excludes non-JSON files (.md, .ts, .txt)", () => {
    const dir = makeTempDir("nonjson");
    writeFileSync(join(dir, "event1.json"), "{}");
    writeFileSync(join(dir, "README.md"), "# readme");
    writeFileSync(join(dir, "types.ts"), "export type T = {};");
    writeFileSync(join(dir, "notes.txt"), "notes");
    try {
      assert.equal(countEventFiles(dir), 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("counts exactly 5 files when 5 non-template JSONs are present", () => {
    const dir = makeTempDir("five");
    for (let i = 1; i <= 5; i++) {
      writeFileSync(join(dir, `event${i}.json`), "{}");
    }
    writeFileSync(join(dir, "_template.json"), "{}");
    try {
      assert.equal(countEventFiles(dir), 5);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("counts 50 files correctly in a synthetic directory", () => {
    const dir = makeTempDir("fifty");
    for (let i = 1; i <= 50; i++) {
      writeFileSync(join(dir, `event-${String(i).padStart(3, "0")}.json`), "{}");
    }
    writeFileSync(join(dir, "_template.json"), "{}");
    try {
      assert.equal(countEventFiles(dir), 50);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Integration test — real data/events/ directory must have ≥ 50 files
// ---------------------------------------------------------------------------

describe("countEventFiles — integration: data/events/ completeness", () => {
  it("data/events/ contains at least 50 curated non-template JSON files", () => {
    const count = countEventFiles(); // uses default path: data/events/
    assert.ok(
      count >= 50,
      `Expected ≥ 50 event files in data/events/, found ${count}. ` +
        `Add more curated events to meet the events_50_curated exit condition.`
    );
  });
});
