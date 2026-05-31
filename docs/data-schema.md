# Noonchi 데이터 스키마

> 단일 출처 (Source of Truth). `data/events/*.json`과 Supabase 테이블은 이 문서를 기준으로 정렬한다.

## 1. `events` 테이블

한국 역사·사회·정치 민감일 사건 데이터베이스.

### SQL 스키마

```sql
create extension if not exists vector;

create table events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- e.g. "gwangju-uprising-0518"
  date_type   text not null check (date_type in ('fixed', 'recurring', 'range')),
  month       smallint not null,             -- 1–12
  day         smallint,                      -- 1–31, null for 'range' type
  day_end     smallint,                      -- range 종료일, nullable
  country     text not null default 'KR',
  name        text not null,                 -- "5·18 광주민주화운동"
  name_en     text,
  category    text not null check (category in (
    'massacre', 'disaster', 'political', 'social', 'memorial', 'independence', 'labor', 'human_rights'
  )),
  risk_level  text not null check (risk_level in ('critical', 'high', 'medium', 'low')),
  summary     text not null,
  related_keywords    text[] not null default '{}',  -- 피해야 할 단어
  related_motifs      text[] not null default '{}',  -- 피해야 할 시각 모티프
  recommended_tone    text not null check (recommended_tone in (
    'avoid', 'memorial', 'neutral', 'celebration'
  )),
  references          jsonb not null default '[]',   -- [{label, url, type}]
  embedding           vector(1536),                  -- text-embedding-3-small
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on events using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on events (month, day);
create index on events (risk_level);
```

### JSON 파일 스키마 (`data/events/*.json`)

```json
{
  "slug": "gwangju-uprising-0518",
  "date_type": "recurring",
  "month": 5,
  "day": 18,
  "country": "KR",
  "name": "5·18 광주민주화운동",
  "name_en": "Gwangju Uprising",
  "category": "massacre",
  "risk_level": "critical",
  "summary": "1980년 5월 18일부터 27일, 전두환 신군부의 계엄령에 맞서 광주 시민들이 항쟁. 계엄군 탱크 진압으로 공식 사망자 166명(민간인 154명). 5월 18일은 국가기념일.",
  "related_keywords": ["탱크", "계엄", "발포", "군부", "신군부", "전두환", "5·18", "518", "민주화"],
  "related_motifs": ["탱크", "군복", "총구", "철조망", "계엄 포고문"],
  "recommended_tone": "memorial",
  "references": [
    {
      "label": "5·18민주화운동기록관 (국가기념일 공식)",
      "url": "https://www.518.org",
      "type": "official"
    },
    {
      "label": "5·18민주화운동 진상규명조사위원회",
      "url": "https://www.jinsang.go.kr",
      "type": "official"
    }
  ]
}
```

### `references` 배열 항목 타입

| type | 설명 |
|---|---|
| `official` | 정부 공식·법령·국가기관 |
| `academic` | 학술 논문·연구소 |
| `media` | 메이저 언론사 (조선일보, 한겨레, 연합뉴스 등) |
| `wiki` | 위키피디아 (단독 출처 불가, 보조) |

---

## 2. `keywords_blacklist` 테이블

민감일과 연결된 위험 단어 사전. 룰 기반 1차 필터로 사용.

```sql
create table keywords_blacklist (
  id              uuid primary key default gen_random_uuid(),
  term            text not null,
  term_normalized text not null,          -- 공백 제거·소문자 정규화 버전
  related_event_id uuid references events(id),
  severity        text not null check (severity in ('critical', 'high', 'medium')),
  context_note    text,                   -- 왜 위험한지 한 줄 설명
  created_at      timestamptz not null default now()
);

create index on keywords_blacklist (term_normalized);
```

---

## 3. `reviews` 테이블

검토 요청 결과 캐시. hash key로 LLM 재호출 방지.

```sql
create table reviews (
  id              uuid primary key default gen_random_uuid(),
  input_hash      text not null unique,   -- sha256(date + campaignName + copy + keywords)
  date            date not null,
  campaign_name   text,
  copy            text not null,
  asset_keywords  text[] not null default '{}',
  risk_score      text not null check (risk_score in ('safe', 'caution', 'danger', 'critical')),
  flagged_keywords text[] not null default '{}',
  matched_events  jsonb not null default '[]',   -- [{id, name, risk_level, summary}]
  suggestions     text[] not null default '{}',  -- 대안 카피 3개
  llm_rationale   text not null,
  rule_triggered  boolean not null default false,
  cached_until    timestamptz not null,
  reviewed_at     timestamptz not null default now()
);

create index on reviews (input_hash);
create index on reviews (date);
```

---

## 4. `waitlist` 테이블

웨이트리스트 이메일 수집.

```sql
create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text,                        -- "landing", "result-page", "calendar"
  created_at timestamptz not null default now()
);
```

---

## 5. 위험 등급 정의

| 등급 | 코드 | 색상 | 의미 |
|---|---|---|---|
| 위험 | `critical` | 🔴 Red | 절대 회피 권장. 해당 날짜·키워드 조합은 심각한 브랜드 리스크. |
| 주의 | `danger` | 🟠 Orange | 컨셉·카피 재검토 강력 권고. 조정 없이 진행 시 리스크 높음. |
| 경계 | `caution` | 🟡 Yellow | 인지하고 진행 가능. 톤·문구 조정 권장. |
| 안전 | `safe` | 🟢 Green | 감지된 위험 없음. 표준 주의 하에 진행 가능. |

---

## 6. 검토 API 입출력 타입

### Request `POST /api/check`

```typescript
{
  date: string;          // "YYYY-MM-DD"
  campaignName?: string; // 캠페인명 (옵셔널)
  copy: string;          // 카피 (필수)
  assetKeywords?: string[]; // 비주얼 키워드 ["탱크", "군복"] (옵셔널)
}
```

### Response

```typescript
{
  riskScore: "safe" | "caution" | "danger" | "critical";
  flaggedKeywords: string[];
  matchedEvents: {
    id: string;
    name: string;
    riskLevel: string;
    summary: string;
    recommendedTone: string;
    references: { label: string; url: string }[];
  }[];
  rationale: string;
  suggestions: string[];    // 대안 카피 3개
  ruleTriggered: boolean;   // true = LLM 호출 없이 룰 매칭으로 차단
  cached: boolean;
}
```
