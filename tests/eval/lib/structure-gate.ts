/**
 * structure-gate — deterministic pass/fail evaluation of an engine response
 * against a generated case oracle.
 *
 * Only the *hard*, machine-checkable contract is asserted here (rule firing,
 * forced grades, flagged-keyword membership, matched-event presence + their
 * deterministic toneToGrade). The LLM's final free-text grade band is NOT a
 * hard requirement — that lives in `softWarnings`, so a model that is merely
 * over- or under-cautious does not fail the structural suite.
 *
 * Pure: no DB, no LLM, no network.
 */
import type { CheckResponse, MatchedEvent } from "@noonchi/shared";

import type { EvalCase } from "./generate-cases.js";

export interface StructureResult {
  pass: boolean;
  /** Human-readable hard failures (empty ⇒ pass). */
  failures: string[];
  /** Non-blocking observations about the LLM grade band. */
  softWarnings: string[];
}

function findMatched(
  response: CheckResponse,
  slug: string
): MatchedEvent | undefined {
  return response.matchedEvents.find((e) => e.slug === slug);
}

function checkHard(evalCase: EvalCase, response: CheckResponse): string[] {
  const { oracle } = evalCase;
  const failures: string[] = [];

  if (oracle.ruleTriggered !== response.ruleTriggered) {
    failures.push(
      `ruleTriggered: expected ${oracle.ruleTriggered}, got ${response.ruleTriggered}`
    );
  }

  // grade / riskScore are hard only for rule-covered banned cases.
  if (oracle.grade !== undefined && response.grade !== oracle.grade) {
    failures.push(`grade: expected ${oracle.grade}, got ${response.grade}`);
  }
  if (oracle.riskScore !== undefined && response.riskScore !== oracle.riskScore) {
    failures.push(
      `riskScore: expected ${oracle.riskScore}, got ${response.riskScore}`
    );
  }

  if (oracle.flaggedKeywordsInclude) {
    for (const kw of oracle.flaggedKeywordsInclude) {
      if (!response.flaggedKeywords.includes(kw)) {
        failures.push(
          `flaggedKeywords missing "${kw}" (got ${JSON.stringify(response.flaggedKeywords)})`
        );
      }
    }
  }

  if (oracle.flaggedKeywordsEmpty && response.flaggedKeywords.length > 0) {
    failures.push(
      `flaggedKeywords expected empty, got ${JSON.stringify(response.flaggedKeywords)}`
    );
  }

  if (oracle.matchedEventsEmpty && response.matchedEvents.length > 0) {
    failures.push(
      `matchedEvents expected empty (rule short-circuit), got ${response.matchedEvents.length} event(s)`
    );
  }

  if (oracle.matchedEventsInclude) {
    const matched = findMatched(response, oracle.matchedEventsInclude);
    if (!matched) {
      const slugs = response.matchedEvents.map((e) => e.slug ?? "(no-slug)");
      failures.push(
        `matchedEvents missing slug "${oracle.matchedEventsInclude}" (got ${JSON.stringify(slugs)})`
      );
    }
  }

  if (oracle.matchedEventGrade) {
    const { slug, grade } = oracle.matchedEventGrade;
    const matched = findMatched(response, slug);
    if (!matched) {
      failures.push(
        `matchedEventGrade: slug "${slug}" not present in matchedEvents`
      );
    } else if (matched.grade !== grade) {
      failures.push(
        `matchedEventGrade["${slug}"]: expected ${grade}, got ${matched.grade}`
      );
    }
  }

  return failures;
}

function checkSoft(evalCase: EvalCase, response: CheckResponse): string[] {
  const warnings: string[] = [];

  // Over-blocking: a benign neutral copy should not be hard-F'd by the LLM.
  if (evalCase.kind === "benign" && response.grade === "F") {
    warnings.push(
      `over-block: benign copy graded F (event ${evalCase.eventSlug}) — possible false positive`
    );
  }

  // Under-flagging on a rule-gap banned case: LLM grade outside expected band.
  const band = evalCase.qualitative.llmShouldFlagGradeIn;
  if (band && band.length > 0 && !band.includes(response.grade)) {
    warnings.push(
      `under-flag: rule-gap banned graded ${response.grade}, expected one of ${JSON.stringify(band)} (event ${evalCase.eventSlug})`
    );
  }

  return warnings;
}

/** Evaluate one engine response against its case oracle. */
export function evaluateStructure(
  evalCase: EvalCase,
  response: CheckResponse
): StructureResult {
  const failures = checkHard(evalCase, response);
  const softWarnings = checkSoft(evalCase, response);
  return { pass: failures.length === 0, failures, softWarnings };
}
