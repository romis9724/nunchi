/**
 * Stage-0 (local, pure): classify-events
 *
 * Verifies the rule-coverage split that the harness oracle depends on:
 *   - The six RULE-COVERED slugs (from CRITICAL_KEYWORDS) classify as covered.
 *   - A purely commercial event (no rule mapping) classifies as a gap.
 *   - loadEvents skips `_`-prefixed files and returns the full corpus.
 *
 * No DB / LLM / network.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyEvent,
  loadEvents,
  type EvalEvent,
} from "./classify-events.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = path.resolve(HERE, "../../../data/events");

const RULE_COVERED_SLUGS = [
  "gwangju-uprising-0518",
  "korean-war-0625",
  "sewol-ferry-0416",
  "jeju-uprising-0403",
  "liberation-day-0815",
  "itaewon-disaster-1029",
] as const;

function findEvent(events: EvalEvent[], slug: string): EvalEvent {
  const event = events.find((e) => e.slug === slug);
  assert.ok(event, `corpus is missing expected slug "${slug}"`);
  return event;
}

describe("classify-events: loadEvents", () => {
  const events = loadEvents(EVENTS_DIR);

  it("loads the curated corpus and skips _template.json", () => {
    assert.ok(events.length >= 50, `expected >=50 events, got ${events.length}`);
    assert.ok(
      !events.some((e) => e.slug.startsWith("_") || e.slug === "example-event-MMDD"),
      "loadEvents leaked a _-prefixed / template file",
    );
  });

  it("every loaded event has a slug, name and numeric month", () => {
    for (const e of events) {
      assert.ok(e.slug.length > 0, "event with empty slug");
      assert.ok(e.name.length > 0, `event ${e.slug} has empty name`);
      assert.ok(
        Number.isInteger(e.month) && e.month >= 1 && e.month <= 12,
        `event ${e.slug} has invalid month ${e.month}`,
      );
    }
  });
});

describe("classify-events: classifyEvent rule coverage", () => {
  const events = loadEvents(EVENTS_DIR);

  for (const slug of RULE_COVERED_SLUGS) {
    it(`"${slug}" is ruleCovered with non-empty ruleKeywords`, () => {
      const event = findEvent(events, slug);
      const c = classifyEvent(event);
      assert.strictEqual(c.ruleCovered, true, `${slug} expected ruleCovered`);
      assert.ok(
        c.ruleKeywords.length > 0,
        `${slug} expected non-empty ruleKeywords`,
      );
    });
  }

  it("a commercial event (pepero-day) is NOT ruleCovered", () => {
    const event = findEvent(events, "pepero-day-1111");
    // Guard: if the slug ever changes, fall back to any commercial event.
    const c = classifyEvent(event);
    assert.strictEqual(c.ruleCovered, false, "pepero-day unexpectedly ruleCovered");
    assert.deepStrictEqual(c.ruleKeywords, []);
  });

  it("classification can be driven by an injected keyword table", () => {
    const fake: EvalEvent = {
      slug: "made-up-slug",
      date_type: "recurring",
      month: 6,
      day: 1,
      name: "테스트 이벤트",
      category: "commercial",
      risk_level: "low",
      recommended_tone: "neutral",
      related_keywords: [],
      summary: "",
    };
    const covered = classifyEvent(fake, { "단어": ["made-up-slug"] });
    assert.strictEqual(covered.ruleCovered, true);
    assert.deepStrictEqual(covered.ruleKeywords, ["단어"]);

    const gap = classifyEvent(fake, { "단어": ["other-slug"] });
    assert.strictEqual(gap.ruleCovered, false);
  });
});
