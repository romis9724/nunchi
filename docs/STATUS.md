# Noonchi — 진행 현황 스냅샷

> **이 문서는 Noonchi가 어디까지 왔고 무엇이 남았는지의 단일 출처(Source of Truth)다.**
> 마지막 갱신: 2026-05-25

## TL;DR

- **상태**: live-MVP (Vercel 배포 중)
- **데이터**: **50 / 50 큐레이션 (100%, JSON 기준)** — production DB 동기화 완료
- **핵심 플로우**: 작동 — 검토 입력 → 5등급 결과 → 웨이트리스트 캡처
- **막힌 곳**: pgvector 미사용, 캘린더 DB 미연동, 회귀 테스트 부분(5·18/세월호/8·15 시나리오 미완), 사용자 인터뷰 미시작
- **다음 1주**: 캘린더 DB 연동 + 핵심 회귀 테스트 + PMM 5명 인터뷰 모집

---

## ✅ 작동 중 (Verified)

### Web App (`apps/web/`)
- [x] 랜딩 페이지 `/` — Hero, 데모, 5등급 설명, 웨이트리스트 폼
- [x] 검토 페이지 `/check` — 입력 폼(날짜·캠페인명·카피·비주얼 키워드) + 결과 카드
- [x] 캘린더 페이지 `/calendar` — 월별 색상 코딩, 사이드바 사건 상세 (⚠️ 데이터 하드코딩, 아래 참조)
- [x] 모바일 반응형 (767px 분기)

### API
- [x] `POST /api/check` — 검토 파이프라인
- [x] `POST /api/waitlist` — Resend 발송 + Supabase upsert

### 검토 엔진 (`apps/web/lib/review-engine.ts`)
- [x] 7일 캐시 — `reviews` 테이블 input_hash 기반
- [x] 룰 매칭 — 20+ 고위험 키워드(탱크·계엄·세월호·이태원·압사·욱일기 등) 즉시 F등급
- [x] LLM 호출 — Gemini 2.0 Flash 우선, 실패 시 Ollama gemma4 폴백
- [x] 429 graceful degradation — C등급 + 안내 메시지
- [x] 결과 ↔ 등급 매핑 (`@noonchi/shared` `toneToGrade()`)

### 데이터 (`data/events/`)
- [x] **50개 JSON 큐레이션** — 모두 의미 있는 summary, 정부/학술 출처 링크, related_keywords·motifs 명시
- [x] 큐레이션된 핵심 사건:
  - 정치 트라우마: 5·18 광주, 4·19 혁명, 10·26 김재규, 12·12 쿠데타, 6·10 항쟁, 노무현 서거, 박정희 5·16, 박근혜 탄핵, 노무현 탄핵, 3·15 부정선거, 박종철 고문치사, 이한열, 10·17 유신, 11·12 촛불
  - 재난: 세월호 4·16, 이태원 10·29, 천안함 3·26, 연평도 11·23, 용산참사 9·29, 제2연평해전 6·29, IMF 외환위기 11·21
  - 학살·인권: 4·3 제주, 위안부 1·28
  - 국가기념일: 광복절 8·15, 한글날 10·9, 현충일 6·6, 개천절 10·3, 3·1절, 제헌절 7·17, 어린이날·어버이날·스승의 날, 9·17 유엔가입, 7·27 정전협정, 7·4 남북공동성명, 10·10 노동당창건, 5·1 노동절, 3·8 여성의날
  - 일반 기념일: 발렌타인·화이트데이·할로윈·빼빼로데이·크리스마스·신정·새해
  - 외교 변수: 8·10 일본 정치인 독도 방문, 6·13 미군 장갑차 사고, 9·2 일본 항복(미군 시각)

### 인프라
- [x] Supabase 스키마 마이그레이션 — `events` / `keywords_blacklist` / `reviews` / `waitlist`
- [x] Vercel 모노레포 배포 — `prj_4K0a9VqK8TgcioqT8EDtwak5nz0j`
- [x] pnpm 9.15.9 workspaces

### 디자인 시스템
- [x] Microsoft Fluent Design 팔레트 (CSS custom properties)
- [x] 5등급 배지 컴포넌트 (`GradeBadge`)
- [x] 결과 카드 (`ResultCard`) — 등급·플래그 키워드·매칭 사건·사유·대안 카피

---

## ⚠️ 부분 작동 / 알려진 위험

### pgvector 임베딩 미사용
- **현상**: `migrate.ts`는 `embedding vector(768)` 컬럼을 만들지만 `seed.ts`가 채우지 않음.
- **영향**: 의미 기반 검색 비활성. 현재는 키워드 매칭 + 날짜 ±3일 근사 사건 조회만으로 동작.
- **언제 문제 되나**: 데이터가 100건 이상으로 늘거나, 카피 의미 매칭이 필요한 시점.
- **해결안**: Ollama nomic-embed-text 또는 OpenAI/Gemini 임베딩 API로 seed 시 채우기. `generateEmbedding()` 함수는 이미 존재(`packages/llm/src/claude.ts:127`).

### 캘린더 데이터 하드코딩
- **현상**: `apps/web/app/calendar/page.tsx`의 `SAMPLE_EVENTS` 배열에서 직접 렌더.
- **영향**: `data/events/*.json` 추가가 캘린더에 반영되지 않음. 데이터 갱신이 양쪽에서 일어남.
- **해결안**: 캘린더 페이지를 Server Component로 만들고 `events` 테이블에서 fetch.

