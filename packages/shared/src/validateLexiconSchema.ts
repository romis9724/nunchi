/**
 * validateLexiconSchema — data/lexicon/*.json 표현 사전 스키마 검증 (ADR-0004)
 *
 * 순수 함수(node:fs 미사용). 파일 읽기는 호출자가 한다 — 여러 파일에 걸친
 * key 유니크 검사는 호출자가 전체를 합쳐서 한 번에 넘기면 된다.
 */

const VALID_CATEGORIES = [
  "community",
  "gender",
  "region",
  "age",
  "disability",
  "sexual_minority",
  "race",
  "religion",
] as const;

const VALID_TIERS = ["hard", "contextual", "watch"] as const;
const VALID_STATUSES = ["draft", "approved", "deprecated"] as const;
const VALID_SEVERITIES = ["critical", "high", "medium"] as const;
const VALID_PATTERN_TYPES = ["literal", "regex"] as const;
const VALID_SOURCE_TYPES = ["official", "academic", "news", "wiki"] as const;

/** tier 별 허용 severity — hard 가 medium 이거나 watch 가 critical 이면 등급 로직과 어긋난다. */
const SEVERITY_BY_TIER: Record<string, readonly string[]> = {
  hard: ["critical", "high"],
  contextual: ["high", "medium"],
  watch: ["medium"],
};

const REQUIRED_STRING_FIELDS = [
  "key",
  "term",
  "meaning",
  "harmful_example",
  "benign_example",
  "note",
] as const;

export interface ValidateLexiconOptions {
  /** 에러 메시지 접두사 (보통 파일명). 기본값 "entries" */
  label?: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** `new RegExp(value, "u")` 가 던지면 사유를 문자열로 반환, 성공하면 null. */
function regexError(value: string): string | null {
  try {
    new RegExp(value, "u");
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

function validatePatterns(
  raw: unknown,
  where: string,
  errors: string[]
): void {
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push(`${where}.patterns must be a non-empty array`);
    return;
  }

  raw.forEach((pattern, i) => {
    const at = `${where}.patterns[${i}]`;
    if (!isPlainObject(pattern)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!(VALID_PATTERN_TYPES as readonly unknown[]).includes(pattern.type)) {
      errors.push(`${at}.type must be one of: ${VALID_PATTERN_TYPES.join(", ")}`);
    }
    if (!isNonEmptyString(pattern.value)) {
      errors.push(`${at}.value must be a non-empty string`);
      return;
    }
    if (pattern.type !== "regex") return;

    const err = regexError(pattern.value);
    if (err) errors.push(`${at}.value is not a valid RegExp: ${err}`);
  });
}

function validateSources(
  raw: unknown,
  where: string,
  status: unknown,
  errors: string[]
): void {
  if (!Array.isArray(raw)) {
    errors.push(`${where}.sources must be an array`);
    return;
  }

  let nonWikiCount = 0;
  raw.forEach((source, i) => {
    const at = `${where}.sources[${i}]`;
    if (!isPlainObject(source)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!isNonEmptyString(source.label)) {
      errors.push(`${at}.label must be a non-empty string`);
    }
    if (!isNonEmptyString(source.url)) {
      errors.push(`${at}.url must be a non-empty string`);
    }
    if (!(VALID_SOURCE_TYPES as readonly unknown[]).includes(source.type)) {
      errors.push(`${at}.type must be one of: ${VALID_SOURCE_TYPES.join(", ")}`);
    } else if (source.type !== "wiki") {
      nonWikiCount += 1;
    }
    if (!isNonEmptyString(source.accessed)) {
      errors.push(`${at}.accessed must be a non-empty ISO date string`);
    }
  });

  // ADR-0004 데이터 원칙: 위키 단독 출처로는 approved 불가.
  if (status === "approved" && nonWikiCount === 0) {
    errors.push(
      `${where}.sources must contain at least one non-wiki source when status is "approved"`
    );
  }
}

/**
 * 표현 사전 항목 배열을 검증한다.
 *
 * @returns 사람이 읽을 수 있는 오류 메시지 배열. 빈 배열이면 통과.
 */
export function validateLexiconEntries(
  entries: unknown[],
  opts?: ValidateLexiconOptions
): string[] {
  const label = opts?.label ?? "entries";
  const errors: string[] = [];
  const seenKeys = new Set<string>();

  entries.forEach((entry, idx) => {
    const where = `${label}[${idx}]`;

    if (!isPlainObject(entry)) {
      errors.push(`${where} must be an object`);
      return;
    }

    for (const field of REQUIRED_STRING_FIELDS) {
      // hard 티어는 정의상 정상 용법이 없으므로 benign_example 은 빈 문자열을 허용한다.
      if (field === "benign_example" && entry.tier === "hard" && entry[field] === "") {
        continue;
      }
      // watch 티어는 기원·의미가 다투어지는 표현이라 공격 용례를 단정하지 않을 수 있다.
      if (field === "harmful_example" && entry.tier === "watch" && entry[field] === "") {
        continue;
      }
      if (!isNonEmptyString(entry[field])) {
        errors.push(`${where}.${field} must be a non-empty string`);
      }
    }

    if (isNonEmptyString(entry.key)) {
      if (seenKeys.has(entry.key)) {
        errors.push(`${where}.key "${entry.key}" is duplicated`);
      }
      seenKeys.add(entry.key);
    }

    if (!(VALID_CATEGORIES as readonly unknown[]).includes(entry.category)) {
      errors.push(`${where}.category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    if (!(VALID_STATUSES as readonly unknown[]).includes(entry.status)) {
      errors.push(`${where}.status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    if (!(VALID_SEVERITIES as readonly unknown[]).includes(entry.severity)) {
      errors.push(`${where}.severity must be one of: ${VALID_SEVERITIES.join(", ")}`);
    }

    if (!(VALID_TIERS as readonly unknown[]).includes(entry.tier)) {
      errors.push(`${where}.tier must be one of: ${VALID_TIERS.join(", ")}`);
    } else {
      const allowed = SEVERITY_BY_TIER[entry.tier as string];
      if (
        (VALID_SEVERITIES as readonly unknown[]).includes(entry.severity) &&
        !allowed.includes(entry.severity as string)
      ) {
        errors.push(
          `${where}.severity "${entry.severity}" is not allowed for tier "${entry.tier}" (allowed: ${allowed.join(", ")})`
        );
      }
      // contextual 은 정상 용법과 겹치는 표현 — 정상 용례 없이는 문맥 판정을 못 한다.
      if (entry.tier === "contextual" && (!isStringArray(entry.benign_usages) || entry.benign_usages.length === 0)) {
        errors.push(`${where}.benign_usages must contain at least one entry for tier "contextual"`);
      }
    }

    if (!isStringArray(entry.benign_usages)) {
      errors.push(`${where}.benign_usages must be an array of strings`);
    }

    if (entry.cooccur !== undefined) {
      if (!isStringArray(entry.cooccur)) {
        errors.push(`${where}.cooccur must be an array of strings`);
      } else {
        entry.cooccur.forEach((c, i) => {
          const err = regexError(c);
          if (err) errors.push(`${where}.cooccur[${i}] is not a valid RegExp: ${err}`);
        });
      }
    }

    if (entry.alternative !== undefined && !isNonEmptyString(entry.alternative)) {
      errors.push(`${where}.alternative must be a non-empty string when present`);
    }

    validatePatterns(entry.patterns, where, errors);
    validateSources(entry.sources, where, entry.status, errors);
  });

  return errors;
}
