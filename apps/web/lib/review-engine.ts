import crypto from "crypto";
import type { CheckRequest, CheckResponse, EventRecord, Grade } from "@nunchi/shared";
import { toneToGrade } from "@nunchi/shared";
import { query } from "./db";
import { callReviewEngine } from "@nunchi/llm";

const CACHE_TTL_DAYS = 7;

const CRITICAL_KEYWORDS: Record<string, string[]> = {
  "탱크": ["gwangju-uprising-0518", "korean-war-0625"],
  "계엄": ["gwangju-uprising-0518"],
  "발포": ["gwangju-uprising-0518"],
  "책상 탁": ["gwangju-uprising-0518"],
  "책상에 탁": ["gwangju-uprising-0518"],
  "신군부": ["gwangju-uprising-0518"],
  "전두환": ["gwangju-uprising-0518"],
  "세월호": ["sewol-ferry-0416"],
  "노란 리본": ["sewol-ferry-0416"],
  "304": ["sewol-ferry-0416"],
  "토벌": ["jeju-uprising-0403"],
  "4·3": ["jeju-uprising-0403"],
  "욱일기": ["liberation-day-0815"],
  "위안부": ["liberation-day-0815"],
  "강제징용": ["liberation-day-0815"],
  "남침": ["korean-war-0625"],
  "6·25": ["korean-war-0625"],
  "박종철": ["gwangju-uprising-0518"],
  "이태원": ["itaewon-disaster-1029"],
  "압사": ["itaewon-disaster-1029"],
};

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
  const searchText = [
    req.copy,
    ...(req.assetKeywords ?? []),
    req.campaignName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return Object.keys(CRITICAL_KEYWORDS).filter((kw) =>
    searchText.includes(kw.toLowerCase())
  );
}

async function fetchNearbyEvents(date: string): Promise<EventRecord[]> {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const rows = await query<EventRecord>(
    `SELECT * FROM events
     WHERE country = 'KR'
       AND month = $1
       AND day >= $2 AND day <= $3
     ORDER BY
       CASE risk_level
         WHEN 'critical' THEN 1
         WHEN 'high'     THEN 2
         WHEN 'medium'   THEN 3
         ELSE 4
       END`,
    [month, Math.max(1, day - 3), Math.min(31, day + 3)]
  );

  return rows;
}

interface ReviewRow {
  grade: Grade;
  risk_score: CheckResponse["riskScore"];
  flagged_keywords: string[];
  matched_events: CheckResponse["matchedEvents"];
  llm_rationale: string;
  suggestions: string[];
  rule_triggered: boolean;
}

async function getCached(hash: string): Promise<CheckResponse | null> {
  try {
    const rows = await query<ReviewRow>(
      `SELECT grade, risk_score, flagged_keywords, matched_events,
              llm_rationale, suggestions, rule_triggered
       FROM reviews
       WHERE input_hash = $1 AND cached_until > NOW()
       LIMIT 1`,
      [hash]
    );

    if (!rows.length) return null;
    const row = rows[0];

    return {
      grade: (row.grade as Grade) ?? "C",
      riskScore: row.risk_score,
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

    await query(
      `INSERT INTO reviews
         (input_hash, date, campaign_name, copy, asset_keywords,
          grade, risk_score, flagged_keywords, matched_events,
          suggestions, llm_rationale, rule_triggered, cached_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (input_hash) DO UPDATE SET
         grade          = EXCLUDED.grade,
         risk_score     = EXCLUDED.risk_score,
         flagged_keywords = EXCLUDED.flagged_keywords,
         matched_events = EXCLUDED.matched_events,
         suggestions    = EXCLUDED.suggestions,
         llm_rationale  = EXCLUDED.llm_rationale,
         rule_triggered = EXCLUDED.rule_triggered,
         cached_until   = EXCLUDED.cached_until`,
      [
        hash,
        req.date,
        req.campaignName ?? null,
        req.copy,
        req.assetKeywords ?? [],
        result.grade,
        result.riskScore,
        result.flaggedKeywords,
        JSON.stringify(result.matchedEvents),
        result.suggestions,
        result.rationale,
        result.ruleTriggered,
        cachedUntil.toISOString(),
      ]
    );
  } catch {
    /* best-effort cache write */
  }
}

export async function runReviewEngine(
  req: CheckRequest
): Promise<CheckResponse> {
  const hash = hashInput(req);

  // 1. Cache check first (covers both rule-triggered and LLM results)
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

  // 3. Fetch nearby events from DB
  const nearbyEvents = await fetchNearbyEvents(req.date);

  // 4. LLM (Ollama gemma4)
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
