import type {
  EventRecord,
  CheckRequest,
  ExpressionVerdict,
  Grade,
  LexiconEntry,
} from "@noonchi/shared";

/**
 * 프롬프트 개정 버전. 검토 캐시 키에 들어가므로 출력 의미가 달라지면 올린다.
 * "2" = 표현 용법 판정(expressionRisk) 추가 (ADR-0004).
 */
export const PROMPT_VERSION = "2";

export interface ReviewPromptInput {
  request: CheckRequest;
  matchedEvents: EventRecord[];
  flaggedByRule: string[];
  /** 표현 사전 매칭 항목. 각 항목의 **용법**만 판정받는다 (ADR-0004) */
  lexiconMatches?: LexiconEntry[];
}

export function buildReviewSystemPrompt(): string {
  return `당신은 한국 마케팅 캠페인의 사회·역사·문화적 적합성을 평가하는 전문가입니다.

## 역할
- 입력된 날짜·캠페인명·카피·비주얼 키워드를 한국 역사 민감일 및 긍정적 기념일 데이터와 교차 검토한다.
- **F/D/C/B/A 5단계 등급**과 구체적 사유를 제시하고, 위험 시 대안 카피를, 호재 시 활용 포인트를 제안한다.

## 등급 기준

| 등급 | 의미 | 기준 |
|---|---|---|
| F | 회피 필수 | 역사적 비극(학살·재난·의거)과 직접 충돌. 브랜드 사고 위험 높음. |
| D | 재검토 권고 | 연상 가능한 민감 요소 존재. 컨셉·카피 재검토 강력 권고. |
| C | 일반 주의 | 특별한 위험·호재 없음. 표준 마케팅 주의 수준. |
| B | 안전 | 긍정적 연관이 있거나 민감 요소 없음. 안심하고 진행 가능. |
| A | 최적 타이밍 | 국가 기념일·상업 이벤트·문화 특의일과 강한 긍정 연관. 캠페인 부스트 기회. |

## 가이드라인
- **정치적 중립**: 특정 정치 진영을 지지·비판하지 않는다. 역사적 사실만 기술한다.
- **과잉 차단 금지**: 민감일과 실질적 연관이 없으면 F/D로 분류하지 않는다.
- **긍정 적극 발굴**: 광복절·한글날·어린이날 등 캠페인에 유리한 날은 A/B로 적극 판정한다.
- **이유 구체화**: 어떤 사건/기념일 때문인지 명시한다.

## 표현 용법 판정
표현 사전 항목이 주어지면 각 항목의 **용법**만 판정한다(harmful | benign | uncertain).
- 사용자의 소속·정치성향·의도를 추정하지 않는다. 사람을 분류하는 표현을 쓰지 않는다.
- 방언·지명·음식명·인용·비판적 언급을 그 표현의 공격적 사용과 구분한다.
- 근거가 부족하면 harmful 도 benign 도 아닌 \`uncertain\` 을 고른다.
- 특정 진영이나 성별에 다른 기준을 적용하지 않는다. 같은 위해 기준을 대칭으로 적용한다.
- grade 는 날짜·캠페인 적합성만 반영한다. 표현 판정 때문에 grade 를 낮추지 않는다(서버가 처리한다).`;
}

export function buildReviewUserPrompt(input: ReviewPromptInput): string {
  const { request, matchedEvents, flaggedByRule, lexiconMatches } = input;

  const positiveEvents = matchedEvents.filter(
    (e) => e.recommended_tone === "celebration" && (e.risk_level === "low" || e.risk_level === "medium")
  );
  const negativeEvents = matchedEvents.filter(
    (e) => e.recommended_tone !== "celebration" || e.risk_level === "critical" || e.risk_level === "high"
  );

  const negCtx =
    negativeEvents.length > 0
      ? negativeEvents
          .map(
            (e) =>
              `- **${e.name}** (${e.month}/${e.day}, 위험도: ${e.risk_level})\n  ${e.summary}\n  피해야 할 키워드: ${e.related_keywords.join(", ")}`
          )
          .join("\n\n")
      : "해당 날짜 전후 ±3일 위험 사건 없음";

  const posCtx =
    positiveEvents.length > 0
      ? positiveEvents
          .map((e) => `- **${e.name}** (${e.month}/${e.day})\n  ${e.summary}`)
          .join("\n\n")
      : "해당 날짜 전후 ±3일 긍정 기념일 없음";

  const flaggedCtx =
    flaggedByRule.length > 0
      ? `룰 기반 위험 키워드 감지: ${flaggedByRule.join(", ")}`
      : "룰 기반 키워드 매칭 없음";

  const lexiconCtx =
    lexiconMatches && lexiconMatches.length > 0
      ? lexiconMatches
          .map(
            (e) =>
              `- key: \`${e.key}\` / 표현: **${e.term}** (tier: ${e.tier})\n  의미: ${e.meaning}\n  정상 용법: ${e.benign_usages.join(", ") || "(없음)"}\n  공격 용례: ${e.harmful_example}\n  정상 용례: ${e.benign_example}`
          )
          .join("\n\n")
      : "매칭 없음";

  return `## 검토 요청

**날짜**: ${request.date}
**캠페인명**: ${request.campaignName || "(미입력)"}
**카피**: ${request.copy}
**비주얼 키워드**: ${request.assetKeywords?.join(", ") || "(미입력)"}

## 위험 사건 데이터

${negCtx}

## 긍정 기념일 데이터

${posCtx}

## 키워드 매칭 결과

${flaggedCtx}

## 표현 사전 매칭

${lexiconCtx}

---

위 정보를 바탕으로 다음 JSON 형식으로만 응답하세요:

\`\`\`json
{
  "grade": "A | B | C | D | F",
  "rationale": "2–4문장. 구체적 사건명·기념일 인용. 왜 이 등급인지 설명.",
  "suggestions": [
    "제안 1 (위험 시 대안 카피 / 호재 시 활용 아이디어)",
    "제안 2",
    "제안 3"
  ],
  "expressionRisk": [
    {
      "key": "표현 사전 매칭에 주어진 key 그대로",
      "disposition": "harmful | benign | uncertain",
      "rationale": "이 카피에서 해당 표현이 어떤 용법으로 쓰였는지 1–2문장",
      "alternative": "대체 표현 (없으면 생략)"
    }
  ]
}
\`\`\`

grade가 C이면 suggestions는 빈 배열([])도 가능합니다.
표현 사전 매칭이 "매칭 없음"이면 expressionRisk는 빈 배열([])로 응답하세요.`;
}

export interface ReviewLLMResult {
  grade: Grade;
  rationale: string;
  suggestions: string[];
  /** true면 일시적 결과(429 fallback 등) — 캐시하지 말 것 */
  transient?: boolean;
  /** 표현 사전 항목별 용법 판정 (ADR-0004). key 는 요청에 실어 보낸 값 그대로 */
  expressionRisk?: ExpressionVerdict[];
}
