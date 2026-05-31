/**
 * newsFilter — 뉴스 기사 카테고리 필터 (Sub-AC 14b)
 *
 * 원시 기사 배열을 입력받아 '대형사건·정치사회·기념일' 카테고리에
 * 해당하는 기사만 반환하는 순수 함수.
 *
 * 분류 전략:
 *   1. 제목(title) + 설명(description) 텍스트를 합쳐서 키워드 매칭
 *   2. 연예·스포츠 제외 키워드가 명확하게 포함된 기사는 먼저 제외
 *   3. 대형사건·정치사회·기념일 포함 키워드 중 하나 이상 매칭 시 포함
 *   4. 어느 쪽에도 해당하지 않으면 제외
 *
 * 순수 함수 — 부수효과 없음, 동일 입력에 동일 출력.
 */

/** 필터 대상 기사의 최소 인터페이스 (NaverNewsItem 포함, 기타 원시 기사 포함 가능) */
export interface RawArticle {
  title: string;
  description: string;
}

/** 기사 카테고리 */
export type ArticleCategory =
  | "대형사건"
  | "정치사회"
  | "기념일"
  | "연예"
  | "스포츠"
  | "기타";

/** 포함 카테고리 (필터 통과 대상) */
export const INCLUDED_CATEGORIES: readonly ArticleCategory[] = [
  "대형사건",
  "정치사회",
  "기념일",
];

// ── 포함 키워드 사전 ─────────────────────────────────────────────────────────────

/** 대형사건 지표 키워드 */
const MAJOR_INCIDENT_KEYWORDS: readonly string[] = [
  "참사",
  "사망",
  "재난",
  "재해",
  "화재",
  "지진",
  "홍수",
  "태풍",
  "폭설",
  "폭발",
  "테러",
  "붕괴",
  "침몰",
  "충돌",
  "추락",
  "폭격",
  "전쟁",
  "분쟁",
  "피해",
  "실종",
  "구조",
  "희생자",
  "사상자",
  "부상자",
  "사고사",
  "대형사고",
  "산불",
  "이재민",
  "침수",
  "피난민",
  "사고",
];

/** 정치사회 지표 키워드 */
const POLITICAL_SOCIAL_KEYWORDS: readonly string[] = [
  "대통령",
  "국회",
  "국회의원",
  "장관",
  "총리",
  "청와대",
  "여당",
  "야당",
  "선거",
  "탄핵",
  "국정감사",
  "법안",
  "외교",
  "정책",
  "시위",
  "집회",
  "파업",
  "검찰",
  "수사",
  "재판",
  "사법",
  "입법",
  "행정부",
  "민주당",
  "국민의힘",
  "대선",
  "총선",
  "보궐",
  "헌법재판소",
  "비례대표",
];

/**
 * 기념일 강 신호 키워드 — 특정 역사적 사건명·국가기념일 명칭.
 * 대형사건 키워드보다 높은 우선순위로 검사되어, 해당 명칭이 포함된 기사를
 * 확실한 기념일 기사로 분류한다.
 */
const ANNIVERSARY_STRONG_KEYWORDS: readonly string[] = [
  "광복절",
  "삼일절",
  "현충일",
  "제헌절",
  "개천절",
  "한글날",
  "5·18",
  "5.18",
  "4·19",
  "4.19",
  "6·25",
  "6.25",
  "4·16",
  "4.16",
  "3·1",
  "3.1",
  "6·10",
  "6.10",
  "세월호",
  "임시정부",
  "독립운동",
  "민주항쟁",
  "국가기념일",
];

/**
 * 기념일 약 신호 키워드 — 일반적 추모·기념 용어.
 * 대형사건 키워드보다 낮은 우선순위로 검사되어, 대형사건 신호가 없는 경우에만
 * 기념일로 분류한다.
 */
const ANNIVERSARY_WEAK_KEYWORDS: readonly string[] = [
  "기념일",
  "기념식",
  "추모",
  "주년",
  "추념",
  "기념행사",
];

// ── 제외 키워드 사전 ─────────────────────────────────────────────────────────────

