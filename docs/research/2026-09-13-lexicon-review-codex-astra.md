> 생성: 2026-09-13, Codex CLI 0.154.0 / gpt-6-astra 2차 심사(read-only). 1차 심사 Claude. 최종 합의: 승인 54 · 보류 13 · 제외 1 — Claude(lead)가 Codex hold 7건을 조건부 승인(급식충·틀딱·틀딱충: 커뮤니티 은어 기원 / 어묵: 형사처벌 근거 / 설거지론·오조오억: 패턴 축소 / 재기해: contextual 전환). 결정 원문·사유는 data/lexicon/*.json reviewed_* 및 승인 보드 db.

| key | term | current tier | verdict (approve/hold/reject) | tier (final) | rename (or -) | one-line reason (Korean) |
|---|---|---|---|---|---|---|
| unji | 운지 | contextual | approve | contextual | - | 복수 보도 근거가 있고 악기 연주 등 정상 용법과 구분 가능 |
| minjuhwa-negative | 민주화 (부정 용법) | contextual | approve | contextual | - | 부정 용법 보도 충분; 정상적인 제도·사회 변화 용법은 구분 |
| saneophwa-ilbe | 산업화 (커뮤니티 용법) | contextual | hold | contextual | - | 추천 은어가 비하라는 근거 부족; 일반 산업화 문장과 중첩 |
| nomu-nomu | 노무노무 | hard | approve | hard | - | 복수 보도에 근거한 조롱 표기; meaning의 ‘성’은 ‘이름 일부’로 수정 |
| nomu-prefix-mockery | 노무- 접두 조롱형 | contextual | hold | contextual | - | 추론한 접두어 일반화가 노무사·노무관리까지 탐지 |
| no-ending-roh-context | -노 어미 (노무현 문맥 공존) | contextual | hold | contextual | 노 어미·노무현 문맥 | 정상 방언을 공격 예문으로 제시; 명사 오탐·문장 경계도 수정 필요 |
| igiya | 이기야 | contextual | approve | contextual | - | 복수 보도·공식 간행물 근거; 정상 방언을 먼저 설명 |
| geupsik-chung | 급식충 | hard | hold | hard | - | 비하 근거는 충분하나 학생·연령 항목은 ADR 범위 정리 필요 |
| teuldak | 틀딱 | contextual | hold | hard | - | 자조·인용만으로 contextual 예외 불가; 연령 범위는 별도 정리 |
| teuldak-chung | 틀딱충 | hard | hold | hard | - | hard는 타당하나 ADR에서 연령 항목을 후속으로 유보 |
| aebi-chung | 애비충 | hard | approve | hard | - | 공식 간행물·보도 근거; 맘충과 동일한 비인간화 기준 적용 |
| jwajom | 좌좀 | hard | approve | hard | - | 공식 간행물·직접 제목 근거; 정치적 비하에 동일 기준 적용 |
| jwappal | 좌빨 | hard | approve | hard | - | 공식 간행물·직접 제목 근거; 정상 정치 용어와 구별되는 비하형 |
| sukkol | 수꼴 | hard | approve | hard | - | 공식 근거 있는 정치적 비하; 좌좀·좌빨과 같은 범주·기준 유지 |
| noalla | 노알라 | hard | approve | hard | - | 주요 언론 제목이 고인 비하 캐릭터임을 직접 뒷받침 |
| dubu-roh-context | 두부 (노무현 문맥 공존) | contextual | hold | contextual | - | 소규모 매체 단일 근거; 정상 음식 홍보가 공격 예문으로 제시됨 |
| podo-518-context | 포도 (5·18 문맥 공존) | contextual | hold | contextual | - | 개별 용법 근거가 간접적이고 광주 농산물 홍보와 중첩 |
| pitteok-galbi | 피떡갈비 | hard | approve | hard | - | 직접 제목을 포함한 복수 보도; 일반 음식명과 구별되는 조롱형 |
| jungryeokjeol | 중력절 | hard | approve | hard | - | 관련 복수 보도와 특정 기일 조롱 의미가 일치 |
| eomuk-sewol-context | 어묵 (세월호 문맥 공존) | contextual | hold | contextual | - | 직접 보도 근거 충분; 문장 경계와 미탐 공격 예문 수정 필요 |
| no-o-rat-da | 노오랗다 (노무현 문맥 공존) | watch | hold | watch | - | 단일 간접 출처·일반 강조 표기; 상시 정보 표시 효용 낮음 |
| jaegi-hae | 재기해 | hard | hold | contextual | - | 명령형도 정상 재기 격려에 사용; 현재 패턴으로 자동 D 불가 |
| ssipchi-nam | 씹치남 | hard | approve | hard | - | 주요 언론 제목에 직접 등장; 성별 반대편과 동일 기준 적용 |
| sumswil-han | 숨쉴한 | hard | approve | hard | - | 직접 제목 근거 있는 폭력 정당화 표현; 삼일한과 동일 처리 |
| six-point-nine | 6.9 | contextual | hold | contextual | - | 문장 분리가 소수점을 끊어 현재 cooccur 탐지가 작동하지 않음 |
| sochu | 소추 | contextual | approve | contextual | - | 직접 보도 근거; 법률 용어와 동형이므로 문맥 판정 필수 |
| hannam-yuchung | 한남유충 | hard | hold | hard | - | 유일한 비위키 자료가 논문 변조 논란 보도라 독립 용례 근거 부족 |
| hyungja | 흉자 | hard | approve | hard | - | 관련 주요 언론 탐사 보도가 개연성 있는 근거; 견해 기반 비하 |
| ung-aeng-ung | 웅앵웅 | watch | approve | watch | - | 복수 논란 보도와 콘텐츠 관련성 있음; 일반 용법·반론 병기 |
| ojo-oeok | 오조오억 | watch | hold | watch | - | 논란 근거는 있으나 숫자 regex가 실제 매출액·더 큰 수까지 탐지 |
| heobeo-heobeo | 허버허버 | watch | approve | watch | - | 복수 보도·이모티콘 관련성 있음; 혐오 의미 확정 없이 표시 |
| kimchi-nyeo | 김치녀 | hard | approve | hard | - | 공식 간행물·복수 보도에 근거한 여성 비하 표현 |
| doenjang-nyeo | 된장녀 | hard | approve | hard | - | 공식 간행물·복수 보도 근거; 소비 성향을 이용한 여성 비하 |
| mom-chung | 맘충 | contextual | approve | hard | - | 정상 동형어가 없고 인용·자조만 예외; 애비충과 동일 처리 |
| samil-han | 삼일한 | hard | approve | hard | - | 공식 간행물·직접 보도 근거 있는 폭력 정당화 표현 |
| boseul-achi | 보슬아치 | hard | approve | hard | - | 공식 간행물·복수 보도 근거 있는 성기 비속어 결합 비하형 |
| bojeok-bo | 보적보 | hard | approve | hard | - | 여성혐오 실태를 다룬 주요 언론 보도가 개연성 있는 직접 분야 근거 |
| bojeon-kkae | 보전깨 | hard | hold | hard | - | 단일 전문매체의 포괄적 기사만으로 개별 표현 근거가 얇음 |
| sangpye-nyeo | 상폐녀 | hard | hold | hard | - | 단일 포괄 기사에 의존; 변형까지 포함한 개별 용례 근거 보강 필요 |
| kim-yeosa | 김여사 | contextual | approve | contextual | - | 공식 간행물·직접 보도 근거; 실제 인물 호칭과 구분 |
| yeojeok-yeo | 여적여 | contextual | approve | contextual | - | 직접 비판 보도 충분; 성별 일반화와 한정된 서사·반박 구분 |
| megal | 메갈 | contextual | approve | contextual | - | 공식 간행물·보도 근거; 사이트 약칭과 공격적 호칭 구분 |
| me-twaeji | 메퇘지 | hard | approve | hard | - | 주요 언론 제목에 직접 등장하는 여성 비하 변형어 |
| saengni-chung | 생리충 | hard | approve | hard | - | 혐오 표현을 다룬 주요 언론 근거; 생리라는 정상어 자체는 미탐지 |
| hannyeo-chung | 한녀충 | hard | approve | hard | - | 공식 간행물·보도 근거; 한남충과 동일한 비인간화 기준 |
| gae-jumma | 개줌마 | hard | approve | hard | - | 공식 간행물 근거; 개저씨와 동일한 성별·연령 비하 기준 |
| kkotbaem | 꽃뱀 | contextual | hold | contextual | - | 단일 기사의 제목이 다른 표현 중심이며 동물명 오탐 부담 큼 |
| boiru | 보이루 | watch | reject | watch | - | 제공 근거가 혐오 기원 주장을 반박; 상시 위험 표시는 낙인 재생산 우려 |
| hannam | 한남 | contextual | approve | contextual | - | 공식 간행물·복수 보도 근거; 지명·기관명 등 정상 용법 구분 |
| hannam-chung | 한남충 | hard | approve | hard | - | 공식 간행물·직접 보도 충분; 변형 전체에 맞게 법적 단정 문구 정리 |
| gae-jeossi | 개저씨 | hard | approve | hard | - | 공식 간행물·복수 보도 근거; 개줌마와 동일 기준 |
| kimchi-nam | 김치남 | hard | approve | hard | - | 직접 제목의 보도 근거; 기존 기관 분류와 별개로 동일 위해 기준 적용 |
| naemjeo | 냄저 | hard | approve | hard | - | 공식 간행물 근거 있는 남성 비하 변형 표기 |
| seolgeoji-ron | 설거지 (설거지론 문맥) | contextual | hold | contextual | - | 세제 상표·경험·결혼만으로 정상 가사 광고가 후보가 됨 |
| pongpong-nam | 퐁퐁남 | hard | approve | hard | - | 직접 제목의 복수 보도; 배우자 관계를 이용한 비하 표현 |
| dotae-nam | 도태남 | hard | approve | hard | - | 주요 언론 제목이 직접 용례 제시; 연애·결혼 성취 기반 비하 |
| hongeo | 홍어 | contextual | approve | contextual | - | 공식 간행물·복수 보도 충분; 음식 용법은 문맥으로 제외 |
| kkabojeon | 까보전 | hard | approve | hard | - | 공식 간행물 근거 있는 지역 출신 비하 약어 |
| jeolladian | 전라디언 | hard | approve | hard | - | 공식 간행물·복수 보도 근거; 지역 비하 변형어 |
| gaessangdo | 개쌍도 | hard | approve | hard | - | 공식 간행물·직접 제목의 복수 보도; 지역 간 동일 기준 |
| meongcheongdo | 멍청도 | hard | approve | hard | - | 공식 간행물·직접 제목 근거; 예문 어미 미탐은 별도 정리 |
| gamja-guk | 감자국 | contextual | approve | contextual | - | 관련 복수 보도가 개연성 있는 근거; 음식·친근한 별칭 구분 |
| gamja-bau | 감자바우 | contextual | approve | contextual | - | 주요 언론 제목에 직접 등장; 상호·자칭·캐릭터명 구분 |
| gwamegi | 과메기 | contextual | approve | contextual | - | 직접 제목 포함 복수 보도; 홍어와 같은 음식·지역 비하 구분 |
| seven-oclock-jeolla | 7시 (전라 문맥 공존) | contextual | hold | contextual | - | ‘늦더라도’의 라도와 ‘일곱 시간’도 매칭; 광범위한 시간 광고 오탐 |
| seunsangnim | 슨상님 | contextual | approve | contextual | - | 관련 복수 보도 근거; 방언 자체를 비하로 취급하지 않도록 문구 수정 |
| gotham-daegu | 고담대구 | contextual | approve | contextual | - | 공식 간행물·복수 보도 근거; 지역 별칭·비판적 재사용 구분 |
| tongguyi-daegu-context | 통구이 (대구 지하철 문맥 공존) | contextual | hold | contextual | - | 직접 보도 충분하나 일반 지하철 맛집 광고와 중첩; 문장 경계 수정 필요 |

```json
{
  "verdicts": [
    {"key":"unji","decision":"approve","tier":"contextual","rename":null,"note_fix":null,"reason":"복수 보도가 조롱 용법을 뒷받침한다. 운지법은 literal에서 제외되지만 악기를 운지하는 정상 동사형도 있으므로 contextual을 유지하고 실제 매칭되는 정상 예문을 보강한다."},
    {"key":"minjuhwa-negative","decision":"approve","tier":"contextual","rename":null,"note_fix":"'민주화시키다·당하다'가 짓밟기나 비추천을 뜻하는 은어로 쓰인 사례가 있습니다. 제도·사회를 민주적으로 바꾼다는 정상 용법과 조롱 용법을 구분해 확인하세요.","reason":"복수 보도와 직접적인 기사 제목이 있다. 역사뿐 아니라 제도·조직의 민주화도 정상 용법이므로 안내 범위를 넓힌다."},
    {"key":"saneophwa-ilbe","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"SBS 인터뷰와 위키만으로 추천 은어를 비하·제압 의미까지 확장하기 어렵다. 공격 예문도 단순 추천 요청이며 정상 산업화 문장과 겹친다. 비하 용례를 직접 뒷받침하는 근거가 필요하다."},
    {"key":"nomu-nomu","decision":"approve","tier":"hard","rename":null,"note_fix":"고인을 조롱하는 용법으로 알려진 변형 표기입니다. 의도한 표기를 확인하고 브랜드 문구 사용을 재검토하세요.","reason":"복수 보도에 근거한 특정 조롱 표기이며 일반 노동 용어를 포괄하지 않는다. meaning의 노무현의 성이라는 설명은 이름 일부로 고친다. 자동 D 처리와 모순되는 오타 예외 안내도 정리한다."},
    {"key":"nomu-prefix-mockery","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"노무노무·노알라 보도에서 임의의 노무 접두형 전체를 추론했다. 노무관리·노무사 상담이 실제 매칭된다. 접두어 일반화를 폐기하고 개별 출처가 있는 표기만 경계 있는 literal로 등록한다."},
    {"key":"no-ending-roh-context","decision":"hold","tier":"contextual","rename":"노 어미·노무현 문맥","note_fix":"'-노'는 정상적인 방언 어미입니다. 관련 명사와 함께 쓰였다는 사실만으로 조롱을 판단할 수 없으며, 실제 문장의 용법을 확인해야 합니다.","reason":"봉하마을 갔다 왔노는 공격의 증거가 없는 정상 방언 문장이다. 기타 운지 강좌 듣고 아메리카노 한 잔도 매칭된다. 공격 예문 교체, 어미·공기어 범위 축소, 줄바꿈 보존 후 재심한다. 표시명은 공백·기호 포함 11자다."},
    {"key":"igiya","decision":"approve","tier":"contextual","rename":null,"note_fix":"'이기야'는 방언으로 쓰일 수 있으며, 고인을 조롱하는 문장에 사용된 사례도 있습니다. 표현만으로 판단하지 말고 문장의 용법을 확인하세요.","reason":"공식 간행물과 복수 보도가 개연성 있는 근거다. 정상 방언을 우선 설명하고 방언 이외의 사용을 자동으로 조롱으로 연결하지 않는다."},
    {"key":"geupsik-chung","decision":"hold","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물·보도와 벌레 비유상 hard는 타당하다. 다만 학생·연령 중심 항목을 community에 넣는 것은 ADR의 연령 범주 후속 유보와 충돌하므로 급식충·학식충의 범위를 먼저 정리한다."},
    {"key":"teuldak","decision":"hold","tier":"hard","rename":null,"note_fix":"노년층을 낮잡아 부르는 표현입니다. 브랜드 문구 사용을 재검토하세요.","reason":"인권위·학술 근거가 강하며 정상 동형어가 없다. 인용·비판·자조만을 이유로 contextual을 적용하면 다른 hard 항목과 비대칭이다. 의미상 hard를 권고하되 연령 범주가 ADR에서 유보되어 현재 승인은 보류한다."},
    {"key":"teuldak-chung","decision":"hold","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 보도가 있고 비인간화 의미도 명확하다. hard를 유지하되 틀딱과 함께 ADR의 연령 범주 유보를 해소한 뒤 승인한다."},
    {"key":"aebi-chung","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물·보도가 개연성 있는 근거이며 아버지를 벌레에 비유한다. 맘충과 같은 hard 기준을 적용한다. 주된 위해 대상 원칙에 맞춰 gender로 범주를 정리하는 것이 적절하다."},
    {"key":"jwajom","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 해당 표현을 직접 다룬 제목이 있다. 비하 용법을 설명하는 note는 사용자 정치성향을 분류하지 않으며 수꼴과 동일 기준을 적용한다."},
    {"key":"jwappal","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 직접 제목의 보도가 근거다. 좌파라는 정상 정치 용어 자체는 매칭하지 않고 비하형을 특정하므로 hard가 타당하다."},
    {"key":"sukkol","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물 근거와 독립적인 비하성이 있으므로 유지한다. 단순한 진영별 숫자 맞추기가 승인 이유는 아니다. 좌좀·좌빨과 함께 community의 정치적 비하 하위 범위를 명시하고 meaning의 대칭 항목이라는 편집 설명은 제거한다."},
    {"key":"noalla","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"서울경제 기사 제목이 고인 비하 캐릭터임을 직접 설명한다. 특정 합성 캐릭터 명칭에 한정된 literal이라 일반 코알라 상품을 포괄하지 않는다."},
    {"key":"dubu-roh-context","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"시빅뉴스 단일 포괄 기사에 의존하고 봉하마을 두부 요리 특집은 정상 음식 콘텐츠일 수 있다. 독립적인 직접 용례 근거와 명확한 공격 예문이 필요하며 공통 문장 경계 결함도 수정해야 한다."},
    {"key":"podo-518-context","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"머니투데이 포괄 기사와 위키만으로 개별 조롱 용법의 근거가 얇다. 광주만으로 정상 농산물 광고가 후보가 된다. 직접 근거와 더 구체적인 역사 문맥, 문장 경계 보존을 확보한 뒤 재심한다."},
    {"key":"pitteok-galbi","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"이데일리 제목이 해당 표현과 지역 비하를 직접 연결하고 추가 보도도 있다. 정상 음식명 떡갈비와 구별되는 특정 조롱 표기다."},
    {"key":"jungryeokjeol","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"관련 주제의 서로 다른 언론 보도가 두 건 있고 특정 고인의 기일을 조롱하는 의미와 맞는다. 중력이라는 일반 과학 용어 자체는 매칭하지 않는다."},
    {"key":"eomuk-sewol-context","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"경향신문 제목은 희생자 조롱 용법의 강한 직접 근거다. 다만 현재 공격 예문은 날짜 표기와 어미 때문에 미탐지되고 줄바꿈이 합쳐져 문장 공기가 왜곡된다. 실제 매칭되는 공격·정상 대조 예문과 문장 경계 수정을 선행한다."},
    {"key":"no-o-rat-da","decision":"hold","tier":"watch","rename":null,"note_fix":null,"reason":"자료 자체가 단일 매체 근거와 일반 강조 표기의 중첩을 인정한다. 봉하의 풍경 묘사도 정상 용법이며 상시 참고 표시의 마케팅 효용이 낮아 draft를 유지한다."},
    {"key":"jaegi-hae","decision":"hold","tier":"contextual","rename":null,"note_fix":"'재기하다'는 다시 일어선다는 정상 표현입니다. 특정인을 향해 자살을 부추기는 뜻으로 쓰인 사례도 있으므로, 격려·회복 문맥과 공격적 용법을 구분해 확인하세요.","reason":"명령형 제한은 불충분하다. 사업 실패를 딛고 재기하세요와 다시 재기해도 실제 매칭된다. 두 번째 regex에는 종결 경계도 없다. contextual로 변경하고 정상 명령형을 benign_usages에 추가하며 양쪽 패턴 경계를 정리해야 한다."},
    {"key":"ssipchi-nam","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"서울신문 제목이 표현을 직접 다룬다. 비속어 결합 남성 비하에 여성 비하와 동일한 hard 기준을 적용하며 기원 설명은 위해 판정의 면책 사유가 아니다."},
    {"key":"sumswil-han","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"서울신문 제목이 직접 용어를 제시하며 폭력 정당화 의미가 명확하다. 삼일한과 동일한 hard 기준을 적용한다."},
    {"key":"six-point-nine","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"관련 뉴시스 보도는 개연성 있는 근거지만 현재 문장 분리가 6.9의 점을 경계로 처리해 자체 공격 예문조차 매칭하지 못한다. 소수점 보존과 줄바꿈 보존을 수정하고 실제 수치·남성 상품 문맥의 정상 대조군을 검증해야 한다."},
    {"key":"sochu","decision":"approve","tier":"contextual","rename":null,"note_fix":"'소추'는 법률 용어로 쓰이며, 남성의 신체를 조롱하는 용법도 있습니다. 실제 문맥을 확인하세요.","reason":"뉴시스 제목이 개별 표현을 직접 다룬다. 법률 문맥의 독립된 소추도 매칭되므로 contextual이 필수다. 탄핵 소추를 일괄 공소 제기로 대체하도록 하는 alternative는 삭제한다."},
    {"key":"hannam-yuchung","decision":"hold","tier":"hard","rename":null,"note_fix":null,"reason":"비인간화 의미상 hard 후보지만 유일한 비위키 출처는 다른 표현을 둘러싼 논문 변조 보도다. 문제가 제기된 논문에 등장했다는 사실과 독립적인 공격 용법 입증을 분리해 별도 보도·공식 근거를 확보한다."},
    {"key":"hyungja","decision":"approve","tier":"hard","rename":null,"note_fix":"여성의 견해나 태도를 이유로 비하하는 호칭으로 쓰입니다. 브랜드 문구 사용을 재검토하세요.","reason":"온라인 성별 비하를 다룬 중앙일보 탐사 기사는 개연성 있는 근거다. 특정 진영에 대한 동조 여부를 서비스가 판단하는 듯한 설명을 줄이고 표현의 공격 용법을 기술한다."},
    {"key":"ung-aeng-ung","decision":"approve","tier":"watch","rename":null,"note_fix":"불분명한 말소리를 흉내 내는 표현입니다. 2021년 남성 비하라는 주장과 성별과 무관한 표현이라는 반론이 보도됐습니다. 표현 자체를 혐오로 판정하는 표시는 아닙니다.","reason":"복수 주요 보도가 논란 자체를 뒷받침하고 대사·자막 등 콘텐츠와 관련성이 있다. watch로만 승인하며 일반 용법과 반론을 같은 안내에 포함한다."},
    {"key":"ojo-oeok","decision":"hold","tier":"watch","rename":null,"note_fix":"'매우 많다'는 뜻의 과장 표현입니다. 2021년 남성 비하 기원이라는 주장과 반론이 보도됐습니다. 표현 자체를 혐오로 판정하는 표시는 아닙니다.","reason":"논란에 관한 복수 직접 보도가 있어 watch 후보는 타당하다. 그러나 5조 숫자 regex는 매출 15조5억원 달성까지 매칭하며 정확한 5조5억도 정상 금액이다. 숫자 패턴을 제거하고 한글 표현 중심으로 좁힌 뒤 재심한다."},
    {"key":"heobeo-heobeo","decision":"approve","tier":"watch","rename":null,"note_fix":"급하게 먹거나 행동하는 모습을 나타내는 표현입니다. 2021년 남성 비하라는 주장과 성별과 무관한 표현이라는 반론이 보도됐습니다. 표현 자체를 혐오로 판정하는 표시는 아닙니다.","reason":"복수 보도와 이모티콘 판매 관련 기록은 제품·콘텐츠 마케팅에서 논란 이력을 알릴 개연성 있는 근거다. 일반 의태어 용법을 먼저 설명하며 hard나 contextual로 올리지 않는다."},
    {"key":"kimchi-nyeo","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 여러 매체의 성별 비하 보도가 있다. literal은 김치라는 음식명 자체를 매칭하지 않으며 정상 동형어가 없는 여성 비하형이다."},
    {"key":"doenjang-nyeo","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물·복수 보도가 개연성 있는 근거다. 소비 성향을 여성 비하로 연결하는 특정 표현으로 된장이라는 정상 음식명은 제외된다."},
    {"key":"mom-chung","decision":"approve","tier":"hard","rename":null,"note_fix":"어머니를 벌레에 비유하는 비하 표현입니다. 브랜드 문구 사용을 재검토하세요.","reason":"공식 간행물과 복수 보도에 근거하며 정상 동형어가 없다. 인용·비판·자조는 README가 hard에서도 D 처리한다고 명시한 문맥이므로 애비충·한남충과 동일하게 hard로 조정한다. 특정 커뮤니티 기원은 단정하지 않는다."},
    {"key":"samil-han","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 해당 표현을 직접 명시한 보도가 있다. 여성에 대한 폭력 정당화 표현으로 숨쉴한과 같은 hard 기준을 적용한다."},
    {"key":"boseul-achi","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 복수의 관련 언론 보도가 뒷받침한다. 성기 비속어를 포함한 여성 비하형으로 일반 벼슬아치라는 단어는 매칭하지 않는다."},
    {"key":"bojeok-bo","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"여성혐오 실태를 직접 다루는 서울신문 보도는 단일 출처라도 개연성 있는 주요 언론 근거다. 성기 비속어로 여성을 일반화하는 특정 약어다."},
    {"key":"bojeon-kkae","decision":"hold","tier":"hard","rename":null,"note_fix":null,"reason":"의미 설명상 hard 후보지만 단일 전문매체의 포괄적인 여성혐오 기사만 제시되어 개별 표현의 근거가 얇다. 직접 용어를 다룬 추가 보도나 공식·학술 근거를 확보한 뒤 승인한다."},
    {"key":"sangpye-nyeo","decision":"hold","tier":"hard","rename":null,"note_fix":null,"reason":"여성신문 단일 포괄 기사와 위키에 의존하며 상장폐지녀 변형까지의 개별 근거가 불명확하다. 직접 근거를 보강하고 현재 미탐지되는 상폐녀지 예문도 매처 범위에 맞게 고친다."},
    {"key":"kim-yeosa","decision":"approve","tier":"contextual","rename":null,"note_fix":null,"reason":"공식 간행물과 표현을 직접 포함한 보도 제목이 있다. 실제 인물 호칭·상호가 regex에 잡힐 수 있지만 정상 용법과 예문이 있어 contextual이 적절하다."},
    {"key":"yeojeok-yeo","decision":"approve","tier":"contextual","rename":null,"note_fix":"여성 간 갈등을 성별 전체의 특성으로 일반화할 때 고정관념을 강화할 수 있습니다. 특정 인물 관계를 묘사하거나 이 표현을 비판하는 문맥과 구분해 확인하세요.","reason":"직접적인 프레임 비판 보도가 있다. 일반 문장형은 작품 속 한정된 인물 관계도 표현할 수 있으므로 해당 정상 용법을 benign_usages에 추가한다. 여돕여로의 일괄 대체 대신 의도에 맞는 구체적 서술을 권한다."},
    {"key":"megal","decision":"approve","tier":"contextual","rename":null,"note_fix":"사이트 약칭으로 쓰일 수 있으며, 여성을 공격하는 호칭으로 사용된 사례도 있습니다. 지칭 대상과 문맥을 확인하세요.","reason":"공식 간행물·관련 보도가 있다. 메갈리아 전체 단어와 메갈이지는 현재 literal에 매칭되지 않으므로 정상·공격 예문을 실제 매칭되는 약칭 용례로 정리한다. 정상 지칭을 일괄 피하라는 alternative도 수정한다."},
    {"key":"me-twaeji","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"서울신문 제목이 개별 표현을 직접 다룬다. 일반 동물명 멧돼지와 표기가 다르며 여성을 동물에 빗대는 특정 비하형이다."},
    {"key":"saengni-chung","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"성별 혐오 표현을 다룬 세계일보 보도는 개연성 있는 근거다. 생리라는 정상 보건 용어는 탐지하지 않고 벌레 비유 결합형만 대상으로 한다."},
    {"key":"hannyeo-chung","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 성별 혐오 보도가 있고 여성·여아를 벌레에 비유하는 의미가 명확하다. 한남충과 같은 위해 기준을 적용한다."},
    {"key":"gae-jumma","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물 근거가 있고 정상 호칭 아줌마와 구별되는 비하 결합형이다. 개저씨와 대칭으로 처리한다."},
    {"key":"kkotbaem","decision":"hold","tier":"contextual","rename":null,"note_fix":"'꽃뱀'은 동물명으로 쓰입니다. 사람을 지칭하며 성별 고정관념이나 피해자에 대한 근거 없는 의심을 전달하는 용법인지 문맥을 확인하세요.","reason":"단일 전문매체 출처의 제목이 한남충·맘충·김치녀 중심이라 이 표현의 개별 근거가 간접적이다. 동물명 외 인용·교육 문맥도 존재한다. 직접 근거와 정상 용례를 보강한 뒤 contextual로 재심한다."},
    {"key":"boiru","decision":"reject","tier":"watch","rename":null,"note_fix":null,"reason":"제공된 의미 설명과 파이낸셜뉴스 제목은 여성혐오 기원 주장의 왜곡·반박과 논문 문제를 제시한다. 이를 현재도 동등하게 다투어지는 혐오 의미의 근거로 쓰기 어렵다. gender 위험 사전의 자동 watch 등록은 배제하고 필요하면 별도 논란 이력 자료에서 반박 경과를 정확히 다룬다."},
    {"key":"hannam","decision":"approve","tier":"contextual","rename":null,"note_fix":"'한남'은 지명·기관명 등으로 쓰이며, 한국 남성을 비하하는 호칭으로 사용된 사례도 있습니다. 실제 지칭 대상과 문맥을 확인하세요.","reason":"공식 간행물과 복수 보도가 개연성 있는 근거다. 한남동·한남대 같은 복합어는 literal에서 제외되지만 한남 신규 매장은 매칭되므로 정상 고유명사 용법을 충분히 안내한다."},
    {"key":"hannam-chung","decision":"approve","tier":"hard","rename":null,"note_fix":"남성을 비하하거나 모욕하는 표현입니다. 브랜드 문구 사용을 재검토하세요.","reason":"공식 간행물과 직접적인 보도 근거가 충분하다. 한남놈·한남새끼까지 묶인 항목에 벌레 비유와 특정 사건의 법적 판단을 일괄 적용하지 않도록 note를 일반화한다."},
    {"key":"gae-jeossi","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 직접 제목을 포함한 복수 보도가 있다. 중년 남성을 비하하는 특정 결합형으로 개줌마와 동일하게 처리한다."},
    {"key":"kimchi-nam","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"SBS 제목이 해당 표현의 혐오 분류 논란을 직접 다룬다. 특정 기관의 과거 분류나 발생 진영과 별개로 성별을 이용한 비하에 김치녀와 같은 위해 기준을 적용한다."},
    {"key":"naemjeo","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물 근거가 있으며 남자라는 정상 지칭어와 다른 비하 변형 표기만 literal로 탐지한다."},
    {"key":"seolgeoji-ron","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"복수 직접 보도는 충분하다. 그러나 퐁퐁으로 설거지 시간을 줄여요도 실제 매칭되며 경험·결혼은 일반 광고에 흔하다. 우선 경계 있는 설거지론 명시형으로 축소하고 일반 설거지의 공기는 별도 근거·대조군과 문장 경계 수정 후 재심한다."},
    {"key":"pongpong-nam","decision":"approve","tier":"hard","rename":null,"note_fix":"배우자 관계를 근거로 기혼 남성을 낮잡아 부르거나 그 배우자를 함께 비하하는 용법의 표현입니다. 브랜드 문구 사용을 재검토하세요.","reason":"복수 기사 제목이 퐁퐁남과 설거지론을 직접 다룬다. 단순히 가사를 맡는 남성이라는 meaning은 지나치게 넓으므로 배우자 관계를 비하하는 담론상의 의미로 정리한다. 세제 상표 퐁퐁 자체는 매칭하지 않는다."},
    {"key":"dotae-nam","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"파이낸셜뉴스 제목에 공격적 용례가 직접 나타난다. 도태라는 일반 단어 자체가 아니라 연애·결혼 성취로 남성을 비하하는 결합형이다."},
    {"key":"hongeo","decision":"approve","tier":"contextual","rename":null,"note_fix":null,"reason":"공식 간행물과 직접 제목을 포함한 복수 보도가 있다. 홍어회는 literal에서 제외되지만 독립 음식명 홍어는 매칭되므로 문맥 판정을 유지한다. regex 변형도 contextual에 머문다."},
    {"key":"kkabojeon","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물이 개연성 있는 근거다. 부정적 사건을 특정 지역 출신 탓으로 돌리는 전용 약어로 정상 용법의 중첩이 거의 없다."},
    {"key":"jeolladian","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 지역 비하를 직접 다루는 복수 보도가 있다. 일반 지명 전라도와 구별되는 비하 변형어를 한정해 탐지한다."},
    {"key":"gaessangdo","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물과 개별 표현을 제목에 포함한 복수 보도가 있다. 전라 지역 비하와 동일 기준으로 경상 지역 비하도 hard 처리한다."},
    {"key":"meongcheongdo","decision":"approve","tier":"hard","rename":null,"note_fix":null,"reason":"공식 간행물·직접 제목 근거가 충분하다. 멍청도라서는 현재 조사 목록 밖이므로 공격 예문을 멍청도는 느리다처럼 매칭되는 형태로 정리하며 일반 충청도나 방언은 포함하지 않는다."},
    {"key":"gamja-guk","decision":"approve","tier":"contextual","rename":null,"note_fix":"'감자국'은 음식명으로 쓰이며 지역의 친근한 별칭으로도 사용될 수 있습니다. 지역민을 낮잡는 문맥인지 확인하세요.","reason":"관련 지역 비하 보도가 두 건 있어 개연성 있는 근거다. 음식이 아니면 비하라는 이분법을 피하고 친근한 지역 별칭·자칭을 정상 용법에 추가한다."},
    {"key":"gamja-bau","decision":"approve","tier":"contextual","rename":null,"note_fix":"'감자바우'는 지역의 자칭·상호·캐릭터명으로도 쓰입니다. 지역민을 낮잡는 문맥인지 확인하세요.","reason":"국민일보 제목이 개별 표현을 직접 명시한다. 정상 브랜드·캐릭터 용법이 있으므로 contextual을 유지하고 타인이 지칭한다는 사실만으로 비하 가능성을 강조하지 않는다."},
    {"key":"gwamegi","decision":"approve","tier":"contextual","rename":null,"note_fix":null,"reason":"개별 표현이 등장하는 제목과 추가 지역 비하 보도가 있다. 홍어와 동일하게 음식명은 정상 용법으로 구분하고 사람을 낮잡는 사용만 문맥 판정한다."},
    {"key":"seven-oclock-jeolla","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"공기어 라도가 늦더라도에서 매칭되고 일곱 시 분기는 일곱 시간도 잡는다. 늦더라도 7시 오세요가 실제 후보가 되며 자체 공격 예문은 공기어 부재로 미탐지된다. 라도 제거, 양 분기 경계 보강, 문장 경계 보존과 직접 용례 확인이 필요하다."},
    {"key":"seunsangnim","decision":"approve","tier":"contextual","rename":null,"note_fix":"'슨상님'은 방언 발음을 나타내는 표기로 쓰일 수 있습니다. 특정 고인이나 지역민을 조롱하는 문맥인지 구분해 확인하세요.","reason":"관련 복수 보도가 개연성 있는 근거다. 방언 표기 자체를 혐오로 간주하지 않도록 안내하고 정상 방언의 일괄 표준어 대체를 권하는 alternative는 정리한다."},
    {"key":"gotham-daegu","decision":"approve","tier":"contextual","rename":null,"note_fix":null,"reason":"공식 간행물과 복수 지역 비하 보도가 근거다. 지역 별칭의 재사용과 그 별칭을 비판하는 콘텐츠가 가능하므로 contextual을 유지하며 일반 지역명 대구만으로는 탐지하지 않는다."},
    {"key":"tongguyi-daegu-context","decision":"hold","tier":"contextual","rename":null,"note_fix":null,"reason":"이데일리 제목은 직접적이고 충분한 용례 근거다. 다만 지하철 출구 앞 통구이 맛집도 실제 매칭되며 경상·영남만으로도 후보가 된다. 일반 교통·광역 지칭만의 공기를 축소하고 정상 맛집 대조군 및 줄바꿈 보존을 반영한 뒤 재심한다."}
  ]
}
```

**제2검토자 판정은 approve 47건, hold 20건, reject 1건입니다.** `approve`는 제시한 최종 티어·문구 정리를 반영하는 승인 의견입니다. `hold`의 최종 티어는 재심 시 권고값이며, `reject`의 watch는 기존 분류를 기록한 값입니다. Claude의 동의나 파일의 승인 상태 변경을 의미하지 않습니다.

출처는 요청대로 **열지 않고 label·URL·type의 개연성만 평가**했습니다. 주요 언론·공식 간행물의 단일 출처를 일괄 탈락시키지는 않았으며, 소규모·전문매체의 포괄 기사 하나에만 의존하는 경우는 보수적으로 판단했습니다.

핵심 공동 결정 사항은 다음과 같습니다.

- **맘충·틀딱:** 현재 README는 hard의 인용·비판도 D로 처리합니다. 이 정책 아래서는 자조·인용만으로 두 표현에 예외를 둘 수 없습니다. 맘충은 hard 승인, 틀딱은 의미상 hard이나 ADR의 연령 범위 유보 때문에 hold입니다.
- **수꼴:** 독립적인 공식 근거와 비하성 때문에 유지합니다. 범주 정의를 좁힌다면 좌좀·좌빨까지 함께 검토해야 하며, 진영별 항목 수를 맞추는 것은 승인 근거가 아닙니다.
- **재기해:** 명령형 제한만으로는 부족합니다. 정상 격려까지 자동 D로 만드는 현 패턴은 승인할 수 없습니다.
- **보이루:** 제공 자료의 반박·철회 경과를 단순한 “현재도 의미가 다투어짐”으로 축약하면 혐오 연관성을 재생산할 수 있습니다. 이는 법적 명예훼손 판단이 아니라 **제품의 근거·표시 적합성 판단**입니다.
- **2021년 세 표현:** 논란 이력과 실제 혐오성을 구분해야 합니다. 웅앵웅·허버허버는 일반 용법과 반론을 병기한 watch로 승인합니다. 오조오억은 동일한 후보지만 숫자 패턴부터 제거해야 합니다.

매처 로직을 재현한 읽기 전용 점검에서 정상 격려·노무 상담·시간 안내·세제 광고 오탐과 `6.9` 미탐을 확인했습니다. 특히 **줄바꿈을 공백으로 바꾼 뒤 문장을 나누는 공통 결함 때문에 cooccur 9건 모두 현재는 hold**입니다. qwen3:8b 프롬프트의 중립 지침은 적절하지만, 잘못된 공격 예문이나 매칭 범위를 해결하지는 못합니다. 모델 실행 검증과 파일 수정은 하지 않았습니다.
