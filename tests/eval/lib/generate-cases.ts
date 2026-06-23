/**
 * generate-cases — deterministic per-event eval case + oracle synthesis.
 *
 * For every curated event we emit exactly two cases:
 *
 *   - "banned"  : copy seeded with an avoidance term. For rule-covered events
 *                 the seeded term is one of the engine's CRITICAL_KEYWORDS, so
 *                 the oracle is a hard F/critical short-circuit. For rule-gap
 *                 events the seed is the event's own first related_keyword, so
 *                 the rule does NOT fire and the LLM must catch it instead.
 *   - "benign"  : a neutral commercial copy dated on the event's own day. The
 *                 rule must not fire; the engine should still surface the event
 *                 via ±3-day proximity, with a deterministic matchedEvent grade.
 *
 * Everything here is pure: oracles are computed from the event data + the rule
 * table + toneToGrade, never from a live engine response.
 */
import { toneToGrade } from "@noonchi/shared";
import type { CheckRequest, Grade } from "@noonchi/shared";
import { matchCriticalKeywords } from "../../../apps/web/lib/critical-keywords.js";

import type { EvalEvent } from "./classify-events.js";
import { classifyEvent } from "./classify-events.js";

/** 등급 심각도(낮을수록 안전). banded 기대 산출에 사용. */
const GRADE_SEVERITY: Record<Grade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };
const ALL_GRADES: Grade[] = ["A", "B", "C", "D", "F"];

/** expected 이상으로 심각한 등급 집합(= 허용 밴드). LLM이 더 관대하면 under-flag. */
function bandAtLeast(expected: Grade): Grade[] {
  return ALL_GRADES.filter((g) => GRADE_SEVERITY[g] >= GRADE_SEVERITY[expected]);
}

export type CaseKind = "banned" | "benign";

/** Hard, deterministic assertions the structure gate enforces. */
export interface CaseOracle {
  ruleTriggered: boolean;
  /** Present only for rule-covered banned cases (engine forces F). */
  grade?: Grade;
  /** Present only for rule-covered banned cases (engine forces critical). */
  riskScore?: "safe" | "caution" | "danger" | "critical";
  /** These terms MUST all appear in response.flaggedKeywords. */
  flaggedKeywordsInclude?: string[];
  /** response.flaggedKeywords MUST be empty. */
  flaggedKeywordsEmpty?: boolean;
  /** response.matchedEvents MUST be empty (rule short-circuit). */
  matchedEventsEmpty?: boolean;
  /** response.matchedEvents MUST contain a matchedEvent with this slug. */
  matchedEventsInclude?: string;
  /** The matchedEvent with `slug` MUST carry this deterministic grade. */
  matchedEventGrade?: { slug: string; grade: Grade };
}

/** Soft, LLM-band expectations — warnings only, never hard failures. */
export interface CaseQualitative {
  /** false → no LLM was invoked (rule short-circuit), skip the judge. */
  applicable: boolean;
  /** The event name the LLM rationale should reference. */
  mustIdentifyEvent?: string;
  /** For rule-gap banned cases: the LLM grade should land in this band. */
  llmShouldFlagGradeIn?: Grade[];
}

export interface EvalCase {
  id: string;
  eventSlug: string;
  kind: CaseKind;
  request: CheckRequest;
  oracle: CaseOracle;
  qualitative: CaseQualitative;
  /** True when the benign date had to be approximated (day was null). */
  dateApprox?: boolean;
}

/** Neutral commercial copy pool, rotated by event index to keep it varied. */
const BENIGN_COPY_POOL = [
  "봄 신상 컬렉션을 선보입니다",
  "주말 한정 할인 이벤트",
  "새로운 멤버십 혜택 안내",
  "신메뉴 출시 소식",
  "고객 감사 사은품 증정",
] as const;

/** Campaign-name prefix so eval-generated cache rows are identifiable. */
export const EVAL_CAMPAIGN_PREFIX = "__EVAL__";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Synthesize the YYYY-MM-DD for a benign case. Uses 2025 as a stable,
 * non-leap reference year. day=null events approximate to day_end || 1.
 */