/** 연예 제외 키워드 */
const ENTERTAINMENT_KEYWORDS: readonly string[] = [
  "드라마",
  "예능",
  "아이돌",
  "케이팝",
  "K-POP",
  "k-pop",
  "콘서트",
  "팬미팅",
  "뮤직비디오",
  "시청률",
  "오디션",
  "방탄소년단",
  "BTS",
  "블랙핑크",
  "연예인",
  "가수",
  "뮤지컬",
  "영화제",
  "연기대상",
  "음악방송",
  "쇼케이스",
  "아카데미",
  "칸영화제",
  "베니스",
  "모델",
  "패션쇼",
];

/** 스포츠 제외 키워드 */
const SPORTS_KEYWORDS: readonly string[] = [
  "야구",
  "축구",
  "농구",
  "배구",
  "골프",
  "테니스",
  "수영",
  "육상",
  "체조",
  "유도",
  "태권도",
  "올림픽",
  "아시안게임",
  "월드컵",
  "KBO",
  "NBA",
  "EPL",
  "PGA",
  "득점왕",
  "홈런",
  "결승골",
  "선수단",
  "경기장",
  "감독",
  "코치",
  "리그전",
  "FA",
  "드래프트",
  "스포츠",
];

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────────

/**
 * 검색 대상 텍스트에 키워드 목록 중 하나 이상이 포함되는지 검사한다.
 * 대소문자를 구분하지 않는다.
 */
function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * 기사 텍스트(title + description)를 조합하여 반환한다.
 */
function articleText(article: RawArticle): string {
  return `${article.title} ${article.description}`;
}

// ── 공개 API ─────────────────────────────────────────────────────────────────────

/**
 * 단일 기사의 카테고리를 분류한다.
 *
 * 우선순위:
 *   1. 연예 제외 키워드 매칭 → "연예"
 *   2. 스포츠 제외 키워드 매칭 → "스포츠"
 *   3. 기념일 강 신호 (특정 사건명·국가기념일) 매칭 → "기념일"
 *   4. 대형사건 키워드 매칭 → "대형사건"
 *   5. 기념일 약 신호 (추모·주년 등 일반 기념 용어) 매칭 → "기념일"
 *   6. 정치사회 키워드 매칭 → "정치사회"
 *   7. 어느 쪽도 아니면 → "기타"
 *
 * 강/약 신호 분리 이유: "이태원 참사 3주년 추모" 처럼 일반 추모 용어와 함께
 * 대형사건 키워드가 있는 경우 대형사건으로, "세월호 참사 추모" 처럼 특정
 * 사건명이 명시된 경우 기념일로 분류하기 위함.
 */
export function classifyArticleCategory(article: RawArticle): ArticleCategory {
  const text = articleText(article);

  if (containsAny(text, ENTERTAINMENT_KEYWORDS)) return "연예";
  if (containsAny(text, SPORTS_KEYWORDS)) return "스포츠";
  if (containsAny(text, ANNIVERSARY_STRONG_KEYWORDS)) return "기념일";
  if (containsAny(text, MAJOR_INCIDENT_KEYWORDS)) return "대형사건";
  if (containsAny(text, ANNIVERSARY_WEAK_KEYWORDS)) return "기념일";
  if (containsAny(text, POLITICAL_SOCIAL_KEYWORDS)) return "정치사회";
  return "기타";
}

/**
 * 원시 기사 배열을 입력받아 '대형사건·정치사회·기념일' 카테고리에 해당하는
 * 기사만 반환하는 순수 함수.
 *
 * @param articles - 원시 기사 배열 (NaverNewsItem 등 RawArticle을 충족하는 모든 타입)
 * @returns 포함 카테고리(대형사건·정치사회·기념일)에 속하는 기사 배열
 *
 * @example
 * const filtered = filterNewsByCategory(rawArticles);
 * // filtered에는 연예·스포츠·기타 기사가 포함되지 않는다
 */
export function filterNewsByCategory<T extends RawArticle>(
  articles: readonly T[]
): T[] {
  return articles.filter((article) => {
    const category = classifyArticleCategory(article);
    return (INCLUDED_CATEGORIES as readonly ArticleCategory[]).includes(
      category
    );
  });
}
