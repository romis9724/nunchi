/**
 * 표현 사전 로더 + 매처 (ADR-0004)
 *
 * data/lexicon/*.json 을 빌드 시 번들에 포함하고, 입력 필드별로 매칭한다.
 * `approved` 항목만 런타임에 실린다 — draft 는 LEXICON_INCLUDE_DRAFT=1 로컬 미리보기 전용.
 *
 * 한계(정규식의 천장): 억양·의도·비방언 여부는 판정 불가. 초성 변형(ㄴㅁㅎ)·
 * 띄어쓰기 우회는 미지원. 문맥 판정은 LLM(contextual tier)이 맡는다.
 *
 * 순수 함수 모듈 — DB·LLM·Next 의존 없음(회귀 테스트가 직접 import 한다).
 */

import crypto from "node:crypto";
import type {
  CheckRequest,
  ExpressionFlag,
  ExpressionFlagStatus,
  ExpressionVerdict,
  LexiconEntry,
  LexiconPattern,
  LexiconStatus,
  LexiconTier,
} from "@noonchi/shared";

import communityRaw from "../../../data/lexicon/community.json";
import genderRaw from "../../../data/lexicon/gender.json";
import regionRaw from "../../../data/lexicon/region.json";

// ponytail: JSON 은 검증 없이 캐스팅한다 — 스키마는 tests/regression/lexicon_data.test.ts 가 지킨다.
const ALL_ENTRIES = [
  ...communityRaw,
  ...genderRaw,
  ...regionRaw,
] as unknown as LexiconEntry[];

// ---------------------------------------------------------------------------
// 로더
// ---------------------------------------------------------------------------

export interface LoadLexiconOptions {
  /** true 면 draft 항목도 포함 (로컬 미리보기). 기본값 false */
  includeDraft?: boolean;
}

export function loadLexicon(opts?: LoadLexiconOptions): LexiconEntry[] {
  const allowed: LexiconStatus[] = opts?.includeDraft
    ? ["approved", "draft"]
    : ["approved"];
  return ALL_ENTRIES.filter((entry) => allowed.includes(entry.status));
}

let activeCache: LexiconEntry[] | null = null;

/** 런타임에서 쓰는 활성 사전. 모듈 수명 동안 1회만 계산한다. */
export function getActiveLexicon(): LexiconEntry[] {
  activeCache ??= loadLexicon({
    includeDraft: process.env.LEXICON_INCLUDE_DRAFT === "1",
  });
  return activeCache;
}

/** 캐시 키용 사전 버전 — 사전이 바뀌면 기존 검토 캐시가 자동 무효화된다. */
export const LEXICON_VERSION = crypto
  .createHash("sha256")
  .update(JSON.stringify(getActiveLexicon()))
  .digest("hex")
  .slice(0, 12);

// ---------------------------------------------------------------------------
// 매처
// ---------------------------------------------------------------------------

// ponytail: 형태소 분석 없이 조사 목록 고정. 미등록 조사는 경계 문자로 취급돼
// 미탐이 되며, 오탐보다 미탐이 낫다는 ADR-0004 원칙과 맞다.
const PARTICLES = [
  "이라는", "라는", "이라고", "라고", "이란", "란",
  "에게", "한테", "으로", "처럼",
  "은", "는", "이", "가", "을", "를", "의", "에", "도", "만", "과", "와", "로", "께",
].join("|");

/** 한글/영문/숫자가 아닌 문자 = 단어 경계 */
const BOUNDARY = "[^\\p{L}\\p{N}]";

// 문장 경계: 마침표·물음표·느낌표·말줄임표·줄바꿈. 단 "6.9"처럼 숫자 사이의 점은 소수점이라 자르지 않는다.
const SENTENCE_DELIMITER = /(?<!\d)\.|\.(?!\d)|[!?…\n]/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function literalSource(term: string): string {
  return `(^|${BOUNDARY})(?:${escapeRegExp(term)})(?:들)?(?:${PARTICLES})?(?=$|${BOUNDARY})`;
}

const regexCache = new Map<string, RegExp | null>();

/** 컴파일 실패는 null 로 캐시 — 잘못된 사전 항목 하나가 검토 전체를 죽이지 않게. */
function compile(source: string): RegExp | null {
  if (!regexCache.has(source)) {
    try {
      regexCache.set(source, new RegExp(source, "u"));
    } catch {
      regexCache.set(source, null);
    }
  }
  return regexCache.get(source) ?? null;
}

