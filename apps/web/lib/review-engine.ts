import crypto from "crypto";
import type {
  CheckRequest,
  CheckResponse,
  EventRecord,
  Grade,
} from "@noonchi/shared";
import { toneToGrade } from "@noonchi/shared";
import { callReviewEngine, generateEmbedding, PROMPT_VERSION } from "@noonchi/llm";
import { matchCriticalKeywords } from "./critical-keywords";
import {
  buildExpressionFlags,
  getActiveLexicon,
  LEXICON_VERSION,
  matchLexicon,
  TIER_DEFAULT_STATUS,
  toExpressionFlag,
} from "./expression-lexicon";
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
    // campaignName 도 검토 대상(룰·표현 매칭이 읽는다) — 키에서 빠지면
    // 캠페인명만 다른 입력이 남의 결과를 돌려받는다.
    campaignName: (req.campaignName ?? "").trim().toLowerCase(),
    copy: req.copy.trim().toLowerCase(),
    assetKeywords: (req.assetKeywords ?? [])
      .map((k) => k.trim().toLowerCase())
      .sort(),
    // 사전·프롬프트가 바뀌면 기존 캐시는 자동 무효화된다.
    lexiconVersion: LEXICON_VERSION,
    promptVersion: PROMPT_VERSION,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/** F > D > C > B > A. 둘 중 더 나쁜 등급을 고른다. */
const GRADE_BY_SEVERITY: Grade[] = ["F", "D", "C", "B", "A"];

function worseGrade(a: Grade, b: Grade): Grade {
  return GRADE_BY_SEVERITY.indexOf(a) <= GRADE_BY_SEVERITY.indexOf(b) ? a : b;
}

const RISK_SCORE_BY_GRADE: Record<Grade, CheckResponse["riskScore"]> = {
  F: "critical", D: "danger", C: "caution", B: "safe", A: "safe",
};

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
      expressionFlags: row.expression_flags ?? [],
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
      expressionFlags: result.expressionFlags ?? [],
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

  // 2. Rule-based keyword match + 표현 사전 매칭 (in-memory, instant)
  const flaggedKeywords = matchKeywords(req);
  const ruleTriggered = flaggedKeywords.length > 0;
  const lexMatches = matchLexicon(req, getActiveLexicon());

  if (ruleTriggered) {
    // ponytail: 룰-F 경로는 LLM 문맥판정 생략(이미 F). 티어 기본 상태로만 표시한다.
    const result: CheckResponse = {
      grade: "F",
      riskScore: "critical",
      flaggedKeywords,
      matchedEvents: [],
      rationale: `입력한 카피 또는 비주얼 키워드에 고위험 단어(${flaggedKeywords.join(", ")})가 감지되었습니다. 즉각 재검토를 권장합니다.`,
      suggestions: [],
      ruleTriggered: true,
      cached: false,
      expressionFlags: lexMatches.map((m) =>
        toExpressionFlag(m, TIER_DEFAULT_STATUS[m.entry.tier])
      ),
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
    lexiconMatches: lexMatches.map((m) => m.entry),
  });

  const expressionFlags = buildExpressionFlags(lexMatches, llmResult.expressionRisk);

  // hard 티어는 등급 상한 D (ADR-0004 결정 1). contextual·watch 는 등급 불변.
  const hasHardExpression = lexMatches.some((m) => m.entry.tier === "hard");
  const grade: Grade = hasHardExpression
    ? worseGrade(llmResult.grade, "D")
    : llmResult.grade;

  const result: CheckResponse = {
    grade,
    riskScore: RISK_SCORE_BY_GRADE[grade],
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
    expressionFlags,
  };

  if (!llmResult.transient && !opts?.skipCache) {
    await saveCache(hash, req, result);
  }
  return result;
}
