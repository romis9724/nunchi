# Nunchi — 아키텍처

> 데이터 흐름 / 컴포넌트 / 환경 변수 / 의사결정 근거. 변경 시 본 문서를 함께 갱신한다.

## 전체 그림

```
                ┌──────────────────────────────────────┐
                │           apps/web (Next.js 16)        │
                │                                       │
   유저 ──▶ /  ─┼─▶ 랜딩 (Hero + 데모 + 웨이트리스트 폼)  │
                │                                       │
   유저 ──▶ /check ┼─▶ 입력 폼 ──POST──▶ /api/check ─▶  │
                │                          │            │
                │                          ▼            │
                │                  ┌─────────────────┐  │
                │                  │  review-engine  │  │
                │                  │   (lib/...)     │  │
                │                  └────┬────────────┘  │
                │                       │               │
   유저 ──▶ /calendar ─▶ 월별 색상 코딩  │               │
                │  (현재 SAMPLE_EVENTS 하드코딩)         │
                │                       │               │
                └───────────────────────┼───────────────┘
                                        │
                ┌───────────────────────┼───────────────┐
                │                       ▼               │
                │  Supabase Postgres + pgvector(768)    │
                │  events / keywords_blacklist /        │
                │  reviews(캐시) / waitlist             │
                └───────────────────────────────────────┘

   /api/waitlist ──▶ Resend(email) ──▶ Supabase upsert
```

## 검토 엔진 파이프라인 (`apps/web/lib/review-engine.ts`)

```
입력 { date, campaignName?, copy, assetKeywords? }
   │
   ▼
[1] hashInput → sha256(date + copy + keywords)
   │
   ▼
[2] getCached(hash)
   │  reviews 테이블에서 cached_until > now() 조회 → 7일 캐시
   │
   ├─▶ 캐시 hit → 즉시 반환 (cached: true)
   │
   ▼ 캐시 miss
[3] matchKeywords(req)
   │  CRITICAL_KEYWORDS 사전(인-메모리 20+개)에서 부분 문자열 매칭
   │  탱크 / 계엄 / 발포 / 세월호 / 압사 / 욱일기 / 위안부 / 강제징용 / 6·25 / 박종철 / ...
   │
   ├─▶ rule hit → 즉시 F등급 + critical 반환 (LLM 호출 생략, 비용 0)
   │              saveCache 후 응답
   │
   ▼ rule miss
[4] fetchNearbyEvents(date)
   │  events 테이블에서 month=N 그리고 day ∈ [N-3, N+3] 조회
   │  risk_level 오름차순 정렬
   │  ⚠️ 현재 pgvector 의미 검색은 비활성. 날짜 근사만으로 사건 후보 추림
   │
   ▼
[5] callReviewEngine(input)  ── packages/llm ──
   │
   ├─▶ GEMINI_API_KEY 있음 → callGemini
   │   • OpenAI-호환 endpoint: https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
   │   • model: gemini-2.0-flash (env로 오버라이드)
   │   • temperature: 0
   │   • timeout: 30s
   │   • 429 → C등급 + "잠시 후 다시 시도" 메시지 graceful fallback
   │
   └─▶ GEMINI_API_KEY 없음 → callOllama
       • endpoint: http://localhost:11434/api/chat
       • model: gemma4:latest
       • timeout: 60s
   │
   ▼ JSON 응답 파싱
[6] parseReviewResponse(text)
   │  ```json …``` 또는 raw `{…}` 추출 → grade·rationale·suggestions
   │  파싱 실패 → C등급 + "수동 검토 권장" 폴백
   │
   ▼
[7] Grade → riskScore 매핑
   F=critical · D=danger · C=caution · B=safe · A=safe
   │
   ▼
[8] saveCache(hash, req, result) — best effort
   │
   ▼
응답 {
  grade, riskScore, flaggedKeywords, matchedEvents[],
  rationale, suggestions[], ruleTriggered, cached
}
```

### 폴백 우선순위 정리

```
입력 → 캐시 hit?
        ├─ Y → 캐시 반환
        └─ N → 룰 hit?
                ├─ Y → F등급 즉시 반환 (LLM 호출 X)
                └─ N → Gemini 호출
                        ├─ 200 → 정상 응답
                        ├─ 429 → C등급 graceful
                        ├─ 기타 에러 → 예외 throw
                        └─ GEMINI_API_KEY 없음 → Ollama
                                                  ├─ 200 → 정상 응답
                                                  └─ 에러 → 예외 throw
```

