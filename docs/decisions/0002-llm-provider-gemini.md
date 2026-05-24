# ADR 0002: LLM Provider — Gemini 2.0 Flash로 전환

**상태**: 확정 (2026-05-24) · ADR-0001의 LLM 선택을 **supersede**

## 배경

ADR-0001은 LLM 제공자를 **Claude API**로 명시했다. 그러나 실제 구현(`packages/llm/src/claude.ts`)은
Gemini 2.0 Flash를 사용하고 있다. 파일명만 `claude.ts`로 남아있어 혼란을 야기한다.

이 ADR은 그 결정을 사후 박제(retro-decision)하고, 향후 변경 시 참조점이 된다.

## 결정

검토 엔진의 1차 LLM을 **Gemini 2.0 Flash** (OpenAI-호환 엔드포인트 경유)로 한다.
폴백은 **로컬 Ollama (`gemma4:latest`)**.

## 사유

### Gemini 2.0 Flash 선택

1. **비용**: Gemini 2.0 Flash는 무료 티어가 넉넉(분당 RPM 한계는 있음). MVP 검증 단계에 즉시 이득.
2. **지연**: Flash 라인은 대화형 응답 속도가 빠름 (목표 검토 응답 < 5초 충족).
3. **한국어 품질**: 한국 역사·사회 컨텍스트에 대한 한국어 응답 품질이 검토 시점 기준 충분히 우수.
4. **OpenAI 호환 API**: 기존 OpenAI SDK 패턴(`/v1/chat/completions`)을 그대로 사용 가능 → 코드 단순.
5. **데이터 정책**: 사용자 입력(캠페인 카피)이 학습에 사용되지 않도록 설정 가능 (구글 기업 정책 확인 필요).

### Ollama 로컬 폴백 선택

1. **개발 환경**: API 키 없이 로컬에서 풀 스택 실행 가능.
2. **쿼터 회복**: Gemini 429 발생 시 즉시 폴백 (단, 현재는 폴백 체인이 422 graceful → C등급 우선).
3. **데이터 주권**: 민감 클라이언트 사례에서 입력을 외부로 보내지 않는 옵션.

### Claude API를 채택하지 않은 이유

1. 비용 — 검토 1건당 호출 비용이 Gemini Flash 대비 비쌈 (MVP 무료 검증에 부담).
2. 한국어 품질 격차가 크지 않음 — Sonnet 4.6/Haiku 4.5 모두 우수하지만 Gemini 2.0 Flash로도 충분히 동등한 수준의 응답 확보.
3. 향후 Anthropic으로 돌아갈 가능성은 열어둠 — 어댑터 패턴(`callReviewEngine`)으로 교체 비용 낮음.

## 결과

### 코드 위치
- `packages/llm/src/claude.ts` — 파일명은 레거시. **함수는 Gemini/Ollama 호출**.
- `apps/web/lib/review-engine.ts` — `callReviewEngine` 호출.

### 폴백 정책
```
GEMINI_API_KEY 있음
  → Gemini 호출
  → 429 → C등급 + "잠시 후 다시 시도" 안내
  → 기타 에러 → 예외 throw

GEMINI_API_KEY 없음
  → Ollama 호출
  → 에러 → 예외 throw
```

### 환경 변수
| 변수 | 기본값 | 비고 |
|---|---|---|
| `GEMINI_API_KEY` | (없음) | 있으면 Gemini 우선 |
| `GEMINI_MODEL` | `gemini-2.0-flash` | 모델 변경 시 |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | 로컬 폴백 |
| `OLLAMA_MODEL` | `gemma4:latest` | 폴백 모델 |

### 미사용 의존성
- `@anthropic-ai/sdk: ^0.36.3` (apps/web/package.json) — Claude 시절 흔적. 다음 청소 시 제거.

## 위험과 완화

| 위험 | 완화 |
|---|---|
| Gemini 429 시 위험 가림 (진짜 F를 C로 분류) | 룰 매칭으로 핵심 키워드는 LLM 호출 전 사전 차단. CRITICAL_KEYWORDS 사전 지속 확장. 향후 Ollama 자동 폴백 강화. |
| 입력 카피가 Google 학습에 활용될 우려 | 기업 정책 / API 설정으로 학습 제외. 약관에 명시 필요. |
| 모델 단종·정책 변경 | 어댑터 패턴 유지. 교체 시 `callReviewEngine` 내부만 수정. |
| 파일명 혼동 (`claude.ts`인데 Gemini 호출) | 향후 `packages/llm/src/provider.ts`로 리네임 권장. |

## 검토할 시점

- Gemini 분당 RPM 한계가 운영에 영향: 유료 티어 검토 또는 추가 폴백 강화
- 사용자가 PMF 1차 통과: 비용 / 품질 / 데이터 정책 종합 재평가
- Anthropic이 한국어 특화 모델 출시: 재평가

## 참조

- 코드: `packages/llm/src/claude.ts` (Gemini/Ollama 어댑터)
- 호출처: `apps/web/lib/review-engine.ts:172` (`callReviewEngine` 사용)
- 폴백 다이어그램: [`../architecture.md`](../architecture.md#폴백-우선순위-정리)
- supersede 대상: [`0001-mvp-scope.md`](./0001-mvp-scope.md) 결과 섹션의 "Claude API" 언급
