# Noonchi (눈치) — Project Context

> 작업명: **Noonchi (눈치)** — 변경 가능. 이 파일에서 이 이름만 바꾸면 됨.
> 이 문서는 Claude Code 및 협업자가 프로젝트 전반을 빠르게 인지하기 위한 단일 컨텍스트 파일이다.

---

## 1. 한 줄 정의

캠페인 기획 단계에서 **날짜 × 컨셉 × 카피** 조합의 사회·문화·역사적 리스크를 사전 검증해, 브랜드 사고를 예방하는 SaaS.

## 2. 문제 정의 (Why now)

- **트리거 사건**: 2026년 5월 18일, 스타벅스 코리아가 5·18 광주민주화운동 기념일 당일 "탱크데이" 텀블러 프로모션을 진행. "책상에 탁!" 문구가 박종철 고문치사 사건을 연상시킨다는 비판이 폭주.
- **결과**: 전국 불매 운동, 손정현 대표 해임, 정용진 회장 사과, 정부 부처 단위 "스타벅스 지우기" 진행. 미국 본사까지 공식 사과.
- **본질적 원인**: 마케터가 특정 날짜의 역사적·정치적·사회적 맥락을 **모를 수 있다**. 그리고 기존 도구는 이 빈틈을 메우지 못한다.

### 기존 도구의 한계

| 카테고리 | 대표 사례 | 한계 |
|---|---|---|
| 마케팅 이슈 캘린더 | 나스미디어/알바트로스/캐릿/아이보스 | "이날 무엇을 기념하라" 중심. "이날 무엇을 피하라"는 누락. |
| Brand Safety 툴 | Hootsuite, SafeCollab, Stellar | 광고 게재 위치·인플루언서 사후 검증 위주. 캠페인 기획 사전 단계 검토 없음. |
| 문화 민감성 체크리스트 | Pau Hana 등 | 수동 체크리스트. 자동화·확장성 없음. |

## 3. 솔루션 개요

날짜 + 캠페인 컨셉/카피/시각 키워드를 입력하면, LLM이 해당 날짜의 역사적·사회적 컨텍스트와 교차 검토하여 **위험 등급 + 사유 + 대안**을 즉시 제공.

## 4. 타겟 사용자

- **1차**: 한국 대기업/중견기업 마케팅 팀, 광고 대행사 AE, 콘텐츠 매니저
- **2차**: 스타트업 PMM, 1인 브랜드 운영자, SNS 운영 대행사
- **3차 (확장기)**: 일본/미국/동남아 마케터

## 5. MVP 기능 범위

### MUST (M1)
1. **날짜 컨텍스트 DB**
   - 한국 주요 역사적·정치적·사회적 민감일 (5·18, 4·16, 4·3, 6·25, 8·15, 10·26, 12·12 등)
   - 각 일자별: 리스크 등급, 피해야 할 키워드/이미지 모티프, 권장 톤, 출처 링크
2. **캠페인 사전 검토 엔진**
   - 입력: 날짜 + 캠페인명 + 카피 + 시각자료 키워드
   - 출력: 위험 등급 (안전 / 주의 / 위험), 구체 사유, 관련 역사 사건 요약, 대안 제안
3. **민감일 캘린더 뷰**
   - 월별/주별 시각화, 위험도 색상 코딩, 클릭 시 컨텍스트 상세

### SHOULD (M2)
- 위험 키워드 블랙리스트 (탱크, 503, 책상 탁, 발포 등) 자동 플래그
- 카피라이팅 대안 자동 제안
- 검토 이력 저장 및 팀 공유

### COULD (M3+)
- Slack / Notion / Figma 연동
- 팀 결재 워크플로우 (마케터 → 법무 → 임원)
- 글로벌 확장 (일본, 미국, 동남아)
- 이미지/영상 분석

### WON'T (out of scope)
- 실시간 SNS 모니터링 (사후 대응 영역)
- 발행된 콘텐츠 사후 평가

## 6. 핵심 사용 시나리오

1. 마케터 A가 5월 18일 새 텀블러 시리즈 런칭을 검토.
2. Noonchi 앱에 입력: 날짜 `2027-05-18`, 컨셉 `탱크 시리즈`, 카피 `책상에 탁!`.
3. 즉시 결과 표시:
   - **위험 등급: 위험 (High)**
   - 관련 사건: 5·18 광주민주화운동 (계엄군 탱크 투입), 박종철 고문치사 사건 ("책상을 탁 치니 억 하고 죽었다")
   - 권고: 5/18 회피 또는 컨셉 전면 재검토
   - 대안 카피 예시 제시
4. 마케터가 일자 조정 또는 컨셉 변경 후 재검토.

## 7. 데이터 모델 (초안)

```
events
  - id, date (or recurring rule), country, name
  - category (memorial / political / social / disaster)
  - risk_level (low / medium / high / critical)
  - related_keywords[]      # 피해야 할 단어
  - related_motifs[]        # 피해야 할 시각 모티프
  - recommended_tone        # 권장 톤 (추모 / 중립 / 회피)
  - summary, references[]   # 출처 (위키, 정부 공식, 학술)

keywords_blacklist
  - term, related_event_id, severity, context_note

campaigns
  - id, user_id, date, name, copy, asset_keywords[], status

reviews
  - id, campaign_id, risk_score, flagged_keywords[]
  - matched_events[], suggestions, llm_rationale, reviewed_at
```

## 8. 기술 스택 (후보, 미확정)

| 영역 | 1순위 | 대안 |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui | Remix |
| Backend | Next.js Route Handlers | FastAPI (Python) |
| DB | PostgreSQL (Supabase) | Neon |
| LLM | Claude API (Anthropic) | OpenAI / Gemini |
| 벡터 검색 | pgvector | Pinecone |
| 배포 | Vercel + Supabase | Cloudflare / Fly.io |