## 데이터 모델

자세한 스키마: [`data-schema.md`](./data-schema.md)

```
events (31건 큐레이션)
  ├─ slug (PK) · month · day · category · risk_level · recommended_tone
  ├─ related_keywords[] · related_motifs[] · references[]
  └─ embedding vector(768)  ⚠️ 현재 미사용

keywords_blacklist (마이그레이션 됨, 실제 룰은 코드 내 인-메모리)
  └─ term · severity · related_event_id

reviews (검토 결과 캐시, TTL 7일)
  └─ input_hash (UNIQUE) · grade · risk_score · matched_events · llm_rationale · cached_until
  ⚠️ 마이그레이션 SQL에 `grade` 컬럼 누락 — STATUS.md 드리프트 항목 참조

waitlist
  └─ email (UNIQUE) · source
```

## 5등급 시스템 (F/D/C/B/A)

ADR: [`decisions/0003-five-grade-system.md`](./decisions/0003-five-grade-system.md)

| Grade | riskScore | 의미 | 코드 |
|---|---|---|---|
| **F** | critical | 절대 회피 | `🚫 D13438` 빨강 |
| **D** | danger | 강력 재검토 권고 | `⚠️ D83B01` 주황 |
| **C** | caution | 톤·문구 조정 권장 | `⚠️ 8764B8` 보라 |
| **B** | safe | 표준 주의 하에 진행 | `✅ 107C10` 녹색 |
| **A** | safe | 권장 톤과 맞음 | `✨ 0078D4` 파랑 |

매핑 헬퍼: `packages/shared/src/types.ts` `toneToGrade(tone, risk_level)`.

## 환경 변수 일람

> 정전: `.env.example` (git에 포함되어 있음, 비밀 없음).
> 실제 값은 `.env.local` / Vercel 환경 변수로 관리. **절대 커밋 금지.**

### Supabase (필수)
| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트·서버 양쪽 접근 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트용. 익명 권한 |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용**. API 라우트에서 RLS 우회 |
| `DATABASE_URL` | 로컬 마이그레이션용 직접 Postgres 연결 (예: `postgresql://localhost/nunchi`) |

### LLM (`GEMINI_API_KEY` 또는 Ollama 둘 중 하나는 있어야 동작)
| 변수 | 기본값 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | (없음) | 있으면 Gemini 우선 |
| `GEMINI_MODEL` | `gemini-2.0-flash` | 모델 오버라이드 |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | 로컬 Ollama |
| `OLLAMA_MODEL` | `gemma4:latest` | 폴백 모델 |

### 이메일 (선택)
| 변수 | 설명 |
|---|---|
| `RESEND_API_KEY` | 웨이트리스트 컨펌 메일. 없으면 graceful skip |

### Vercel
- pnpm 9.15.9 자동 감지 (root `package.json` `packageManager` 필드)
- `vercel.json` 설정:
  - `installCommand: pnpm install --no-frozen-lockfile` (워크어라운드)
  - `buildCommand: pnpm --filter web build`
  - `outputDirectory: apps/web/.next`

## 디자인 시스템

`apps/web/app/globals.css`에 Microsoft Fluent Design 팔레트 import.
- `--ms-blue` (#0078D4) primary
- `--ms-surface` (#FAF9F8) canvas
- Grade 색상은 Fluent semantic에 정렬 (`grade-f-*` `grade-a-*` 등)
- Tailwind v4가 import되어 있지만 실제 스타일은 CSS custom properties 중심

## 보안 가드

- `.env*` 파일은 `.gitignore`로 차단
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 코드에 노출 금지 (`apps/web/lib/supabase.ts`의 `getSupabaseAdmin()`만 사용)
- Resend API 키는 서버 라우트 한정
- 캠페인 입력은 LLM에 전송됨 — 영업 비밀 우려 시 사용자 고지 필요

## 알려진 드리프트 / 청소 대상

자세한 진행: [`STATUS.md`](./STATUS.md)

- pgvector 차원: `migrate.ts`=768 vs `data-schema.md`=1536 → 768로 통일
- `reviews.grade` 컬럼: 코드에서 사용 중이지만 마이그레이션 SQL 누락 → ALTER 필요
- `@anthropic-ai/sdk` 미사용 의존성 → 제거
- 캘린더 `SAMPLE_EVENTS` 하드코딩 → DB fetch로 교체
