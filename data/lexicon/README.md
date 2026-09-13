# 표현 리스크 사전 (`data/lexicon/`)

날짜와 무관하게 **표현 자체**가 지닌 수용 위험을 사전 검토하기 위한 큐레이션 데이터. 배경·결정은 [ADR-0004](../../docs/decisions/0004-expression-risk-layer.md), 데이터 소스·큐레이션 절차는 [리서치 문서 §2](../../docs/research/2026-09-13-expression-risk-codex-astra.md) 참조.

원칙: **금지가 아닌 정보 제공 + 권고**. 사전은 사람을 분류하지 않고 표현·용법·근거만 기술한다. 출처 진영과 무관하게 동일한 위해 기준을 적용한다.

## 파일

| 파일 | 범주 | 내용 |
|---|---|---|
| `community.json` | `community` | 커뮤니티 은어 — 일베 계열 **및** 메갈리아·워마드 계열(진영 대칭). 의미가 커뮤니티 밖에서는 불투명한 표현 |
| `gender.json` | `gender` | 여성 비하 **및** 남성 비하(양방향). 사회 일반에서 통용되는 성별 비하 표현 |
| `region.json` | `region` | 지역 비하. **방언 자체는 등록하지 않는다** |
| `_candidates-unsourced.md` | — | 출처 검증 실패·범주 외로 보류한 후보 |

한 표현은 **한 파일에만** 넣는다. 범주는 주된 위해 대상 기준(예: `한남`은 남성 비하 → `gender`, `재기해`는 커뮤니티 은어 → `community`). 연령·장애·성소수자·인종·종교는 스키마 자리만 있고 항목은 없다.

## 스키마

각 파일은 아래 객체의 **JSON 배열**.

```json
{
  "key": "kimchi-nyeo",
  "term": "김치녀",
  "category": "community | gender | region",
  "tier": "hard | contextual | watch",
  "severity": "critical | high | medium",
  "status": "draft | approved | deprecated",
  "patterns": [{ "type": "literal", "value": "김치녀" }],
  "cooccur": ["노무현|봉하|부엉이바위"],
  "meaning": "중립 서술. 어떤 집단을 어떻게 비하하는 용법인지. 기원 주장은 '~로 알려짐'으로 분리.",
  "benign_usages": ["정상 용법 목록. contextual은 1개 이상 필수"],
  "harmful_example": "공격적 용법 예문(사람이 새로 작성, 실제 발화 인용 금지)",
  "benign_example": "정상 용법 예문(hard 티어만 빈 문자열 허용)",
  "note": "UI에 그대로 노출되는 1~2문장",
  "alternative": "대안 표현(선택)",
  "sources": [{ "label": "매체명 기사제목 (날짜)", "url": "https://…", "type": "official | academic | news | wiki", "accessed": "YYYY-MM-DD" }],
  "reviewed_by": null,
  "reviewed_at": null
}
```

- `key`: 전체 파일 통틀어 유니크. 소문자 영문·숫자·하이픈.
- `patterns[].type`
  - `literal`: 코드가 **한글 경계 + 조사 결합**(들/은/는/이/가/을/를/에게/처럼 …) 정규식으로 감싼다. **복합어 내부에는 매칭되지 않는다** — `홍어`는 `홍어회`에, `한남`은 `한남동`에, `운지`는 `운지법`에 매칭되지 않는다(의도된 오탐 방지). 반대로 공격적 복합어(`홍어족`, `운지하다`, `한남놈`)를 잡으려면 `regex`로 명시하거나 변형을 별도 `literal`로 나열한다.
  - `regex`: JS `u` 플래그로 **그대로** 컴파일. 컴파일 가능해야 한다.
- `cooccur` (선택): 정규식 배열. 있으면 **같은 문장 안에서** `patterns`와 `cooccur`가 모두 매칭될 때만 플래그. `-노` 어미류는 반드시 `cooccur`로만 정의하고 단독 패턴 금지.
- `severity` 허용 조합: `hard` → `critical|high`, `contextual` → `high|medium`, `watch` → `medium`.