## 9. 개발 원칙

1. **데이터 정확성 > 기능 수**: 역사적 사건 DB는 검증된 출처로만 채운다. (정부 공식 자료, 학술 자료, 메이저 언론, 위키피디아 다중 검증)
2. **정치적 중립**: 좌/우 편향 없이 사실만 기록. 사건 해석은 사용자 판단에 맡긴다.
3. **사용자 결정권 존중**: "금지"가 아닌 "정보 제공 + 권고". 최종 결정은 마케터/브랜드가 한다.
4. **한국 시장 우선**: MVP는 한국 컨텍스트 완성도에 집중. 글로벌은 PMF 확인 후 확장.
5. **기밀성**: 캠페인 정보는 영업 비밀. 입력 데이터의 보관·전송·LLM 호출 시 보안 우선.

## 10. 참고 사례 (학습 데이터 / 벤치마크)

**국내 사고 사례**
- 2026.05 스타벅스 5·18 탱크데이 논란 (메인 트리거 사건)
- 과거 5·18 / 세월호 / 위안부 관련 광고 사고 사례 (수집 필요)

**해외 사례**
- 펩시 × 켄달 제너 (2017) — BLM 운동 풍자 논란
- H&M "Coolest Monkey in the Jungle" 후드티 (2018)
- D&G 중국 광고 (2018)

## 11. 마일스톤

| 단계 | 산출물 | 기한 (가안) |
|---|---|---|
| M0 | 한국 역사 사건 DB 50건 수집 + JSON 스키마 확정 | 2주 |
| M1 | 단일 페이지 검토 프로토타입 (입력 → 결과) | +3주 |
| M2 | 캘린더 뷰 + 키워드 블랙리스트 | +3주 |
| M3 | 사용자 인증 + 캠페인/검토 저장 | +2주 |
| M4 | 한국 광고 대행사 3곳 클로즈드 베타 | +4주 |

## 12. 열린 질문 / 결정 필요

- [ ] **수익 모델**: 월 구독 vs 검토 건당 vs B2B 연 계약 — 어느 쪽?
- [ ] **무료 티어 범위**: 월 N건 무료 검토? 캘린더만 무료?
- [ ] **LLM 비용 관리**: 검토 1건당 호출 비용 vs 가격 — 캐싱·사전 분류 전략
- [ ] **데이터 출처 신뢰성**: 위키피디아 + 정부 공식 자료로 충분한가? 학계 자문 필요?
- [ ] **입력 데이터 보안**: 캠페인 정보를 LLM에 보낼 때 익명화/암호화 어디까지?
- [ ] **확장성**: 글로벌 시장 진출 시 국가별 데이터 큐레이션은 누가/어떻게?
- [ ] **법적 면책**: "위험" 판정 후에도 사고가 나면 책임은? 약관 설계 필요.

## 13. 디렉토리 구조 (제안, 추후 수정)

```
noonchi/
├── CLAUDE.md                # 이 파일
├── README.md                # 외부 공개용 요약
├── docs/
│   ├── prd.md
│   ├── data-schema.md
│   └── decisions/           # ADR (Architecture Decision Records)
├── data/
│   └── events/              # JSON으로 큐레이션된 역사 사건 DB
├── apps/
│   ├── web/                 # Next.js 앱
│   └── api/                 # 백엔드 (Next.js Route Handlers or FastAPI)
├── packages/
│   ├── shared/              # 공용 타입/상수
│   └── llm/                 # LLM 호출 래퍼 + 프롬프트
└── scripts/
    └── seed/                # DB 시딩 스크립트
```

---

**다음 작업 우선순위 (Claude Code에게)**
1. `data/events/` 아래 한국 민감일 JSON 스키마 정의 (`docs/data-schema.md`)
2. 5·18, 4·16, 4·3, 6·25, 8·15 5개 사건을 샘플로 채워서 스키마 검증
3. 단일 페이지 프로토타입(`apps/web`) 스캐폴딩 — 입력 폼 + 결과 카드

<!-- ooo:START -->
<!-- ooo:VERSION:0.39.1 -->
# Ouroboros — Specification-First AI Development

> Before telling AI what to build, define what should be built.
> As Socrates asked 2,500 years ago — "What do you truly know?"
> Ouroboros turns that question into an evolutionary AI workflow engine.

Most AI coding fails at the input, not the output. Ouroboros fixes this by
**exposing hidden assumptions before any code is written**.

1. **Socratic Clarity** — Question until ambiguity ≤ 0.2
2. **Ontological Precision** — Solve the root problem, not symptoms
3. **Evolutionary Loops** — Each evaluation cycle feeds back into better specs

```
Interview → Seed → Execute → Evaluate
    ↑                           ↓
    └─── Evolutionary Loop ─────┘
```

## ooo Commands

Each command loads its agent/MCP on-demand. Details in each skill file.

| Command | Loads |
|---------|-------|
| `ooo` | — |
| `ooo interview` | `ouroboros:socratic-interviewer` |
| `ooo seed` | `ouroboros:seed-architect` |
| `ooo run` | MCP required |
| `ooo evolve` | MCP: `evolve_step` |
| `ooo evaluate` | `ouroboros:evaluator` |
| `ooo unstuck` | `ouroboros:{persona}` |
| `ooo status` | MCP: `session_status` |
| `ooo setup` | — |
| `ooo help` | — |

## Agents

Loaded on-demand — not preloaded.

**Core**: socratic-interviewer, ontologist, seed-architect, evaluator,
wonder, reflect, advocate, contrarian, judge
**Support**: hacker, simplifier, researcher, architect
<!-- ooo:END -->
