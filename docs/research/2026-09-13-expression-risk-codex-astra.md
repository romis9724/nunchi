> 생성: 2026-09-13, Codex CLI 0.154.0 / gpt-6-astra (read-only 리포 분석). Claude(Advisor) 브리프 기반 협업 산출물. 원문 그대로 보존, 검증·채택 여부는 인터뷰 결정 후 반영.

# Nunchi 표현 리스크 확장 제안서

**권고: 검증된 소규모 사전과 기존 LLM을 결합하되, 표현 탐지와 혐오 판정을 분리한다.** 명백한 비하 용법만 등급을 제한하고, 방언·동음이의어·논쟁적 표현은 문맥 설명을 제공한다. 기존 날짜 검토와 함께 작동하는 별도 판단 축으로 구현한다.

2026-09-13 기준 코드·공식 문서 조사다. 파일 수정과 평가 실행은 하지 않았다. 원이 사례에서 신지영 교수는 전체 영상과 방언 체계를 살펴야 한다고 설명했다. **`-노` 자체, 의문사 부재, 표준어와의 혼용은 혐오 판정 근거가 될 수 없다.** [YTN 인터뷰 원문](https://m.ytn.co.kr/news_view.amp.php?param=0103_202607080709417957&version=1)

## 1. 벤치마크

`사전 연동`은 API를 발행 전에 호출할 수 있다는 뜻이며, 캠페인 검토 제품이라는 뜻은 아니다. 공급사 성능 주장은 독립 검증 결과로 취급하지 않았다.

| 제품·도구 | 검사 대상·접근법 | 한국어 | 사용 시점·요금 | Nunchi가 가져올 한 가지 |
|---|---|---|---|---|
| [Textio](https://textio.com/solutions/talent-acquisition) | 채용 문구의 성별·연령 편향, 포용성. 전용 AI; 상세 모델 구조는 비공개 | 한국어 편향 검사 **(확인 필요)** | 작성 중 사전 검사. 조직 규모별 견적 | 단어 경고를 문서 목적과 연결 |
| [WRITER](https://support.writer.com/articles/5340941978-adding-terms) | 조직 용어 사전: `Approved`, `Don’t use`, `Use carefully`, `Pending`. 규칙·용어 기반 | 한국어 생성은 지원하지만 해당 용어 검사 품질 **(확인 필요)** | Editor·확장 프로그램의 사전 검사. Starter/Team/Enterprise; 금액 **(확인 필요)** | `Use carefully`처럼 조건부 사용을 별도로 표현 |
| [alex](https://github.com/get-alex/alex) | 성별·인종·장애 관련 불평등 표현, 욕설. `retext-equality`·`retext-profanities` 규칙 | 기본 규칙은 영어 중심; 한국어 별도 구축 필요 | CLI/API로 사전 검사. MIT, 무료 | 위치·사유·대안을 함께 반환하는 작은 규칙 엔진 |
| [Grammarly](https://www.grammarly.com/blog/product/inclusive-language/) | 편향·배제적 표현에 포용적 대안 제시. AI/NLP, 세부 검출 방식 **(확인 필요)** | 일반 교정은 한국어 지원; 포용성 제안의 한국어 범위 **(확인 필요)** | 작성 중. Free/Pro/Enterprise 등; 해당 기능별 포함 범위 **(확인 필요)** | 사용자 의도를 단정하지 않는 선택형 제안 |
| [Perspective API](https://perspectiveapi.com/) | 독성·모욕 등 점수화. ML classifier | 한국어 지원 이력이 있으나 현재 속성별 지원표 **(확인 필요)** | API 사전·사후 연동. 기존 무료 쿼터형; **2026-12-31 종료**, 신규 신청 접수 종료 | 점수를 게시 금지 결정과 분리 |
| [Hive Text Moderation](https://docs.thehive.ai/docs/classification-text) | 혐오·폭력·괴롭힘 등. 딥러닝 classifier + 패턴 규칙 | 지원; 범주별 차이 존재 | API 사전·사후 연동. 개발용 100회/일, 운영 Text Moderation은 연간 계약 | 동일 범주 안에서도 용법·심각도를 구분 |
| [TUNiB / TUNiBridge](https://tunib.ai/) | 혐오 발화·개인정보 보호 NLP API. 세부 모델 구조 **(확인 필요)** | 한국어 대상; 최신 범위 **(확인 필요)** | API 사전 연동 가능. 최신 판매·요금 조건 **(확인 필요)** | 한국어 문맥에 특화된 검출 기능 |
| [카카오 세이프봇](https://www.kakaocorp.com/page/detail/9849) | 욕설·비속어 댓글 필터링. AI 기반, 증오발언 학습 데이터 구축 | 지원 | 플랫폼 댓글 노출 단계. 외부 판매 API·요금 **(확인 필요)**; 연결 자료는 과거 운영 발표 | 모델보다 먼저 판정 `Coding Book` 구축 |
| [네이버 클린봇](https://www.navercorp.com/media/pressReleasesDetail?seq=34989) | 악성·차별·비하·2차 가해 댓글. AI; 기사 제목·본문까지 문맥 활용 | 지원 | 댓글 노출 단계. 플랫폼 내 기능; 외부 판매 API **(확인 필요)** | 카피 외 캠페인명·컨셉을 함께 판단 |
| [Smilegate UnSmile](https://github.com/smilegate-ai/korean_unsmile_dataset) | 여성/가족·남성·지역·연령 등 다중 라벨. BERT classifier | 지원 | 자체 호스팅으로 사전 연동 가능. 모델 Apache 2.0; 인프라 비용 별도 | 성별 양방향과 비혐오 대조군을 분리 평가 |
| [Corepin Moderation](https://moderation.corepin.ai/) | 욕설·혐오·위협·인젝션 등. 사전 → 소형 classifier → 큰 모델 재검토 | 지원 | API 사전·사후 연동. 공개 가격 **5원/호출** | 위험 후보를 재검토해 오탐을 줄이는 구조 |

WRITER의 한국어 생성 지원과 Grammarly의 한국어 일반 교정 지원을 **한국어 혐오·포용성 검증 지원으로 확대 해석하면 안 된다.** [WRITER 언어 문서](https://support.writer.com/articles/2283730218-generating-content-in-different-languages), [Grammarly 언어 문서](https://support.grammarly.com/hc/en-us/articles/115000090971-Does-Grammarly-support-languages-other-than-English). Corepin 가격은 [공식 요금표](https://corepin.ai/pricing) 기준이다.

## 2. 데이터와 큐레이션

### 데이터 소스

| 소스 | 활용 가치 | 이용 조건·한계 |
|---|---|---|
| [UnSmile](https://github.com/smilegate-ai/korean_unsmile_dataset) | 18,742문장, 성별 양방향·지역·연령·욕설·정상 문장. 분류 기준과 검수 방식 참고 | **데이터셋 CC-BY-NC-ND 4.0**, 코드·baseline 모델 Apache 2.0. 데이터의 상업적 사용은 별도 문의 명시 |
| [K-MHaS](https://huggingface.co/datasets/jeanlee/kmhas_korean_hate_speech/blob/main/README.md) | 109,692개 댓글, 정치·출신·성별·연령 등 다중 라벨 | CC-BY-SA 4.0. 귀속표시·변형물 공유 조건 확인; 댓글의 라벨을 제품 정책으로 그대로 복제하지 않음 |
| [KOLD](https://github.com/boychaboy/KOLD) | 공격성·대상·집단 및 문제 구간 `span`. 제목과 댓글의 문맥 관계에 유용 | 배포 저장소에서 명확한 이용허락을 확인하지 못함. **상업적 이용 조건 확인 전 도입 보류** |
| [BEEP!](https://github.com/kocohub/korean-hate-speech) | 9,381개 연예뉴스 댓글, 사회적 편향·혐오 구분 | CC-BY-SA 4.0. 연예뉴스 도메인 편향, 공개 test 정답 제한 |
| [Selectstar/Datumo·TUNiB·HUMANE Lab](https://datumo.com/od_tunib-and-humane-lab/) | 선별 약 10만 문장, 11개 범주 및 대상·표현 태깅 | 공식 페이지 CC-BY-SA 3.0. 전체·공개·선별 세트 규모가 다르므로 실제 수령 버전 고정 |
| [국가인권위 혐오표현 리포트](https://www.humanrights.go.kr/base/board/read?boardManagementNo=17&boardNo=7604691&menuLevel=3&menuNo=91) | 위해·차별 판단 기준의 출발점 | 특정 인터넷 표현 전체에 대한 공식 금칙어 목록이 아님 |
| [국립국어원 연구 기록](https://m.korean.go.kr/nkview/kyear/2008/2008_10.html), [지역어 자료](https://dialect.korean.go.kr/dialect/search/coopsearch) | 성차별 표현의 대안, 방언·일반 용법 확인 | 오래된 연구는 최신 은어를 포괄하지 못함 |
| 나무위키 「일베저장소/용어」·커뮤니티 | 후보·변형·사용 사례 발견 | 해당 페이지 원문 접근 실패 **(확인 필요)**. 편집 분쟁·출처 순환 가능; 단독 승인 근거 금지 |
| 뉴스 사례 아카이브 | 실제 논란, 반론, 정정·사과와 브랜드 반응 기록 | 논란 발생과 혐오 표현이라는 사실을 분리. 원이 사례처럼 [전문가 반론·후속 사과](https://www.hankyung.com/article/2026070966027)까지 연결 |

**UnSmile 데이터는 무료 공개라는 이유로 상업 SaaS의 학습·평가·사전 추출에 투입하지 않는다.** NC는 상업적 이용 제한이고, ND는 변형물 공유 제한이다. 모델 이용허락은 별도로 검토한다. SA 역시 SaaS 전체 소스 공개를 자동으로 의미하지 않으며, 실제 재사용·배포 방식에 대한 검토가 필요하다. [CC-BY-NC-ND 조건](https://creativecommons.org/licenses/by-nc-nd/4.0/)

### 권장 승인 절차

1. 후보마다 **표현의 의미·비하 용법·기원 주장**을 별개 사실로 기록한다. `급식충/맘충/틀딱` 등을 일괄적으로 “일베 기원”으로 등록하지 않는다.
2. 공식·학술 근거 또는 독립적인 신뢰 언론의 교차 근거를 확보한다. URL, 발행일, 확인일, 관련 문단, 반론·정정 링크를 저장한다.
3. 모든 항목에 공격적 용례와 정상 용례를 사람이 새로 작성한다. 인용·교육·비판·상호 동의된 자조도 구분한다.
4. 작성자와 승인자를 분리한다. 방언 중첩 항목은 지역어 전문가 검토 전 `hard` 금지.
5. `draft → approved → deprecated`와 버전을 관리한다. 주간 후보 검토, 월간 출처·오탐 재검토를 실시한다.

기존 데이터에는 기관 홈페이지 수준의 링크가 많다. 예를 들어 [0523-roh-death.json:1](/Users/user/Workspace/Nunchi/data/events/0523-roh-death.json:1)은 재단 홈페이지를 연결한다. 표현 사전에는 **주장을 뒷받침하는 상세 페이지**를 요구해야 한다.

## 3. 기존 코드에 맞춘 최소 아키텍처

### 먼저 반영할 코드 관찰

- [critical-keywords.ts:49](/Users/user/Workspace/Nunchi/apps/web/lib/critical-keywords.ts:49)는 세 입력 필드를 합쳐 substring 매칭한다. **사건에 연결된 20개 규칙이지만 날짜 조건은 없다.**
- [review-engine.ts:202](/Users/user/Workspace/Nunchi/apps/web/lib/review-engine.ts:202)는 해당 규칙에 걸리면 LLM 없이 F로 반환한다. 이 경로에서도 표현 검사를 수행해야 한다.
- [review-engine.ts:87](/Users/user/Workspace/Nunchi/apps/web/lib/review-engine.ts:87)의 캐시 키에는 `campaignName`과 정책 버전이 없다.
- [review-engine.ts:12](/Users/user/Workspace/Nunchi/apps/web/lib/review-engine.ts:12)의 semantic 검색은 현재 **JS cosine similarity**다. pgvector 인덱스는 있지만 검색 연산자로 사용하지 않는다. ±3일 검색도 월 경계에서 잘린다.
- [claude.ts:21](/Users/user/Workspace/Nunchi/packages/llm/src/claude.ts:21)는 `GEMINI_API_KEY`가 있으면 Gemini를 선택한다. 실제 실행이 항상 로컬 qwen3라는 보장은 없다.

### 데이터 모델: JSON 원본 + 기존 테이블 재사용

**`data/lexicon/*.json`을 검수·버전 관리용 원본으로 두고, 확장한 `keywords_blacklist`에 seed하는 방식을 권고한다.** 기존 [seed.ts:42](/Users/user/Workspace/Nunchi/scripts/seed.ts:42)의 이벤트 JSON 패턴을 재사용한다. DB 직접 편집과 JSON 편집을 동시에 허용하지 않는다.

추가 필드는 다음 정도면 충분하다.

```text
entry_key       # 표현+의미 단위의 안정적 UNIQUE 식별자
category        # gender / region / age / violence / deceased_mockery / community
tier            # hard / contextual / watch
pattern_type    # literal / token / regex
pattern
evidence JSONB  # sources, exceptions, examples, reviewedAt, status
```

`term`, `term_normalized`, `severity`, `context_note`는 재사용한다. `tier`는 판정 방식, `severity`는 위해 수준으로 구분한다. `related_event_id`는 [migrate.ts:94](/Users/user/Workspace/Nunchi/scripts/migrate.ts:94)에서 **이미 nullable**이며, 날짜 독립 항목은 `NULL`이다. 기원은 `context_note/evidence`에 기록하고 위해 범주와 혼합하지 않는다.

50–100개라면 승인 항목을 프로세스 메모리에 적재해 순회하면 충분하다. 새 검색 서비스·벡터 DB·관리자 UI는 필요 없다.

### 매칭과 3단계 정책

| tier | 적용 예시·조건 | 처리 |
|---|---|---|
| `hard` | `김치녀`, `맘충` 등 검증된 비하 용법. 단어 존재만으로 인용·반대 발언까지 포함하지 않음 | 기본 D 상한. 명시적 폭력 선동처럼 별도 승인된 조건만 F |
| `contextual` | `운지`, `홍어`, `민주화`, `한남`, `이기야`, `노무+명사`, `-노` 결합 후보 | LLM이 일반 용법·인용·조롱·불명확을 구분. **자동 등급 제한 없음** |
| `watch` | 기원·의미가 다투어지는 `보이루`류, 근거 부족한 신조어 | 필요할 때 정보만 제공. 혐오로 확정하지 않음 |

`홍어` 음식, `한남` 지명, `운지` 연주법, `노무` 노동행정 용어를 예외 문맥에 포함한다. `삼일한` 같은 표현도 원문을 비판하는 캠페인에서는 사용과 인용을 분리한다. `hard` 항목이라도 적용 용법이 불명확하면 `contextual`로 판단을 유보한다.

입력은 `campaignName`, `copy`, 각 `assetKeywords`를 **필드별로** 검사한다. Unicode 정규화와 공백 정돈 후 원문 위치를 보존한다. 무차별 공백 삭제·초성 복원은 하지 않는다. JavaScript `\b` 대신 한글을 포함하는 경계와 조사 목록을 사용한다.

```ts
// 예시: 조사 결합을 허용하는 후보 추출. 목록은 실제 용례로 보강.
const slur = /(^|[^\p{L}\p{N}])(김치녀|맘충|틀딱)(?:들)?(?:은|는|이|가|을|를|에게|처럼)?(?=$|[^\p{L}\p{N}])/gu;

// 같은 문장 안에서만 결합한다. 각각의 결과만으로 위험 판정하지 않는다.
const rohContext = /노무현|봉하마을|부엉이바위/u;
const noEnding = /[가-힣]+노(?=[\s.!?…]|$)/u;

// 경어 형태를 변형한 듯한 후보. 비방언·혐오라는 증거는 아니다.
const alteredEnding = /(?:합니|입니|갑니|하십니)노(?=[\s.!?…]|$)/u;
```

`rohContext && noEnding`은 **문맥 검토 후보**만 만든다. `피아노` 같은 명사도 별도 제외해야 한다. `alteredEnding` 역시 독립적인 조롱 문맥이 없으면 위험 경고로 승격하지 않는다.

**정규식은 억양, 세대별 방언 변화, 화자의 의도, 비방언 여부를 해결하지 못한다.** 따라서 `무섭노`, `그랬노`, `어디 가노` 단독에는 표현 위험 플래그를 내지 않는다. 정상 표현 목록을 전역 면제 목록으로 만들어 주변의 실제 비하까지 지우지도 않는다.

### 파이프라인·LLM·등급

```text
버전 포함 캐시
 → 기존 규칙 + 표현 후보 매칭
 → 날짜·semantic 후보 + 필요한 문맥 판정
 → 공통 finalize: 등급 결합·표현 설명·캐시
```

기존 F 경로도 `finalize`를 거쳐 표현 플래그를 반환한다. 해당 경로에 문맥 후보가 있으면 LLM을 호출하고, 없으면 사전 설명으로 완료한다. 일반 경로에서는 기존 LLM 호출 한 번에 두 판단을 요청한다.

[review-campaign.ts:3](/Users/user/Workspace/Nunchi/packages/llm/src/prompts/review-campaign.ts:3)에 승인된 항목 ID, 문장, 의미, 정상 용법, 근거를 주입한다. 출력에는 다음을 추가한다.

```ts
expressionRisk: {
  items: [{
    entryKey: string,
    disposition: "harmful" | "benign" | "uncertain",
    rationale: string,
    alternative?: string
  }]
}
```

프롬프트 핵심은 다음과 같다.

> 표현의 용법과 예상 수용 위험을 평가한다. 사용자의 소속·정치성향·의도를 추정하지 않는다. 방언·지명·음식·인용·비판을 구분한다. 근거가 부족하면 uncertain으로 답한다. 특정 진영이나 성별에 다른 기준을 적용하지 않는다.

기존 `grade`는 날짜·캠페인 적합성 판단으로 정의하고, 표현 판정과 분리한다. 서버가 `F > D > C > B > A` 순서로 **날짜 등급과 적용 가능한 hard 제한 중 더 위험한 등급**을 선택한다. `contextual/watch`는 MVP에서 경고만 제공한다. LLM에 혼합 등급을 맡겨 우회적으로 감점하지 않는다.

qwen3:8b의 신조어·방언 판별 정확도는 아직 측정되지 않았다. 출처 URL은 모델이 만들지 않고 `entryKey`로 서버에서 연결한다. 입력 카피는 명령이 아닌 데이터로 격리한다.

특히 [claude.ts:99](/Users/user/Workspace/Nunchi/packages/llm/src/claude.ts:99)의 첫 `}`까지 추출하는 fallback 정규식은 중첩 JSON을 깨뜨릴 수 있다. 구조화 출력과 schema 검증을 적용하고, 파싱 실패·timeout은 `transient`, 문맥 판정은 `uncertain`으로 표시하며 캐시하지 않는다.

### API·캐시·UI

[types.ts:79](/Users/user/Workspace/Nunchi/packages/shared/src/types.ts:79)의 `CheckResponse`에 optional 필드를 추가한다.

```ts
expressionFlags?: Array<{
  term: string;
  category: string;
  tier: "hard" | "contextual" | "watch";
  note: string;
  sources: Array<{ label: string; url: string }>;
  alternative?: string;
  status?: "harmful" | "uncertain" | "informational";
}>;
```

서버는 신규 결과에 항상 배열을 반환하고, 구형 소비자는 무시할 수 있게 한다. `flaggedKeywords`와 `ruleTriggered`의 기존 의미는 유지한다. 설명된 정상 용법은 위험 플래그에서 제외한다.

캐시 키에 `campaignName`, `lexiconVersion`, `promptVersion`, `policyVersion`, 모델 식별자를 추가한다. `reviews.expression_flags JSONB`와 [reviews.repo.ts:19](/Users/user/Workspace/Nunchi/apps/web/lib/repositories/reviews.repo.ts:19)의 읽기·쓰기 모두 확장한다. 구버전 캐시 부재를 “표현 위험 없음”으로 표시하지 않는다.

[ResultCard.tsx:342](/Users/user/Workspace/Nunchi/apps/web/components/result-card/ResultCard.tsx:342)의 위험 단어 영역과 별개로 **표현 리스크**를 추가한다. 등급 A/B여도 표시한다.

> **‘홍어’ — 문맥 확인 권고**  
> 음식명으로 쓰이는 표현입니다. 사람·지역을 지칭하는 문맥에서는 비하로 받아들여질 수 있어 대상 확인을 권합니다.  
> 대안: 음식명이라면 ‘흑산도 홍어’처럼 대상을 구체화할 수 있습니다. · 근거 보기

“일베 사용자”, “여성혐오자” 같은 사람 분류는 금지한다. “모두 안전” 대신 “등록된 표현에서 추가 위험을 찾지 못함”을 사용한다. 기존 F 문구인 “회피 필수”도 [CLAUDE.md:110](/Users/user/Workspace/Nunchi/CLAUDE.md:110)의 권고 원칙에 맞춰 조정한다.

### 평가·출시

현재 [structure-gate.ts:104](/Users/user/Workspace/Nunchi/tests/eval/lib/structure-gate.ts:104)는 정상 문장의 F 오판을 `softWarnings`로만 처리한다. 표현 검사는 이를 필수 실패 조건으로 바꾼 별도 gate가 필요하다.

기존 100건에 **사람이 독립 작성·검수한 200건**을 추가한다.

- 공격적 용법 60건: 여성·남성 대상 각 20건 이상, 지역·연령·고인 조롱 포함.
- 정상·방언·동음이의어 80건: `무섭노/그랬노`, 음식 홍어, 한남동, 기타 운지법, 노무관리, 민주화의 역사적 의미.
- 문맥 전환 40건: 인용·교육·비판·자조, 동일 표현의 공격적 사용과 쌍 구성.
- 시스템 20건: 캠페인명만 변경, asset-only, 날짜 변경, 구캐시, 중첩 JSON, 장애, prompt injection.

**출시 기준 제안:** 구조·캐시 계약 100%, 고정 방언 대조군의 위험 오탐·표현 감점 0건, `hard` precision ≥98%/recall ≥95%, contextual 위험 후보 recall ≥90%, 성별별 FPR ≤2% 및 격차 ≤2%p. 분모와 신뢰구간을 함께 보고하며 소표본 통과를 일반 정확도로 홍보하지 않는다. qwen3 자가심사는 보조로만 사용한다.

MVP는 50–100개 검증 항목, `hard/contextual`, 프롬프트·UI·평가까지다. 이후 동의한 베타 캠페인으로 오탐을 확인한다. classifier와 변형 검색은 그다음이다.

UnSmile BERT를 **Ollama에 바로 올릴 수 있다고 가정하지 않는다.** 공개 예제는 Transformers 분류 파이프라인이며, Ollama의 해당 classification head 지원은 별도 확인이 필요하다. 후속 실험은 로컬 Transformers/ONNX 추론이 현실적이다. [UnSmile 예제](https://github.com/smilegate-ai/korean_unsmile_dataset), [Ollama import 문서](https://docs.ollama.com/import). `ㄴㅁㅎ`, `ㅇㅈ`와 embedding 유사도는 후보 회수에만 사용하고 자동 제한하지 않는다.

## 4. 제품 책임자가 결정할 사항

| 쟁점 | 권고 |
|---|---|
| 낙인·명예훼손 위험 | 사람·브랜드의 성향을 분류하지 않고 표현·용법·근거만 설명. 공개 공유 문구와 이의제기 절차를 법률 검토 |
| 정치적 중립 | 일베·메갈·워마드 등 출처와 무관하게 동일한 위해 기준 적용. 진영별 항목 수 맞추기나 단순 정치 비판 검출은 하지 않음 |
| 방언·지역에 대한 오탐 | 지역 정체성 추정 금지. 정상 방언의 경고 자체도 피해 지표로 관리 |
| 책임·갱신 | 콘텐츠 책임자 1명과 별도 승인자 지정. 논쟁 항목에 언어학 자문, 정정 시 사전 버전·캐시 갱신 |
| 등급 정책 | MVP는 hard 기본 D, 승인된 직접 폭력 조건만 F. contextual의 등급 반영은 후속 검증 후 결정 |
| 미검출 범위 | 사전에 없는 성역할 고정관념, 이미지·영상 자체는 초기 탐지 범위에 한계. 입력된 asset keywords만 검사 |

## 5. Claude용 우선순위 작업 목록

시간은 개발·검수 인시 추정이며, 외부 자문·라이선스 회신 대기시간은 제외한다.

| 우선순위 | 구현 브리프로 전환할 작업 | 시간 |
|---|---|---:|
| P0 | 위해 기준·tier·인용 예외·중립적 출력 문구 확정 | 6–10h |
| P0 | 근거·라이선스 확인, 50–100개 항목과 정상/공격 용례 이중 검수 | 24–40h |
| P0 | JSON schema, 테이블 확장, idempotent seed, 승인본 loader | 6–10h |
| P0 | 필드별 matcher, 조기 반환 통합, grade cap, 버전 포함 캐시 | 10–16h |
| P0 | prompt·중첩 JSON parser·Types·장애 처리 | 8–12h |
| P0 | 표현 리스크 UI, 대안·출처, 복사 결과·구캐시 대응 | 6–10h |
| P0 | 독립 평가 200건, 방언·성별·캐시 gate, 기존 100건 회귀 | 16–24h |
| P1 | 동의 기반 베타, 오탐 신고·수정 이력, 정기 검수 절차 | 12–20h |
| P1 | 기존 날짜 없는 instant-F 정책·월 경계 검색·상세 출처 보강 | 10–18h |
| P2 | 라이선스 확인된 classifier 비교, ONNX/Transformers 실험 | 20–32h |
| P2 | 초성·띄어쓰기 변형·embedding 후보 검색과 별도 오탐 평가 | 16–24h |

**P0 합계: 약 76–122인시.** 완료 기준은 항목 수보다 방언 오탐 방지, 근거 추적, 캐시 일관성, 양방향 성차별 평가의 통과다.