### Gemini 429 폴백이 위험 가림 가능
- **현상**: Gemini 분당 쿼터 초과 시 자동으로 C등급 + "잠시 후 다시 시도" 안내 반환.
- **영향**: 진짜 F등급 사건이 C로 표시될 수 있음. 사용자에게 "재시도 권장" 안내가 가지만, 모르고 진행할 위험.
- **완화 중**: 7일 캐시 + Ollama 로컬 폴백.
- **개선안**: 룰 매칭으로 사전 차단 키워드가 hit하면 LLM 호출 자체 생략(이미 구현됨). 더 많은 키워드 등록 필요.

### service_role 키 사용
- **현상**: API 라우트가 Supabase service_role 키로 RLS 우회.
- **이유**: MVP 익명 사용 모델 — 사용자 인증이 없으므로 anon 키로는 reviews·waitlist 쓰기 불가.
- **위험**: 사용자 인증 도입 시 RLS 정책 재설계 필요.

### pnpm frozen-lockfile 비활성
- `vercel.json` `installCommand: pnpm install --no-frozen-lockfile` 워크어라운드.
- Vercel이 pnpm 워크스페이스를 매번 깔끔히 감지하지 못해서 추가됨 (commit `b308768`).
- 락파일 무결성 약화 — 의존성 픽스 후 재고려.

### 문서 ↔ 코드 드리프트
- `docs/data-schema.md`의 `events.embedding`은 `vector(1536)`로 적혀 있지만, 실제 `migrate.ts`는 `vector(768)` — 단일 출처 통일 필요.
- ~~같은 문서의 `reviews` 테이블에 `grade` 컬럼이 없지만, 실제 코드는 `grade`를 upsert함~~ → **✅ 해소 (2026-05-25)**: production DB에 `grade text NULL DEFAULT 'C' CHECK (grade IN ('A','B','C','D','F'))` 적용 확인. `migrations/002_add_grade_to_reviews.sql`도 idempotent하게 추가됨.
- `docs/decisions/0001-mvp-scope.md`은 "Claude API Hybrid 엔진"으로 기록되어 있으나 실제는 Gemini — ADR-0002로 supersede됨.

### 미사용 의존성
- `apps/web/package.json`에 `@anthropic-ai/sdk: ^0.36.3` 설치되어 있으나 코드에서 import 없음. 다음 청소 시 제거.

---

## ❌ 남은 일 (Not Started)

### Phase 1 — 데이터 완성 + pgvector
- [x] **사건 19건 추가 큐레이션 (31 → 50)** — 박종철, 박근혜·노무현 탄핵, 3·15 부정선거, 5·16, 이한열, 7·27 정전협정, 9·17 유엔가입, 10·17 유신, 11·12 촛불, IMF, 제2연평해전, 7·4 남북공동성명, 노동절, 여성의날, 도쿄도지사 독도방문, 미군 장갑차 사고, 일본 항복일, 노동당 창건일 (PR #1)
- [x] **production DB seed 동기화** (2026-05-25) — Supabase MCP로 50/50 확인
- [ ] `seed.ts`에 임베딩 생성 추가
- [ ] `review-engine.ts`에서 pgvector 유사도 검색 활성화

### Phase 2 — 검증
- [x] **인프라**: `tests/` workspace 추가 + tsx-driven 회귀 테스트 자리 (PR #1, 13건 — waitlist/migration 중심)
- [ ] **누락 시나리오 보완**: 5·18+탱크(F), 4·16+리브랜드(F), 8·15+독립(A), 평일+신상(B), 1·29+코미디
- [ ] CI에서 `pnpm test:regression` 실행 (root package.json에 스크립트 추가됨, CI 미연결)
- [ ] 캘린더 페이지 DB 연동 (하드코딩 제거)

### Phase 3 — 사용자 피드백
- [ ] 사용자 5명 1:1 인터뷰 모집 (1인 PMM 페르소나)
- [ ] "쓸만하다" 응답 ≥ 3/5 측정
- [ ] 단점·실수 사례 ≥ 5건 수집

### Phase 4 — 이후 결정 (PMF 후)
- [ ] 결제 / 가격 결정
- [ ] 인증 도입 시 RLS 정책 재설계
- [ ] 영문 README / 글로벌 데이터
- [ ] 대행사 AE 페르소나 확장 (M4 클로즈드 베타)

전체 로드맵: [`roadmap.md`](./roadmap.md)

---

## Definition of Done — MVP "완료"

이번 MVP는 **사용자 5명 이상이 "쓸만하다"로 응답**하면 PMF 1차 통과로 본다.
부수 지표:
- 데이터 50건 완성
- 회귀 테스트셋 5건 모두 통과
- 캘린더 DB 연동
- pgvector 활성화

---

## 변경 이력

| 날짜 | 변경 |
|---|---|
| 2026-05-24 | STATUS.md 최초 작성. 31개 이벤트, Gemini 폴백, 5등급 시스템 박제 |
| 2026-05-25 | 데이터 31→50 완성(JSON+production DB 동기화). `reviews.grade` 드리프트 해소 확인(Supabase MCP). PR #1: Phase 1 deliverables (waitlist 리팩토링·migration·회귀 테스트 기반) |
