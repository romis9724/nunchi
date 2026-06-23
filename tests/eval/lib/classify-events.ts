/**
 * classify-events — pure event loading + rule-coverage classification.
 *
 * Loads the curated event corpus from `data/events/*.json` (skipping any file
 * whose name starts with `_`, e.g. `_template.json`) and decides, per event,
 * whether the in-memory CRITICAL_KEYWORDS rule already short-circuits it to
 * F-grade. The eval harness uses this split to decide the oracle for each
 * generated case: rule-covered events have a deterministic F/critical oracle,
 * rule-gap events fall through to the LLM and need qualitative judgement.
 *
 * Pure + filesystem-only: no DB, no LLM, no network. Safe to run locally.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import type {
  EventCategory,
  RecommendedTone,
  RiskLevel,
} from "@noonchi/shared";
import { CRITICAL_KEYWORDS } from "../../../apps/web/lib/critical-keywords.js";

/**
 * The subset of event fields the harness relies on. Mirrors the on-disk JSON
 * shape (a structural subset of `EventRecord`). Kept local so a schema drift
 * surfaces here rather than silently coercing.
 */
export interface EvalEvent {
  slug: string;
  date_type: string;
  month: number;
  day: number | null;
  day_end?: number | null;
  name: string;
  category: EventCategory;
  risk_level: RiskLevel;
  recommended_tone: RecommendedTone;
  related_keywords: string[];
  summary: string;
}

export interface EventClassification {
  slug: string;
  /** true if some CRITICAL_KEYWORDS term maps to this slug (LLM is skipped). */
  ruleCovered: boolean;
  /** The CRITICAL_KEYWORDS terms whose mapping includes this slug. */
  ruleKeywords: string[];
}

function isEventFile(fileName: string): boolean {
  return fileName.endsWith(".json") && !fileName.startsWith("_");
}

function coerceEvent(raw: unknown, fileName: string): EvalEvent {
  if (raw == null || typeof raw !== "object") {
    throw new Error(`Malformed event JSON (not an object): ${fileName}`);
  }
  const r = raw as Record<string, unknown>;
  const slug = r.slug;
  const name = r.name;
  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error(`Event missing 'slug': ${fileName}`);
  }
  if (typeof name !== "string" || name.length === 0) {
    throw new Error(`Event missing 'name': ${fileName} (${slug})`);
  }
  return {
    slug,
    date_type: String(r.date_type ?? "recurring"),
    month: Number(r.month),
    day: r.day == null ? null : Number(r.day),
    day_end: r.day_end == null ? null : Number(r.day_end),
    name,
    category: r.category as EventCategory,
    risk_level: r.risk_level as RiskLevel,
    recommended_tone: r.recommended_tone as RecommendedTone,
    related_keywords: Array.isArray(r.related_keywords)
      ? (r.related_keywords as unknown[]).map((k) => String(k))
      : [],
    summary: typeof r.summary === "string" ? r.summary : "",
  };
}

/** Load every curated event JSON in `dir`, skipping `_`-prefixed files. */
export function loadEvents(dir: string): EvalEvent[] {
  const files = readdirSync(dir).filter(isEventFile).sort();
  return files.map((fileName) => {
    const full = path.join(dir, fileName);
    const raw = JSON.parse(readFileSync(full, "utf8")) as unknown;
    return coerceEvent(raw, fileName);
  });
}

/**
 * Build the reverse index slug → terms once, then look each event up. Reading
 * CRITICAL_KEYWORDS straight from source keeps this in lock-step with the
 * engine's actual rule table.
 */
function buildSlugToTerms(
  keywords: Record<string, string[]>
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const [term, slugs] of Object.entries(keywords)) {
    for (const slug of slugs) {
      const existing = index.get(slug);
      if (existing) {
        existing.push(term);
      } else {
        index.set(slug, [term]);
      }
    }
  }
  return index;
}

/**
 * Classify a single event against the rule table.
 *
 * @param criticalKeywords term → slugs map (defaults to engine's CRITICAL_KEYWORDS)
 */
export function classifyEvent(
  event: EvalEvent,
  criticalKeywords: Record<string, string[]> = CRITICAL_KEYWORDS
): EventClassification {
  const slugToTerms = buildSlugToTerms(criticalKeywords);
  const ruleKeywords = slugToTerms.get(event.slug) ?? [];
  return {
    slug: event.slug,
    ruleCovered: ruleKeywords.length > 0,
    ruleKeywords,
  };
}
