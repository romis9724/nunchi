export type RiskLevel = "critical" | "high" | "medium" | "low";
export type RiskScore = "critical" | "danger" | "caution" | "safe";

/** 통합 등급: F(위험) → D(주의) → C(중립) → B(안전) → A(호재) */
export type Grade = "F" | "D" | "C" | "B" | "A";

export type EventCategory =
  | "massacre"
  | "disaster"
  | "political"
  | "social"
  | "memorial"
  | "independence"
  | "labor"
  | "human_rights"
  | "celebration"
  | "commercial";

export type RecommendedTone = "avoid" | "memorial" | "neutral" | "celebration";
export type ReferenceType = "official" | "academic" | "media" | "wiki";
export type DateType = "fixed" | "recurring" | "range";

export interface EventReference {
  label: string;
  url: string;
  type: ReferenceType;
}

export interface EventRecord {
  id?: string;
  slug: string;
  date_type: DateType;
  month: number;
  day?: number;
  day_end?: number;
  country: string;
  name: string;
  name_en?: string;
  category: EventCategory;
  risk_level: RiskLevel;
  grade?: Grade;
  summary: string;
  related_keywords: string[];
  related_motifs: string[];
  recommended_tone: RecommendedTone;
  references: EventReference[];
  created_at?: string;
  updated_at?: string;
}

export interface KeywordBlacklist {
  id?: string;
  term: string;
  term_normalized: string;
  related_event_id?: string;
  severity: "critical" | "high" | "medium";
  context_note?: string;
}

// ---------------------------------------------------------------------------
// 표현 리스크 레이어 (ADR-0004) — data/lexicon/*.json 스키마
// ---------------------------------------------------------------------------

export type LexiconCategory =
  | "community"
  | "gender"
  | "region"
  | "age"
  | "disability"
  | "sexual_minority"
  | "race"
  | "religion";

/**
 * hard        정상 용법이 사실상 없는 명백한 비하 → 등급 상한 D
 * contextual  정상 용법과 겹침(음식·지명·방언) → LLM 문맥 판정, 등급 불변
 * watch       기원·의미가 다투어지는 표현 → 정보 제공만
 */
export type LexiconTier = "hard" | "contextual" | "watch";

/** approved 만 런타임 로드된다 (LEXICON_INCLUDE_DRAFT=1 이면 draft 미리보기). */
export type LexiconStatus = "draft" | "approved" | "deprecated";

export interface LexiconPattern {
  type: "literal" | "regex";
  value: string;
}

export interface LexiconSource {
  label: string;
  url: string;
  type: "official" | "academic" | "news" | "wiki";
  /** ISO date — 출처 확인 시점 */
  accessed: string;
}