## 티어

| tier | 조건 | 런타임 처리 |
|---|---|---|
| `hard` | 마케팅 카피에서 정상 용법이 사실상 없는 명백한 비하·조롱·폭력/자살 조장(김치녀, 한남충, 재기해, 삼일한 …) | 등급 상한 **D**. 인용·비판 문맥도 LLM에 맡기지 않고 D로 처리됨 |
| `contextual` | 정상 용법과 표면형이 겹침(홍어=음식, 운지=운지법, 한남=지명, 소추=訴追, 김여사=호칭, `-노`=방언) | LLM 문맥 판정 → `harmful` / `uncertain` / `benign`. 등급 불변, 경고만. **`benign_usages` 1개 이상 필수** |
| `watch` | 기원·의미가 다투어지거나 근거가 약함(보이루, 오조오억, 허버허버, 웅앵웅) | 정보만(`informational`). 혐오로 확정 서술하지 않는다 |

방언 대조군(무섭노·그랬노·어디 가노·피아노)은 플래그 0건이어야 한다. `-노` 항목은 노무현 관련 명사가 같은 문장에 있을 때만 `contextual` 후보가 된다.

## 승인 절차

1. Claude가 `status: "draft"`로 초안 작성 (이 디렉터리의 현재 상태).
2. 사용자가 항목별로 `meaning`/`note`/`benign_usages`/예문/출처를 검토한다. 티어 조정·삭제 자유.
3. 승인 시 `status`를 `"approved"`로, `reviewed_by`/`reviewed_at`을 채운다.
4. `pnpm test:regression` 통과 확인(스키마 검증: key 유니크·정규식 컴파일·approved는 비-wiki 출처 ≥1·contextual은 benign_usages ≥1, 매처 테스트: 방언 대조군 0건·hard 정탐·조사 결합 정탐).
5. Docker 재빌드. **런타임은 `approved`만 로드**한다.
6. 폐기는 삭제 대신 `status: "deprecated"`.

로컬 미리보기: `LEXICON_INCLUDE_DRAFT=1` 로 실행하면 draft도 로드된다.

## 출처 규칙

- 항목당 **검증된 출처 ≥1**. 검증 = 실제 페이지를 열어 해당 표현이 언급됨을 확인. URL 날조 금지, 확인 못 한 URL은 버린다.
- 우선순위: 국립국어원·국가인권위·KISO 등 `official` > KCI/DBpia `academic` > 주요 언론 `news` > 나무위키·위키백과 `wiki`.
- `wiki`는 보조 출처만. **wiki 단독 출처 항목은 approved 불가.**
- 라이선스: UnSmile 데이터셋(CC-BY-NC-ND)은 분류 기준 참고만, 사전 추출 금지. KOLD는 라이선스 확인 전 보류.

## 문구 규칙

- `meaning`/`note`에 **사람 분류 단어 금지**: "일베 사용자", "페미", "여성혐오자" 등. "~를 비하하는 용법으로 쓰인다", "~로 받아들여질 수 있다" 형태로 쓴다.
- 정치적 평가·진영 옹호 문장 금지. 사실과 출처만.
- 기원 주장과 위해 범주를 분리한다(예: 맘충을 일괄 "일베 기원"으로 쓰지 않음). 기원은 "~로 알려짐" 수준.
- `harmful_example`은 실제 발화 인용 금지, 짧게 새로 작성, 필요 이상 자극적이지 않게. 성폭력 서술이 불가피한 항목은 예문을 생략한다.
- UI 라벨: hard/harmful "재검토 권고" · uncertain "문맥 확인 권고" · informational "참고". 플래그 없음은 "등록된 표현 사전에서 추가 위험을 찾지 못했습니다"("안전" 단정 금지).

## 검증 명령

```sh
python3 -c 'import json,sys;json.load(open(sys.argv[1]))' data/lexicon/community.json
node -e 'new RegExp(process.argv[1],"u")' '<regex>'
```
