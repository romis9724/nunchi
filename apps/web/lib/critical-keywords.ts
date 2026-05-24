/**
 * In-memory keyword rules that short-circuit the review pipeline. Any input
 * copy or asset keyword containing one of these terms is treated as F-grade
 * (critical) without consulting the LLM — see `review-engine.ts`.
 *
 * The mapping value is the list of event slugs the keyword traces to. It is
 * informational today (used in the rationale), but regression tests assert
 * that the slugs are non-empty and that every slug exists in
 * `data/events/*.json` so a rename never silently breaks the rule.
 *
 * Extracted from review-engine.ts so the regression suite can validate it
 * without pulling in the full pipeline (Supabase / LLM clients).
 */
export const CRITICAL_KEYWORDS: Record<string, string[]> = {
  "탱크":       ["gwangju-uprising-0518", "korean-war-0625"],
  "계엄":       ["gwangju-uprising-0518"],
  "발포":       ["gwangju-uprising-0518"],
  "책상 탁":    ["gwangju-uprising-0518"],
  "책상에 탁":  ["gwangju-uprising-0518"],
  "신군부":     ["gwangju-uprising-0518"],
  "전두환":     ["gwangju-uprising-0518"],
  "세월호":     ["sewol-ferry-0416"],
  "노란 리본":  ["sewol-ferry-0416"],
  "304":        ["sewol-ferry-0416"],
  "토벌":       ["jeju-uprising-0403"],
  "4·3":        ["jeju-uprising-0403"],
  "욱일기":     ["liberation-day-0815"],
  "위안부":     ["liberation-day-0815"],
  "강제징용":   ["liberation-day-0815"],
  "남침":       ["korean-war-0625"],
  "6·25":       ["korean-war-0625"],
  "박종철":     ["gwangju-uprising-0518"],
  "이태원":     ["itaewon-disaster-1029"],
  "압사":       ["itaewon-disaster-1029"],
};

export interface KeywordSearchInput {
  copy: string;
  assetKeywords?: string[];
  campaignName?: string;
}

/**
 * Return every CRITICAL_KEYWORDS term that appears (case-insensitively, as a
 * substring) in the combined search text. Used by the review engine to
 * short-circuit obvious F-grade inputs, and by the regression suite to
 * verify each documented scenario still trips.
 */
export function matchCriticalKeywords(input: KeywordSearchInput): string[] {
  const searchText = [
    input.copy,
    ...(input.assetKeywords ?? []),
    input.campaignName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return Object.keys(CRITICAL_KEYWORDS).filter((kw) =>
    searchText.includes(kw.toLowerCase())
  );
}
