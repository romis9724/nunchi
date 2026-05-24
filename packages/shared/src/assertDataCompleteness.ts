/**
 * assertDataCompleteness — 이벤트 JSON 내용 완전성(content completeness) 검사 모듈
 *
 * 스키마 유효성(validateEventSchema)과 별개로,
 * 세 핵심 콘텐츠 필드가 실질적인 값을 갖고 있는지 검사한다:
 *   - related_keywords[]  — 빈 배열 불허, 빈 문자열 원소 불허
 *   - references[]        — 빈 배열 불허, 빈 문자열 label·url 불허
 *   - summary             — 빈 문자열 불허
 *
 * assertDataCompleteness(data, label?) 는 위반이 있으면 Error를 throw 하고,
 * 없으면 조용히 반환한다 (assertion 패턴).
 *
 * checkDataCompleteness(data) 는 동일한 로직을 { valid, errors } 형태로 반환한다.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CompletenessResult {
  /** true when all three content fields are non-empty */
  valid: boolean;
  /** human-readable list of completeness violations; empty when valid === true */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Internal check logic
// ---------------------------------------------------------------------------

function collectCompletenessErrors(data: unknown): string[] {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push("Root value must be a JSON object");
    return errors;
  }

  const rec = data as Record<string, unknown>;

  // ── related_keywords ───────────────────────────────────────────────────────
  if (!("related_keywords" in rec)) {
    errors.push("Missing field: related_keywords");
  } else if (!Array.isArray(rec.related_keywords)) {
    errors.push("Field 'related_keywords' must be an array");
  } else if ((rec.related_keywords as unknown[]).length === 0) {
    errors.push(
      "Field 'related_keywords' must not be empty — at least one keyword is required"
    );
  } else {
    (rec.related_keywords as unknown[]).forEach((kw, idx) => {
      if (typeof kw !== "string" || kw.trim() === "") {
        errors.push(
          `related_keywords[${idx}] must be a non-empty string`
        );
      }
    });
  }

  // ── references ─────────────────────────────────────────────────────────────
  if (!("references" in rec)) {
    errors.push("Missing field: references");
  } else if (!Array.isArray(rec.references)) {
    errors.push("Field 'references' must be an array");
  } else if ((rec.references as unknown[]).length === 0) {
    errors.push(
      "Field 'references' must not be empty — at least one reference is required"
    );
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
    });
  }

  // ── summary ────────────────────────────────────────────────────────────────
  if (!("summary" in rec)) {
    errors.push("Missing field: summary");
  } else if (typeof rec.summary !== "string" || rec.summary.trim() === "") {
    errors.push(
      "Field 'summary' must be a non-empty string"
    );
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the three content-completeness fields are non-empty.
 * Returns `{ valid, errors }` without throwing — suitable for batch checks.
 */
export function checkDataCompleteness(data: unknown): CompletenessResult {
  const errors = collectCompletenessErrors(data);
  return { valid: errors.length === 0, errors };
}

/**
 * Assert that the three content-completeness fields are non-empty.
 * Throws `Error` listing all violations if any field is empty.
 * Does nothing when the data is complete.
 *
 * @param data   Parsed JSON value (e.g. the result of JSON.parse())
 * @param label  Optional identifier shown in the error message (e.g. file name)
 */
export function assertDataCompleteness(data: unknown, label?: string): void {
  const errors = collectCompletenessErrors(data);

  if (errors.length > 0) {
    const prefix = label ? `[${label}] ` : "";
    throw new Error(
      `${prefix}Data completeness check failed (${errors.length} violation${
        errors.length === 1 ? "" : "s"
      }):\n  - ${errors.join("\n  - ")}`
    );
  }
}
