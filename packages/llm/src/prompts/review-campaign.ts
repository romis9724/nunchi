import type { EventRecord, CheckRequest, Grade } from "@nunchi/shared";

export interface ReviewPromptInput {
  request: CheckRequest;
  matchedEvents: EventRecord[];
  flaggedByRule: string[];
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
- **이유 구체화**: 어떤 사건/기념일 때문인지 명시한다.`;
}

export function buildReviewUserPrompt(input: ReviewPromptInput): string {
  const { request, matchedEvents, flaggedByRule } = input;

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
  ]
}
\`\`\`

grade가 C이면 suggestions는 빈 배열([])도 가능합니다.`;
}

export interface ReviewLLMResult {
  grade: Grade;
  rationale: string;
  suggestions: string[];
}
