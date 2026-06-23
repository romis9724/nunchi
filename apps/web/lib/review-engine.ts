import crypto from "crypto";
import type { CheckRequest, CheckResponse, EventRecord, Grade } from "@noonchi/shared";
import { toneToGrade } from "@noonchi/shared";
import { callReviewEngine, generateEmbedding } from "@noonchi/llm";
import { matchCriticalKeywords } from "./critical-keywords";
import {
  findEmbeddedApprovedEvents,
  findNearbyEvents as findNearbyEventsRepo,
} from "./repositories/events.repo";
import { findCachedReview, upsertReviewCache } from "./repositories/reviews.repo";

/**
 * Top-K events ranked by semantic similarity to the input copy. Cosine
 * similarity computed in JS (events table is small; pgvector `<=>` 최적화는
 * 후속 phase). Returns [] on any failure — semantic search is *additive*.
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
    const rows = await findEmbeddedApprovedEvents();
    if (rows.length === 0) return [];

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
 * Merge nearby (date-based) and semantic (embedding-based) candidates by slug,
 * date-based first (higher confidence), then semantic not already covered.
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

    const events = await findNearbyEventsRepo(
      month,
      Math.max(1, day - 3),
      Math.min(31, day + 3)
    );

    const order: Record<string, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return events.sort(
      (a, b) => (order[a.risk_level] ?? 5) - (order[b.risk_level] ?? 5)
    );
  } catch {
    return [];
  }
}

async function getCached(hash: string): Promise<CheckResponse | null> {
  try {
    const row = await findCachedReview(hash);
    if (!row) return null;

    return {
      grade: (row.grade as Grade) ?? "C",
      riskScore: row.risk_score as CheckResponse["riskScore"],
      flaggedKeywords: row.flagged_keywords,
      matchedEvents: row.matched_events,
      rationale: row.llm_rationale,
      suggestions: row.suggestions,
      ruleTriggered: row.rule_triggered,
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

    await upsertReviewCache({
      inputHash: hash,
      date: req.date,
      campaignName: req.campaignName ?? null,
      copy: req.copy,
      assetKeywords: req.assetKeywords ?? [],
      grade: result.grade,
      riskScore: result.riskScore,
      flaggedKeywords: result.flaggedKeywords,
      matchedEvents: result.matchedEvents,
      suggestions: result.suggestions,
      llmRationale: result.rationale,
      ruleTriggered: result.ruleTriggered,
      cachedUntil: cachedUntil.toISOString(),
    });
  } catch {
    /* best-effort */
  }
}

/** 검토엔진 옵션. skipCache=true 면 reviews 캐시를 읽지도 쓰지도 않는다(평가 하니스용). */
export interface RunReviewEngineOptions {
  skipCache?: boolean;
}

export async function runReviewEngine(
  req: CheckRequest,
  opts?: RunReviewEngineOptions
): Promise<CheckResponse> {
  const hash = hashInput(req);

  // 1. Cache check (skipCache 시 우회 — 평가 루프가 옛 결과로 거짓 수렴하지 않도록)
  if (!opts?.skipCache) {
    const cached = await getCached(hash);
    if (cached) return cached;
  }

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
    if (!opts?.skipCache) await saveCache(hash, req, result);
    return result;
  }

  // 3. Fetch candidate events — date proximity (±3 days) ∪ semantic top-K.
  const [nearbyEvents, semanticEvents] = await Promise.all([
    fetchNearbyEvents(req.date),
    fetchSemanticEvents(req.copy),
  ]);
  const candidateEvents = mergeEventCandidates(nearbyEvents, semanticEvents);

  // 4. LLM review (Ollama qwen3:8b / Gemini fallback)
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
      slug: e.slug,
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

  if (!llmResult.transient && !opts?.skipCache) {
    await saveCache(hash, req, result);
  }
  return result;
}
