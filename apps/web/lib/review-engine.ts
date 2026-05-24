import crypto from "crypto";
import type { CheckRequest, CheckResponse, EventRecord, Grade } from "@nunchi/shared";
import { toneToGrade } from "@nunchi/shared";
import { getSupabaseAdmin } from "./supabase";
import { callReviewEngine } from "@nunchi/llm";
import { matchCriticalKeywords } from "./critical-keywords";

const CACHE_TTL_DAYS = 7;

function hashInput(req: CheckRequest): string {
  const payload = JSON.stringify({
    date: req.date,
    copy: req.copy.trim().toLowerCase(),
    assetKeywords: (req.assetKeywords ?? [])
      .map((k) => k.trim().toLowerCase())
      .sort(),
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function matchKeywords(req: CheckRequest): string[] {
  return matchCriticalKeywords({
    copy: req.copy,
    assetKeywords: req.assetKeywords,
    campaignName: req.campaignName,
  });
}

async function fetchNearbyEvents(date: string): Promise<EventRecord[]> {
  try {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();

    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .select("*")
      .eq("country", "KR")
      .eq("month", month)
      .gte("day", Math.max(1, day - 3))
      .lte("day", Math.min(31, day + 3));

    if (error || !data) return [];

    return (data as EventRecord[]).sort((a, b) => {
      const order = { critical: 1, high: 2, medium: 3, low: 4 };
      return (order[a.risk_level] ?? 5) - (order[b.risk_level] ?? 5);
    });
  } catch {
    return [];
  }
}

async function getCached(hash: string): Promise<CheckResponse | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select("grade, risk_score, flagged_keywords, matched_events, llm_rationale, suggestions, rule_triggered")
      .eq("input_hash", hash)
      .gt("cached_until", new Date().toISOString())
      .single();

    if (error || !data) return null;

    return {
      grade: (data.grade as Grade) ?? "C",
      riskScore: data.risk_score,
      flaggedKeywords: data.flagged_keywords,
      matchedEvents: data.matched_events,
      rationale: data.llm_rationale,
      suggestions: data.suggestions,
      ruleTriggered: data.rule_triggered,
      cached: true,
    };
  } catch {
    return null;
  }
}

async function saveCache(
  hash: string,
  req: CheckRequest,
  result: Omit<CheckResponse, "cached">
): Promise<void> {
  try {
    const cachedUntil = new Date();
    cachedUntil.setDate(cachedUntil.getDate() + CACHE_TTL_DAYS);

    await getSupabaseAdmin().from("reviews").upsert(
      {
        input_hash: hash,
        date: req.date,
        campaign_name: req.campaignName ?? null,
        copy: req.copy,
        asset_keywords: req.assetKeywords ?? [],
        grade: result.grade,
        risk_score: result.riskScore,
        flagged_keywords: result.flaggedKeywords,
        matched_events: result.matchedEvents,
        suggestions: result.suggestions,
        llm_rationale: result.rationale,
        rule_triggered: result.ruleTriggered,
        cached_until: cachedUntil.toISOString(),
      },
      { onConflict: "input_hash" }
    );
  } catch {
    /* best-effort */
  }
}

export async function runReviewEngine(
  req: CheckRequest
): Promise<CheckResponse> {
  const hash = hashInput(req);

  // 1. Cache check
  const cached = await getCached(hash);
  if (cached) return cached;

  // 2. Rule-based keyword match (in-memory, instant)
  const flaggedKeywords = matchKeywords(req);
  const ruleTriggered = flaggedKeywords.length > 0;

  if (ruleTriggered) {
    const result: CheckResponse = {
      grade: "F",
      riskScore: "critical",
      flaggedKeywords,
      matchedEvents: [],
      rationale: `입력한 카피 또는 비주얼 키워드에 고위험 단어(${flaggedKeywords.join(", ")})가 감지되었습니다. 즉각 재검토를 권장합니다.`,
      suggestions: [],
      ruleTriggered: true,
      cached: false,
    };
    await saveCache(hash, req, result);
    return result;
  }

  // 3. Fetch nearby events (Supabase REST)
  const nearbyEvents = await fetchNearbyEvents(req.date);

  // 4. Gemini LLM
  const llmResult = await callReviewEngine({
    request: req,
    matchedEvents: nearbyEvents,
    flaggedByRule: flaggedKeywords,
  });

  const gradeFromLLM: Grade = llmResult.grade;
  const riskScoreMap: Record<Grade, CheckResponse["riskScore"]> = {
    F: "critical", D: "danger", C: "caution", B: "safe", A: "safe",
  };

  const result: CheckResponse = {
    grade: gradeFromLLM,
    riskScore: riskScoreMap[gradeFromLLM],
    flaggedKeywords,
    matchedEvents: nearbyEvents.map((e) => ({
      id: e.id ?? e.slug,
      name: e.name,
      riskLevel: e.risk_level,
      grade: toneToGrade(e.recommended_tone, e.risk_level),
      summary: e.summary,
      recommendedTone: e.recommended_tone,
      references: e.references.map((r) => ({ label: r.label, url: r.url })),
    })),
    rationale: llmResult.rationale,
    suggestions: llmResult.suggestions,
    ruleTriggered: false,
    cached: false,
  };

  await saveCache(hash, req, result);
  return result;
}
