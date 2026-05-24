/**
 * validateEventSchema — data/events/ JSON 스키마 검증 모듈
 *
 * AC 필수 필드: id(slug), date(month+date_type), country, name, category,
 *              risk_level, related_keywords, related_motifs,
 *              recommended_tone, summary, references
 */

import { readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Valid enum values — keep in sync with types.ts
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = [
  "massacre",
  "disaster",
  "political",
  "social",
  "memorial",
  "independence",
  "labor",
  "human_rights",
  "celebration",
  "commercial",
] as const;

const VALID_RISK_LEVELS = ["critical", "high", "medium", "low"] as const;

const VALID_RECOMMENDED_TONES = [
  "avoid",
  "memorial",
  "neutral",
  "celebration",
] as const;

const VALID_DATE_TYPES = ["fixed", "recurring", "range"] as const;

const VALID_REFERENCE_TYPES = [
  "official",
  "academic",
  "media",
  "wiki",
] as const;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  /** true when all required fields are present and type-correct */
  valid: boolean;
  /** human-readable list of problems; empty when valid === true */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Core validation — operates on an already-parsed value
// ---------------------------------------------------------------------------

/**
 * Validate a parsed JSON value against the event schema.
 * Exported for unit tests that supply inline data rather than a file path.
 */
export function validateEventData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { valid: false, errors: ["Root value must be a JSON object"] };
  }

  const rec = data as Record<string, unknown>;

  // ── id (slug) ──────────────────────────────────────────────────────────────
  if (!("slug" in rec)) {
    errors.push("Missing required field: slug (id)");
  } else if (typeof rec.slug !== "string" || rec.slug.trim() === "") {
    errors.push("Field 'slug' must be a non-empty string");
  }

  // ── date: date_type ────────────────────────────────────────────────────────
  if (!("date_type" in rec)) {
    errors.push("Missing required field: date_type");
  } else if (!(VALID_DATE_TYPES as ReadonlyArray<unknown>).includes(rec.date_type)) {
    errors.push(
      `Field 'date_type' must be one of: ${VALID_DATE_TYPES.join(", ")}`
    );
  }

  // ── date: month ────────────────────────────────────────────────────────────
  if (!("month" in rec)) {
    errors.push("Missing required field: month (date)");
  } else if (
    typeof rec.month !== "number" ||
    !Number.isInteger(rec.month) ||
    rec.month < 1 ||
    rec.month > 12
  ) {
    errors.push("Field 'month' must be an integer between 1 and 12");
  }

  // ── country ────────────────────────────────────────────────────────────────
  if (!("country" in rec)) {
    errors.push("Missing required field: country");
  } else if (typeof rec.country !== "string" || rec.country.trim() === "") {
    errors.push("Field 'country' must be a non-empty string");
  }

  // ── name ───────────────────────────────────────────────────────────────────
  if (!("name" in rec)) {
    errors.push("Missing required field: name");
  } else if (typeof rec.name !== "string" || rec.name.trim() === "") {
    errors.push("Field 'name' must be a non-empty string");
  }

  // ── category ───────────────────────────────────────────────────────────────
  if (!("category" in rec)) {
    errors.push("Missing required field: category");
  } else if (
    !(VALID_CATEGORIES as ReadonlyArray<unknown>).includes(rec.category)
  ) {
    errors.push(
      `Field 'category' must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  // ── risk_level ─────────────────────────────────────────────────────────────
  if (!("risk_level" in rec)) {
    errors.push("Missing required field: risk_level");
  } else if (
    !(VALID_RISK_LEVELS as ReadonlyArray<unknown>).includes(rec.risk_level)
  ) {
    errors.push(
      `Field 'risk_level' must be one of: ${VALID_RISK_LEVELS.join(", ")}`
    );
  }

  // ── related_keywords ───────────────────────────────────────────────────────
  if (!("related_keywords" in rec)) {
    errors.push("Missing required field: related_keywords");
  } else if (!Array.isArray(rec.related_keywords)) {
    errors.push("Field 'related_keywords' must be an array");
  } else if (
    !(rec.related_keywords as unknown[]).every((k) => typeof k === "string")
  ) {
    errors.push("Field 'related_keywords' must be an array of strings");
  }

  // ── related_motifs ─────────────────────────────────────────────────────────
  if (!("related_motifs" in rec)) {
    errors.push("Missing required field: related_motifs");
  } else if (!Array.isArray(rec.related_motifs)) {
    errors.push("Field 'related_motifs' must be an array");
  } else if (
    !(rec.related_motifs as unknown[]).every((m) => typeof m === "string")
  ) {
    errors.push("Field 'related_motifs' must be an array of strings");
  }

  // ── recommended_tone ───────────────────────────────────────────────────────
  if (!("recommended_tone" in rec)) {
    errors.push("Missing required field: recommended_tone");
  } else if (
    !(VALID_RECOMMENDED_TONES as ReadonlyArray<unknown>).includes(
      rec.recommended_tone
    )
  ) {
    errors.push(
      `Field 'recommended_tone' must be one of: ${VALID_RECOMMENDED_TONES.join(", ")}`
    );
  }

  // ── summary ────────────────────────────────────────────────────────────────
  if (!("summary" in rec)) {
    errors.push("Missing required field: summary");
  } else if (typeof rec.summary !== "string" || rec.summary.trim() === "") {
    errors.push("Field 'summary' must be a non-empty string");
  }

  // ── references ─────────────────────────────────────────────────────────────
  if (!("references" in rec)) {
    errors.push("Missing required field: references");
  } else if (!Array.isArray(rec.references)) {
    errors.push("Field 'references' must be an array");
  } else if ((rec.references as unknown[]).length === 0) {
    errors.push("Field 'references' must contain at least one entry");
  } else {
    (rec.references as unknown[]).forEach((ref, idx) => {
      if (typeof ref !== "object" || ref === null || Array.isArray(ref)) {
        errors.push(`references[${idx}] must be an object`);
        return;
      }
      const r = ref as Record<string, unknown>;

      if (typeof r.label !== "string" || r.label.trim() === "") {
        errors.push(`references[${idx}].label must be a non-empty string`);
      }
      if (typeof r.url !== "string" || r.url.trim() === "") {
        errors.push(`references[${idx}].url must be a non-empty string`);
      }
      if (!(VALID_REFERENCE_TYPES as ReadonlyArray<unknown>).includes(r.type)) {
        errors.push(
          `references[${idx}].type must be one of: ${VALID_REFERENCE_TYPES.join(", ")}`
        );
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// File-based entry point (the AC-required public function)
// ---------------------------------------------------------------------------

/**
 * Read `filePath`, parse it as JSON, and validate it against the event schema.
 *
 * @param filePath  Absolute or relative path to a `.json` event file.
 * @returns         `{ valid, errors }` — `valid` is true only when all
 *                  required fields are present and type-correct.
 */
export function validateEventSchema(filePath: string): ValidationResult {
  let data: unknown;

  try {
    const content = readFileSync(filePath, "utf-8");
    data = JSON.parse(content);
  } catch (err) {
    return {
      valid: false,
      errors: [
        `Cannot read or parse file "${filePath}": ${
          err instanceof Error ? err.message : String(err)
        }`,
      ],
    };
  }

  return validateEventData(data);
}
