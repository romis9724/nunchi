# ADR 0003: 위험 등급 — 3단계에서 5단계(F/D/C/B/A)로 확장

**상태**: 확정 (2026-05-24)

## 배경

ADR-0001과 [`data-schema.md`](../data-schema.md)는 위험 등급을 3단계로 정의했다:

| 라벨 | 코드 | 색상 |
|---|---|---|
| 안전 | `safe` | 🟢 |
| 주의 | `caution` | 🟡 |
| 위험 | `danger` / `critical` | 🟠 / 🔴 |

실제 구현은 **학교 성적표 비유의 5단계(F/D/C/B/A)**로 확장됐다.
`packages/shared/src/types.ts`에 `Grade = "A" | "B" | "C" | "D" | "F"` 정의.

본 ADR은 그 변경의 사유·정의·매핑을 박제한다.

## 결정

위험 등급은 사용자 노출 단에서 **F/D/C/B/A 5단계**를 사용한다.
내부 `riskScore` 컬럼은 기존 4단계(`safe`/`caution`/`danger`/`critical`)를 유지.

## 사유

1. **친숙도**: 1인 PMM 페르소나 — 학교 성적표 비유는 즉각 직관 매칭. "C 받았네"가 "주의 등급이네"보다 빠름.
2. **단계 해상도**: 3단계는 너무 거칠어 사용자가 "주의"를 무시하기 쉽다. 5단계로 D와 C를 구분하면 강도 차이가 명확.
3. **긍정 등급의 존재(A)**: 단순 회피가 아니라 **권장 톤과 매칭되는 날짜**(예: 8·15+"독립")를 적극 신호. "이날 해도 좋다"는 메시지가 가능해짐.
4. **시각적 위계**: 색상·이모지·라벨이 모두 자연스럽게 정렬되어 결과 카드 디자인이 깔끔.

## 등급 정의

| Grade | 의미 | riskScore 매핑 | 시각 | 행동 권장 |
|---|---|---|---|---|
| **F** | 절대 회피. 사고 가능성 매우 높음 | `critical` | 🚫 빨강 | 즉각 재검토. 날짜 조정 또는 컨셉 전면 폐기 |
| **D** | 강력 재검토 권고 | `danger` | ⚠️ 주황 | 컨셉 또는 카피 재작성. 위험 사유 명시 |
| **C** | 톤·문구 조정 권장 | `caution` | ⚠️ 보라 | 인지하고 진행 가능. 핵심 단어 1~2개 교체 |
| **B** | 표준 주의 하에 진행 가능 | `safe` | ✅ 녹색 | 평상시 검토 통과 |
| **A** | 권장 톤과 맞음 (긍정 매칭) | `safe` | ✨ 파랑 | 적극 활용 가능 (예: 광복절·한글날 등 기념일 매칭) |

## 매핑 규칙

`packages/shared/src/types.ts`의 `toneToGrade(tone, risk_level)`:

```typescript
// 개념적 매핑
recommended_tone === "avoid"     → F (events.risk_level=critical인 경우)
                                   D (events.risk_level=high)
recommended_tone === "memorial"  → C 또는 D (추모일에 가벼운 톤은 피해야 함)
recommended_tone === "neutral"   → B
recommended_tone === "celebration" + 권장 키워드 매칭 → A
```

LLM 응답 단에서 직접 `grade: "F" | ... | "A"`를 산출하고, 폴백 등급은 C.

## 결과

### DB 영향
- `events.risk_level`: 기존 `critical/high/medium/low` 4단계 유지 (사건 자체의 본질적 무게)
- `reviews.risk_score`: 기존 `safe/caution/danger/critical` 4단계 유지 (계산된 카피별 위험)
- `reviews.grade`: **새 컬럼 (F/D/C/B/A)** — 사용자 노출용
  - ⚠️ 마이그레이션 SQL 누락 — Phase 1 작업에서 ALTER 필요 ([STATUS.md 드리프트 섹션](../STATUS.md#문서-↔-코드-드리프트))

### UI 영향
- `apps/web/components/result-card/GradeBadge.tsx` — 5등급 시각화
- `apps/web/components/result-card/ResultCard.tsx` — Grade 기준 레이아웃
- `apps/web/components/result-card/RiskBadge.tsx` — 기존 riskScore 4단계 (잔존, 보조)

## 위험과 완화

| 위험 | 완화 |
|---|---|
| 등급 인플레이션 (사용자가 모든 결과를 F로 받음) | 룰 매칭 키워드를 정밀하게 큐레이션. LLM 프롬프트에 "F는 절대 회피급, 평상 검토는 B" 명시 |
| C·D 구분이 모호 | LLM 프롬프트에 구체 예시 추가 (Phase 1) |
| A 등급 발급이 너무 보수적 | 사용자 인터뷰(Phase 3)에서 "A 받은 적 있는가?" 측정. 없으면 매핑 규칙 완화 |

## 검토할 시점

- Phase 3 인터뷰 결과 — "등급이 직관적인가? 너무 많은가/적은가?"
- 회귀 테스트셋(Phase 2)에서 등급 분포가 한쪽에 쏠리는지 측정

## 참조

- 타입: `packages/shared/src/types.ts`
- UI: `apps/web/components/result-card/GradeBadge.tsx`
- 매핑 헬퍼: `toneToGrade(tone, risk_level)`
- 색상 토큰: `apps/web/app/globals.css` `--grade-*` 변수군
