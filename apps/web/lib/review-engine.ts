import crypto from "crypto";
import type { CheckRequest, CheckResponse, EventRecord, Grade } from "@noonchi/shared";
import { toneToGrade } from "@noonchi/shared";
import { getSupabaseAdmin } from "./supabase";
import { callReviewEngine, generateEmbedding } from "@noonchi/llm";
import { matchCriticalKeywords } from "./critical-keywords";

/**
 * Top-K events ranked by semantic similarity to the input copy. Uses the
 * cosine similarity between the input embedding and each event's stored
 * embedding. Computed in JS (events table is < 100 rows; the cost is
 * negligible and we avoid needing a Supabase RPC for the `<=>` operator).
 *
 * Returns [] on any failure — semantic search is *additive* over keyword +
 * date matching. The review pipeline must never regress when Ollama is down
 * or embeddings aren't populated.
 */
const SEMANTIC_TOP_K = 5;

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function fetchSemanticEvents(
  copy: string,
  topK: number = SEMANTIC_TOP_K
): Promise<EventRecord[]> {
  if (!copy.trim()) return [];

  try {
    const inputEmbedding = await generateEmbedding(copy);

    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .select("*")
      .eq("country", "KR")
      .eq("status", "approved")
      .not("embedding", "is", null);

    if (error || !data || data.length === 0) return [];

    // Cast through unknown because supabase-js returns embedding as the raw
    // pgvector representation; we treat it as number[] for similarity scoring.
    const rows = data as Array<EventRecord & { embedding: number[] }>;

    const scored = rows
      .map((row) => ({
        event: row,
        score: cosineSimilarity(inputEmbedding, row.embedding ?? []),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map((s) => s.event);
  } catch {
    // Ollama / Gemini down OR embeddings not yet populated — fall through.
    return [];
  }
}

/**
 * Merge nearby (date-based) and semantic (embedding-based) candidate events
 * by slug, preserving the order: date-based first (higher confidence for
 * calendar-anchored campaigns), then semantic candidates not already covered.
 */
function mergeEventCandidates(
  nearby: EventRecord[],
  semantic: EventRecord[]
): EventRecord[] {
  const seen = new Set<string>();
  const merged: EventRecord[] = [];
  for (const e of nearby) {
    if (!seen.has(e.slug)) {
      seen.add(e.slug);
      merged.push(e);
    }
  }
  for (const e of semantic) {
    if (!seen.has(e.slug)) {
      seen.add(e.slug);
      merged.push(e);
    }
  }
  return merged;
}

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
      .eq("status", "approved")
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

  // 3. Fetch candidate events — date proximity (±3 days) ∪ semantic top-K.
  //    Semantic search is additive: returns [] when embeddings aren't
  //    populated or Ollama/Gemini are unavailable, so the pipeline still
  //    works in pure keyword + date mode.
  const [nearbyEvents, semanticEvents] = await Promise.all([
    fetchNearbyEvents(req.date),
    fetchSemanticEvents(req.copy),
  ]);
  const candidateEvents = mergeEventCandidates(nearbyEvents, semanticEvents);

  // 4. Gemini LLM
  const llmResult = await callReviewEngine({
    request: req,
    matchedEvents: candidateEvents,
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
    matchedEvents: candidateEvents.map((e) => ({
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
    transient: llmResult.transient,
  };

  // transient 결과(429 등 일시적 fallback)는 캐시하지 않음
  if (!llmResult.transient) {
    await saveCache(hash, req, result);
  }
  return result;
}
