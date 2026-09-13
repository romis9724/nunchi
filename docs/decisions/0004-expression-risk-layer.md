# ADR-0004: 표현 리스크 레이어 (일베 은어·성차별·지역 비하 표현 탐지)

- 상태: 승인 (2026-09-13, 인터뷰 3문항으로 확정)
- 관련: [Codex gpt-6-astra 리서치](../research/2026-09-13-expression-risk-codex-astra.md), CLAUDE.md 개발 원칙 2·3

## 배경

2026-07 리센느 원이 "무섭노" 사건: 경상 방언 감탄형이 일베 "-노" 용법으로 지목돼 논란 → 언어학자 반박 → 역풍.
교훈: **같은 표면형이 방언이자 혐오 커뮤니티 은어**. 문맥 없는 매칭은 서비스가 오탐 가해자가 된다.
기존 엔진은 날짜 × 사건 리스크만 본다. 날짜와 무관한 "표현 자체의 리스크" 축이 없다.

## 결정

| # | 결정 | 근거 |
|---|---|---|
| 1 | **등급 반영**: `hard` 티어만 등급 **상한 D**. `contextual`·`watch`는 등급 불변, 경고만 | "금지 아닌 정보+권고" 원칙. 오탐 시 피해 최소화. Codex 권고 동일 |
| 2 | **범주**: `community`(일베 계열 + 메갈·워마드 계열, 진영 대칭) · `gender`(양방향) · `region`. 연령·장애·성소수자·인종·종교는 스키마 자리만 | 정치적 중립 = 출처 진영 무관, 위해 기준 동일 |
| 3 | **승인**: Claude 초안 `draft` → 사용자 검토 후 `approved` → **approved만 런타임 로드** | 표현 사전은 사건 DB보다 법적 민감. 사람 승인 필수 |

## 티어 정의

| tier | 조건 | 처리 |
|---|---|---|
| `hard` | 마케팅 카피에서 정상 용법이 사실상 없는 명백한 비하·조롱 (예: 김치녀, 재기해) | 등급 상한 D, status `harmful` |
| `contextual` | 정상 용법과 겹침 (홍어=음식, 운지=운지법, 한남=지명, "-노"=방언) | LLM 문맥 판정 → `harmful`/`uncertain`/`benign`. benign은 미표시. 등급 불변 |
| `watch` | 기원·의미가 다투어지는 표현 | status `informational`, 정보만 |

**"-노" 어미 단독은 절대 플래그하지 않는다.** 노무현 관련 명사와 같은 문장에 공존할 때만 `contextual` 후보(`cooccur`).

## 아키텍처 (최소)

```
data/lexicon/{community,gender,region}.json   ← 원본(source of truth), 사람 승인
        ↓ 빌드 시 번들 import (approved 필터; LEXICON_INCLUDE_DRAFT=1 로 로컬 미리보기)
apps/web/lib/expression-lexicon.ts            ← 로더 + 필드별 매처(NFC, 한글 경계+조사 허용 정규식, cooccur)
        ↓
review-engine.ts
  cache(key += campaignName + lexiconVersion + promptVersion)
  → 기존 CRITICAL_KEYWORDS 룰
  → 표현 매칭 (룰-F 경로도 플래그 반환, LLM 판정은 생략)
  → LLM 1회 호출에 날짜 판정 + expressionRisk 판정 동시 요청
  → finalize: hard → grade = worse(grade, D); flags 조립; expression_flags JSONB 캐시
        ↓
CheckResponse.expressionFlags[] → ResultCard "표현 리스크" 섹션
```

- DB 테이블 신설 없음. 미사용 `keywords_blacklist`는 그대로 둔다. `// ponytail:` 50~100항목은 번들 JSON 메모리 순회로 충분. 관리자 편집 UI가 필요해질 때 `keywords_blacklist` seed로 전환.
- 정규식 한계 명시: 억양·의도·비방언 여부는 판정 불가. 초성 변형(ㄴㅁㅎ)·띄어쓰기 우회는 MVP 미지원.

## 문구 원칙 (UI·LLM 공통)

- 사람 분류 금지: "일베 사용자", "여성혐오자" 같은 표현 사용 안 함. 표현·용법·근거만 서술.
- 라벨: hard/harmful "재검토 권고" · uncertain "문맥 확인 권고" · informational "참고".
- 플래그 없음 표시: "등록된 표현 사전에서 추가 위험을 찾지 못했습니다" ("안전" 단정 금지).
- LLM 지시: 소속·정치성향·의도 추정 금지, 방언·지명·음식·인용·비판 구분, 근거 부족 시 `uncertain`, 진영·성별별 상이 기준 금지.

## 데이터 원칙

- 항목당 검증된 출처 ≥1 (뉴스·공식·학술). 나무위키는 `wiki` 타입으로만, **단독 출처로 approved 불가**.
- 정상 용례·공격 용례를 사람이 작성. 기원 주장과 위해 범주를 분리 기록(예: 맘충을 일괄 "일베 기원"으로 등록하지 않음).
- 라이선스: UnSmile 데이터셋 CC-BY-NC-ND → 상용 학습·사전 추출 금지(분류 기준 참고만). KOLD 라이선스 불명 → 보류.

## 완료 기준 (MVP)

- 매처 단위 테스트: 방언 대조군(무섭노·그랬노·어디 가노·피아노) 플래그 **0건**, hard 정탐, 조사 결합(김치녀들이) 정탐, 음식 홍어 → contextual만.
- 스키마 검증 테스트: key 유니크, 정규식 컴파일, approved 항목은 비-wiki 출처 ≥1 + contextual은 benign_usages ≥1.
- 기존 회귀 전부 통과(llm 133, regression, scenarios), web tsc 0, Docker 재빌드 후 `/api/check` 5·18+탱크 F 유지.
- 초안 사전 50~80건, 3범주, 진영·성별 대칭.

## 후속 (백로그)

- Codex 지적 결함: semantic 검색 JS cosine → pgvector 연산자, ±3일 월 경계, F 라벨 "회피 필수" 문구 완화.
- P1: 오탐 신고 UI, 정기 검수 절차, 연령·장애 등 4범주 항목.
- P2: 라이선스 확인된 분류기(Transformers/ONNX) 비교, 초성·띄어쓰기 변형 후보 회수.
