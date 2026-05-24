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

export interface CheckRequest {
  date: string;
  campaignName?: string;
  copy: string;
  assetKeywords?: string[];
}

export interface MatchedEvent {
  id: string;
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
}

export interface WaitlistEntry {
  email: string;
  source?: string;
}

export const GRADE_LABEL: Record<Grade, string> = {
  F: "회피 필수",
  D: "재검토 권고",
  C: "일반 주의",
  B: "안전",
  A: "최적 타이밍",
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