export interface LexiconEntry {
  key: string;
  term: string;
  category: LexiconCategory;
  tier: LexiconTier;
  severity: "critical" | "high" | "medium";
  status: LexiconStatus;
  patterns: LexiconPattern[];
  /** 있으면 patterns 와 **같은 문장** 안에서 전부 매칭돼야 플래그 (방언 오탐 방지) */
  cooccur?: string[];
  meaning: string;
  benign_usages: string[];
  harmful_example: string;
  benign_example: string;
  note: string;
  alternative?: string;
  sources: LexiconSource[];
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export type ExpressionDisposition = "harmful" | "benign" | "uncertain";

/** LLM 이 표현 사전 항목 하나에 대해 내린 **용법** 판정 (사람에 대한 판정이 아니다). */
export interface ExpressionVerdict {
  key: string;
  disposition: ExpressionDisposition;
  rationale: string;
  alternative?: string;
}

/** harmful=재검토 권고 · uncertain=문맥 확인 권고 · informational=참고 */
export type ExpressionFlagStatus = "harmful" | "uncertain" | "informational";

export interface ExpressionFlag {
  key: string;
  term: string;
  category: LexiconCategory;
  tier: LexiconTier;
  status: ExpressionFlagStatus;
  field: "campaignName" | "copy" | "assetKeywords";
  note: string;
  /** LLM 문맥 판정 근거. 룰-F 경로에서는 없음 */
  rationale?: string;
  alternative?: string;
  sources: { label: string; url: string }[];
}

export interface CheckRequest {
  date: string;
  campaignName?: string;
  copy: string;
  assetKeywords?: string[];
}

export interface MatchedEvent {
  id: string;
  /** /events/[slug] 라이브러리 상세 페이지 링크용. 캐시된 구버전 결과에는 없을 수 있음 */
  slug?: string;
  name: string;
  riskLevel: RiskLevel;
  grade: Grade;
  summary: string;
  recommendedTone: RecommendedTone;
  references: { label: string; url: string }[];
}

export interface CheckResponse {
  grade: Grade;
  riskScore: RiskScore;
  flaggedKeywords: string[];
  matchedEvents: MatchedEvent[];
  rationale: string;
  suggestions: string[];
  ruleTriggered: boolean;
  cached: boolean;
  /** 사용자 업종·채널 기반 맞춤 코멘트 (industries·channels만 LLM에 전달). 비로그인 시 undefined. */
  personalizedComment?: string;
  /** true면 LLM 일시 장애로 인한 임시 fallback 결과 — UI에서 경고 표시 권장 */
  transient?: boolean;
  /** 표현 사전(ADR-0004) 플래그. undefined = 레이어 도입 전 캐시된 구버전 결과 */
  expressionFlags?: ExpressionFlag[];
  /** 검토 시점의 활성 표현 사전 항목 수. 0이면 사전 승인 전이라 표현 리스크 검토가 비어 있다. */
  expressionCoverage?: number;
}

export interface WaitlistEntry {
  email: string;
  source?: string;
}

/**
 * 큐레이션된 사건 파일 수 (data/events/ 에서 _template.json 제외).
 * 변경 시 data/events 와 함께 갱신한다 — countEventFiles() 테스트가 이 값을 검증한다.
 */
export const CURATED_EVENT_COUNT = 50;

export const GRADE_LABEL: Record<Grade, string> = {
  F: "회피 권고",
  D: "재검토 권고",
  C: "일반 주의",
  B: "우려 낮음",
  A: "긍정 연관",
};

export const GRADE_EMOJI: Record<Grade, string> = {
  F: "🔴",
  D: "🟠",
  C: "⚪",
  B: "🟢",
  A: "🌟",
};

export const GRADE_COLOR: Record<Grade, string> = {
  F: "oklch(45% 0.22 25)",
  D: "oklch(55% 0.2 50)",
  C: "oklch(60% 0.04 250)",
  B: "oklch(52% 0.16 145)",
  A: "oklch(60% 0.2 150)",
};

export const RISK_SCORE_LABEL: Record<RiskScore, string> = {
  critical: "위험",
  danger: "주의",
  caution: "경계",
  safe: "안전",
};

export const RISK_SCORE_COLOR: Record<RiskScore, string> = {
  critical: "#DC2626",
  danger: "#EA580C",
  caution: "#CA8A04",
  safe: "#16A34A",
};

export const RISK_LEVEL_TO_SCORE: Record<RiskLevel, RiskScore> = {
  critical: "critical",
  high: "danger",
  medium: "caution",
  low: "safe",
};

export const RISK_LEVEL_TO_GRADE: Record<RiskLevel, Grade> = {
  critical: "F",
  high: "D",
  medium: "C",
  low: "B",
};

export function toneToGrade(tone: RecommendedTone, riskLevel: RiskLevel): Grade {
  if (tone === "celebration" && (riskLevel === "low" || riskLevel === "medium")) return "A";
  if (tone === "celebration" && riskLevel === "high") return "B";
  return RISK_LEVEL_TO_GRADE[riskLevel];
}
