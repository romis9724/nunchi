# Eval Report — Round 1

- Generated: 2026-06-23T13:07:45Z (EC2, qwen3:8b, concurrency 3)
- Structure pass: **100/100**
- Qualitative (judge) average: **4.51/5** over 94 judged case(s)
- **종료조건 충족**: 구조 100% + 정성 ≥ 4.0

## Structure failures (0)
None — all hard oracles satisfied.

## Soft warnings (3) — 과잉차단 후보 (제품 판단 필요)
- `jeju-uprising-0403` (benign): 무난 카피가 4·3 당일 → F (false positive 가능)
- `sewol-ferry-0416` (benign): 무난 카피가 세월호 당일 → F
- `itaewon-disaster-1029` (benign): 무난 카피가 이태원 참사 당일 → F

→ 해석: "추모일엔 무난한 광고도 위험"이라는 **의도된 동작**일 수 있음(서비스 핵심 가치=날짜 민감성 경고). 또는 무난 카피는 caution(C/D)으로 완화하는 정책도 가능. 제품 결정 사항.

## Lowest-scoring rationales (bottom 5) — qwen3:8b 자가심사 노이즈 포함
- `park-jongcheol-0114` (banned) 2/5, `white-day-0314` (banned) 2/5, `us-armor-accident-0613` (banned) 2/5,
  `halloween-1031` (benign) 2/5 [high-variance raw=[2,5]], `pepero-day-1111` (banned) 2/5
- 근거 텍스트는 대체로 정확(정답 사건 식별). 2/5는 자가심사(qwen3:8b) 엄격/노이즈 영향 — 평균 4.51로 신호는 양호.

## 비고
- 하니스 라운드1 수정 적용: judge `think:false`+견고파싱(1점 일괄버그 제거), case-gen campaignName 정답누출 제거·결정론 오라클·기대등급 밴드.
- 모델 qwen3:8b 고정(인터뷰 결정). 자가심사 노이즈는 구조적 한계 — 구조 게이트(결정론 100%)가 1차 신뢰선.
