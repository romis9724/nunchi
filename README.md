# Noonchi (눈치)

> **캠페인 기획 단계**에서 날짜 × 컨셉 × 카피 조합의 사회·문화·역사적 리스크를 사전 검증해, 브랜드 사고를 예방하는 SaaS.

```
status:  live-MVP (Vercel deployed)
events:  31 / 50 curated
LLM:     Gemini 2.0 Flash (+ Ollama gemma4 fallback)
stack:   Next.js 16 · Supabase · pnpm monorepo
license: TBD
```

## Why Now

2026년 5월 18일, 스타벅스 코리아가 5·18 광주민주화운동 기념일 당일 "탱크데이" 텀블러
프로모션을 진행했다. "책상에 탁!" 문구가 박종철 고문치사 사건을 연상시킨다는 비판이
폭주, 전국 불매·대표 해임·정부 보이콧·미국 본사 사과로 이어졌다.

본질 원인: **마케터가 특정 날짜의 역사적·정치적 맥락을 모를 수 있다.**
기존 도구는 이 빈틈을 메우지 못한다 — 마케팅 이슈 캘린더는 "이날 무엇을 기념하라"만,
Brand Safety 툴은 사후 검증만 다룬다.

Noonchi는 그 빈틈을 메운다.

## 핵심 가치

날짜 + 캠페인 컨셉/카피/시각 키워드 입력 →
**위험 등급(F·D·C·B·A) + 사유 + 매칭 사건 + 출처 + 대안 카피** 즉시 응답.

| 등급 | 의미 |
|---|---|
| **F** | 절대 회피. 즉각 재검토 |
| **D** | 강력 재검토 권고 |
| **C** | 톤·문구 조정 권장 |
| **B** | 표준 주의 하에 진행 가능 |
| **A** | 권장 톤과 맞음 (예: 광복절 + "독립") |

자세한 등급 산출 로직: [`docs/architecture.md`](./docs/architecture.md)

## 1차 페르소나

**1인 브랜드 / SNS 운영 대행사 PMM** — 가입 없이, 1~3분 안에, 1화면으로 검토.
결제·결재 워크플로우·PDF·팀 공유는 MVP에서 제외 (사양 결정 근거: [`docs/decisions/0001-mvp-scope.md`](./docs/decisions/0001-mvp-scope.md))

## 디렉토리

```
noonchi/
├── CLAUDE.md                       # 프로젝트 컨텍스트 (Claude/협업자용)
├── apps/web/                       # Next.js 16 (App Router)
│   ├── app/(landing)/              # 랜딩 + 웨이트리스트
│   ├── app/check/                  # 검토 페이지 (입력+결과)
│   ├── app/calendar/               # 캘린더 뷰
│   ├── app/api/check/              # 검토 API
│   ├── app/api/waitlist/           # 웨이트리스트 이메일 API
│   ├── lib/review-engine.ts        # 3단 hybrid: 캐시 → 룰 → LLM
│   └── components/result-card/     # 등급 배지 + 결과 카드
├── packages/
│   ├── llm/                        # LLM 어댑터 (Gemini + Ollama 폴백)
│   └── shared/                     # 공용 타입 / 등급 매핑
├── data/events/                    # 31건 큐레이션 JSON (목표 50건)
├── scripts/                        # migrate, seed
└── docs/                           # 문서 (이 README 외)
```

## 문서 인덱스 (`docs/`)

| 파일 | 내용 |
|---|---|
| [`STATUS.md`](./docs/STATUS.md) | **지금까지 진행 + 남은 일 + 알려진 위험** (가장 자주 갱신) |
| [`roadmap.md`](./docs/roadmap.md) | Phase 0~4 로드맵 + Definition of Done |
| [`architecture.md`](./docs/architecture.md) | 검토 엔진 파이프라인 / Supabase 스키마 / 환경 변수 |
| [`data-schema.md`](./docs/data-schema.md) | `events`·`keywords_blacklist`·`reviews`·`waitlist` 스키마 |
| [`decisions/0001-mvp-scope.md`](./docs/decisions/0001-mvp-scope.md) | 무가입 익명 MVP 결정 |
| [`decisions/0002-llm-provider-gemini.md`](./docs/decisions/0002-llm-provider-gemini.md) | Claude → Gemini 전환 |
| [`decisions/0003-five-grade-system.md`](./docs/decisions/0003-five-grade-system.md) | 3등급 → 5등급(F/D/C/B/A) |

## 빠른 시작

```bash
# 1. 의존성 설치 (pnpm 9.15.9 권장)
pnpm install

# 2. 환경 변수 설정 — `.env.example`을 복제해 채운다
cp .env.example .env.local
# 필요한 키: SUPABASE_*, GEMINI_API_KEY (또는 로컬 Ollama), RESEND_API_KEY

# 3. DB 마이그레이션 + 시딩 (로컬 Postgres 또는 Supabase)
pnpm db:migrate
pnpm db:seed                # data/events/*.json → Supabase

# 4. 개발 서버
pnpm dev                    # http://localhost:3000
```

환경 변수 전체 일람과 LLM 폴백 시나리오는 [`docs/architecture.md`](./docs/architecture.md) 참조.

## 기술 스택 (실제 사용 중)

| 영역 | 스택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 16.2.6 (App Router) + React 19 | `apps/web/AGENTS.md` 주의 — "this is NOT the Next.js you know" |
| 스타일 | CSS custom properties (Microsoft Fluent palette) + Tailwind v4 mixin | 컴포넌트 라이브러리 없음 |
| 데이터 | Supabase PostgreSQL + pgvector (768d, 현재 미사용) | service_role 키로 RLS 우회 |
| LLM | Gemini 2.0 Flash (OpenAI-compatible endpoint) | 429 시 C등급 폴백 |
| LLM 폴백 | Ollama `gemma4:latest` (로컬) | `GEMINI_API_KEY` 미설정 시 |
| 이메일 | Resend | 웨이트리스트 컨펌 |
| 모노레포 | pnpm workspaces | apps/web, packages/llm, packages/shared, scripts |
| 배포 | Vercel | `vercel.json` 모노레포 설정 |

## 개발 원칙 (CLAUDE.md 발췌)

1. **데이터 정확성 > 기능 수** — 사건 DB는 검증된 출처(정부/학술/메이저 언론/위키 다중)만
2. **정치적 중립** — 좌/우 편향 없이 사실만. 해석은 사용자 판단
3. **사용자 결정권 존중** — "금지"가 아닌 "정보 + 권고"
4. **한국 시장 우선** — 글로벌은 PMF 후 확장
5. **기밀성** — 캠페인 입력은 영업 비밀, 보안 우선

## 라이선스

미정 (TBD). 본격 공개 전 결정 예정.

## 컨택트

- 프로젝트 컨텍스트 단일 출처: [`CLAUDE.md`](./CLAUDE.md)
- 진행 현황: [`docs/STATUS.md`](./docs/STATUS.md)
- 이슈는 GitHub Issues로

---

> _"이날 무엇을 기념하라"가 아니라 **"이날 무엇을 피하라"** 를 알려주는 도구._