function synthDate(event: EvalEvent): { date: string; approx: boolean } {
  const approx = event.day == null;
  const day = event.day ?? event.day_end ?? 1;
  return { date: `2025-${pad2(event.month)}-${pad2(day)}`, approx };
}

function bannedCopy(seed: string): string {
  return `${seed} 신상 캠페인 출시 안내`;
}

function buildBannedCase(
  event: EvalEvent,
  index: number
): EvalCase {
  const cls = classifyEvent(event);
  const id = `${event.slug}::banned`;
  const { date, approx } = synthDate(event);
  const expectedGrade = toneToGrade(event.recommended_tone, event.risk_level);

  // seed 선택: rule-covered면 해당 이벤트로 매핑되는 CRITICAL term.
  // rule-gap이면 CRITICAL term이 아닌 related_keyword를 우선(진짜 LLM 갭 테스트),
  // 없으면 첫 related_keyword(또는 이름 조각)로 폴백.
  let seed: string;
  if (cls.ruleCovered) {
    seed = cls.ruleKeywords[0];
  } else {
    const nonCritical = event.related_keywords.find(
      (k) => matchCriticalKeywords({ copy: k }).length === 0
    );
    seed = nonCritical ?? event.related_keywords[0] ?? event.name.slice(0, 4);
  }
  const copy = bannedCopy(seed);
  // campaignName에 slug/answer를 넣지 않는다 — LLM에 정답이 새지 않도록.
  const request: CheckRequest = {
    date,
    campaignName: EVAL_CAMPAIGN_PREFIX,
    copy,
    assetKeywords: [],
  };

  // 결정론: 이 copy로 룰이 실제 발화하는지 계산해 오라클을 맞춘다(가짜 실패 방지).
  const ruleHits = matchCriticalKeywords({ copy, campaignName: EVAL_CAMPAIGN_PREFIX });
  if (ruleHits.length > 0) {
    return {
      id,
      eventSlug: event.slug,
      kind: "banned",
      request,
      oracle: {
        ruleTriggered: true,
        grade: "F",
        riskScore: "critical",
        flaggedKeywordsInclude: ruleHits,
        matchedEventsEmpty: true,
      },
      qualitative: { applicable: false },
      dateApprox: approx,
    };
  }

  // RULE-GAP: 룰이 안 잡음 → LLM이 잡아야. 밴드는 이벤트 기대등급 이상 심각도.
  return {
    id,
    eventSlug: event.slug,
    kind: "banned",
    request,
    oracle: {
      ruleTriggered: false,
      flaggedKeywordsEmpty: true,
      matchedEventsInclude: event.slug,
    },
    qualitative: {
      applicable: true,
      mustIdentifyEvent: event.name,
      llmShouldFlagGradeIn: bandAtLeast(expectedGrade),
    },
    dateApprox: approx,
  };
}

function buildBenignCase(event: EvalEvent, index: number): EvalCase {
  const { date, approx } = synthDate(event);
  const copy = BENIGN_COPY_POOL[index % BENIGN_COPY_POOL.length];
  const expectedGrade = toneToGrade(event.recommended_tone, event.risk_level);

  return {
    id: `${event.slug}::benign`,
    eventSlug: event.slug,
    kind: "benign",
    request: {
      date,
      campaignName: EVAL_CAMPAIGN_PREFIX,
      copy,
      assetKeywords: [],
    },
    oracle: {
      ruleTriggered: false,
      flaggedKeywordsEmpty: true,
      matchedEventsInclude: event.slug,
      matchedEventGrade: { slug: event.slug, grade: expectedGrade },
    },
    qualitative: {
      applicable: true,
      mustIdentifyEvent: event.name,
    },
    dateApprox: approx,
  };
}

/** Generate the full case list: two cases per event (banned, benign). */
export function generateCases(events: EvalEvent[]): EvalCase[] {
  const cases: EvalCase[] = [];
  events.forEach((event, index) => {
    cases.push(buildBannedCase(event, index));
    cases.push(buildBenignCase(event, index));
  });
  return cases;
}