function testSource(source: string, text: string): boolean {
  return compile(source)?.test(text) ?? false;
}

function testPattern(pattern: LexiconPattern, text: string): boolean {
  const source =
    pattern.type === "literal" ? literalSource(pattern.value) : pattern.value;
  return testSource(source, text);
}

function normalize(text: string): string {
  // 줄바꿈은 문장 경계로 살려 둔다(cooccur 판정용). 가로 공백만 1개로 접는다.
  return text
    .normalize("NFC")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

interface FieldText {
  field: ExpressionFlag["field"];
  text: string;
}

function buildFieldTexts(req: CheckRequest): FieldText[] {
  return [
    { field: "campaignName", text: normalize(req.campaignName ?? "") },
    { field: "copy", text: normalize(req.copy) },
    // 비주얼 키워드는 줄바꿈으로 잇는다 — 서로 다른 키워드가 한 문장으로 묶여
    // cooccur 오탐을 만들지 않도록.
    {
      field: "assetKeywords",
      text: (req.assetKeywords ?? []).map(normalize).join("\n"),
    },
  ];
}

function matchesEntry(entry: LexiconEntry, text: string): boolean {
  const hasPattern = (scope: string) =>
    entry.patterns.some((p) => testPattern(p, scope));

  if (!entry.cooccur || entry.cooccur.length === 0) return hasPattern(text);

  // cooccur 항목은 같은 문장 안에서 공기해야 한다 ("-노" 방언 오탐 방지).
  return text
    .split(SENTENCE_DELIMITER)
    .some(
      (sentence) =>
        hasPattern(sentence) &&
        entry.cooccur!.every((c) => testSource(c, sentence))
    );
}

export interface LexiconMatch {
  entry: LexiconEntry;
  /** 최초로 매칭된 필드 (campaignName → copy → assetKeywords 순) */
  field: ExpressionFlag["field"];
}

/** 항목당 최대 1건. 어느 필드에서 걸렸는지만 함께 돌려준다. */
export function matchLexicon(
  req: CheckRequest,
  entries: LexiconEntry[]
): LexiconMatch[] {
  const fields = buildFieldTexts(req).filter((f) => f.text !== "");

  return entries.flatMap((entry) => {
    const hit = fields.find((f) => matchesEntry(entry, f.text));
    return hit ? [{ entry, field: hit.field }] : [];
  });
}

// ---------------------------------------------------------------------------
// 플래그 변환
// ---------------------------------------------------------------------------

/** LLM 문맥 판정이 없을 때의 기본 표시 상태. */
export const TIER_DEFAULT_STATUS: Record<LexiconTier, ExpressionFlagStatus> = {
  hard: "harmful",
  contextual: "uncertain",
  watch: "informational",
};

/**
 * 표현 사전 매칭 + LLM 용법 판정 → 화면에 실을 플래그.
 *
 * hard·watch 는 LLM 판정과 무관하게 티어 기본값을 쓴다(hard 는 정상 용법이
 * 사실상 없다는 전제로 등록된 항목이다). contextual 만 판정을 따르고,
 * benign 이면 아예 표시하지 않는다 — 오탐 노출 최소화(ADR-0004).
 */
export function buildExpressionFlags(
  matches: LexiconMatch[],
  verdicts?: ExpressionVerdict[]
): ExpressionFlag[] {
  const verdictByKey = new Map((verdicts ?? []).map((v) => [v.key, v]));

  return matches.flatMap((match) => {
    const verdict = verdictByKey.get(match.entry.key);
    const llm = verdict
      ? { rationale: verdict.rationale, alternative: verdict.alternative }
      : undefined;

    if (match.entry.tier !== "contextual") {
      return [toExpressionFlag(match, TIER_DEFAULT_STATUS[match.entry.tier], llm)];
    }
    if (verdict?.disposition === "benign") return [];

    return [
      toExpressionFlag(
        match,
        verdict?.disposition === "harmful" ? "harmful" : "uncertain",
        llm
      ),
    ];
  });
}

export function toExpressionFlag(
  match: LexiconMatch,
  status: ExpressionFlagStatus,
  llm?: { rationale?: string; alternative?: string }
): ExpressionFlag {
  const { entry, field } = match;
  return {
    key: entry.key,
    term: entry.term,
    category: entry.category,
    tier: entry.tier,
    status,
    field,
    note: entry.note,
    rationale: llm?.rationale,
    alternative: llm?.alternative ?? entry.alternative,
    sources: entry.sources.map((s) => ({ label: s.label, url: s.url })),
  };
}
