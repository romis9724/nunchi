import { query } from "../db";
import type { CheckResponse } from "@noonchi/shared";

/** reviews 캐시 행 (필요 컬럼만). */
export interface CachedReviewRow {
  grade: string;
  risk_score: string;
  flagged_keywords: string[];
  matched_events: CheckResponse["matchedEvents"];
  llm_rationale: string;
  suggestions: string[];
  rule_triggered: boolean;
}

/** input_hash 로 유효한(TTL 내) 캐시를 조회한다. 없으면 null. */
export async function findCachedReview(
  inputHash: string
): Promise<CachedReviewRow | null> {
  const rows = await query<CachedReviewRow>(
    `SELECT grade, risk_score, flagged_keywords, matched_events,
            llm_rationale, suggestions, rule_triggered
     FROM reviews
     WHERE input_hash = $1 AND cached_until > NOW()
     LIMIT 1`,
    [inputHash]
  );
  return rows[0] ?? null;
}

export interface UpsertReviewInput {
  inputHash: string;
  date: string;
  campaignName: string | null;
  copy: string;
  assetKeywords: string[];
  grade: string;
  riskScore: string;
  flaggedKeywords: string[];
  matchedEvents: unknown;
  suggestions: string[];
  llmRationale: string;
  ruleTriggered: boolean;
  cachedUntil: string;
}

/** input_hash 충돌 시 갱신(upsert). matched_events 는 JSONB 라 직렬화한다. */
export async function upsertReviewCache(
  input: UpsertReviewInput
): Promise<void> {
  await query(
    `INSERT INTO reviews (
       input_hash, date, campaign_name, copy, asset_keywords, grade, risk_score,
       flagged_keywords, matched_events, suggestions, llm_rationale,
       rule_triggered, cached_until
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (input_hash) DO UPDATE SET
       date = EXCLUDED.date,
       campaign_name = EXCLUDED.campaign_name,
       copy = EXCLUDED.copy,
       asset_keywords = EXCLUDED.asset_keywords,
       grade = EXCLUDED.grade,
       risk_score = EXCLUDED.risk_score,
       flagged_keywords = EXCLUDED.flagged_keywords,
       matched_events = EXCLUDED.matched_events,
       suggestions = EXCLUDED.suggestions,
       llm_rationale = EXCLUDED.llm_rationale,
       rule_triggered = EXCLUDED.rule_triggered,
       cached_until = EXCLUDED.cached_until,
       reviewed_at = NOW()`,
    [
      input.inputHash,
      input.date,
      input.campaignName,
      input.copy,
      input.assetKeywords,
      input.grade,
      input.riskScore,
      input.flaggedKeywords,
      JSON.stringify(input.matchedEvents),
      input.suggestions,
      input.llmRationale,
      input.ruleTriggered,
      input.cachedUntil,
    ]
  );
}
