/**
 * Unit tests for newsFilter — Sub-AC 14b
 *
 * 뉴스 기사 필터링 함수를 검증:
 *   - filterNewsByCategory() : 원시 기사 배열 → 대형사건·정치사회·기념일만 반환
 *   - classifyArticleCategory() : 단일 기사 카테고리 분류
 *
 * 포함 케이스:
 *   - 대형사건 기사 (참사, 재난, 사망, 폭발 등 키워드 포함)
 *   - 정치사회 기사 (대통령, 국회, 선거, 탄핵 등 키워드 포함)
 *   - 기념일 기사 (5·18, 현충일, 주년, 추모 등 키워드 포함)
 *
 * 제외 케이스:
 *   - 연예 기사 (드라마, 아이돌, K-POP 등 키워드 포함)
 *   - 스포츠 기사 (야구, 축구, 올림픽 등 키워드 포함)
 *   - 기타 기사 (어느 카테고리에도 해당 없음)
 *
 * Run: pnpm --filter @noonchi/llm test:news-filter
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterNewsByCategory,
  classifyArticleCategory,
  INCLUDED_CATEGORIES,
  type RawArticle,
  type ArticleCategory,
} from "./newsFilter.js";

// ── 테스트 픽스처 헬퍼 ──────────────────────────────────────────────────────────

function makeArticle(
  title: string,
  description: string = ""
): RawArticle {
  return { title, description };
}

// ── classifyArticleCategory 단위 테스트 ────────────────────────────────────────

describe("classifyArticleCategory — 단일 기사 카테고리 분류", () => {
  // ════════════════════════════════════════════════════════════════════════════
  // 포함 케이스: 대형사건
  // ════════════════════════════════════════════════════════════════════════════

  it("'참사' 키워드 포함 → 대형사건", () => {
    const article = makeArticle("이태원 참사 3주년 추모 행사");
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("'재난' 키워드 포함 → 대형사건", () => {
    const article = makeArticle("폭우로 인한 재난 선포, 피해 지역 구조 진행 중");
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("'사망' 키워드 포함 → 대형사건", () => {
    const article = makeArticle(
      "건물 화재로 3명 사망, 소방당국 진화 작업",
      "어젯밤 발생한 화재로 사망 3명, 부상 5명 발생"
    );
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("'폭발' 키워드 포함 → 대형사건", () => {
    const article = makeArticle("가스 폭발 사고 발생, 인근 주민 대피");
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("'테러' 키워드 포함 → 대형사건", () => {
    const article = makeArticle("국제 테러 단체 관련 인물 국내 입국 차단");
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("'침몰' 키워드 포함 → 대형사건", () => {
    const article = makeArticle(
      "어선 침몰 사고",
      "서해에서 어선이 침몰하여 선원 구조 작업 중"
    );
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("'희생자' 키워드 포함 → 대형사건", () => {
    const article = makeArticle("희생자 추모 행사, 유족 오열");
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  it("제목엔 없지만 설명에 대형사건 키워드 포함 → 대형사건", () => {
    const article = makeArticle(
      "사고 소식",
      "대형 교통사고로 다수의 사상자가 발생했습니다"
    );
    assert.equal(classifyArticleCategory(article), "대형사건");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 포함 케이스: 정치사회
  // ════════════════════════════════════════════════════════════════════════════

  it("'대통령' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("대통령 국정 연설, 경제 정책 발표");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'국회' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("국회 본회의에서 예산안 처리");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'선거' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("대선 여론조사 결과 공개");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'탄핵' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("헌법재판소, 탄핵 심판 선고");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'장관' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("법무부 장관 인사청문회 진행");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'시위' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("광화문 대규모 시위, 경찰 통제");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'검찰' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("검찰, 주요 피의자 소환 조사");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'외교' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("한미 정상회담, 외교 안보 현안 논의");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("'파업' 키워드 포함 → 정치사회", () => {
    const article = makeArticle("의료계 총파업 선언");
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  it("설명에 정치사회 키워드 포함 → 정치사회", () => {
    const article = makeArticle(
      "주요 현안 논의",
      "국회의원들이 법안 심의를 위해 소집되었다"
    );
    assert.equal(classifyArticleCategory(article), "정치사회");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 포함 케이스: 기념일
  // ════════════════════════════════════════════════════════════════════════════

  it("'5·18' 키워드 포함 → 기념일", () => {
    const article = makeArticle("5·18 광주민주화운동 44주년 기념식 거행");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'현충일' 키워드 포함 → 기념일", () => {
    const article = makeArticle("현충일 추념식, 전국 묵념");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'광복절' 키워드 포함 → 기념일", () => {
    const article = makeArticle("광복절 80주년 기념행사 전국 동시 개최");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'삼일절' 키워드 포함 → 기념일", () => {
    const article = makeArticle("삼일절 기념식, 독립운동 정신 계승");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'세월호' 키워드 포함 → 기념일", () => {
    const article = makeArticle("세월호 참사 12주기 추모 행사");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'추모' 키워드 포함 → 기념일", () => {
    const article = makeArticle("6·25 참전 용사 추모 행사 개최");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'주년' 키워드 포함 → 기념일", () => {
    const article = makeArticle("4·19 혁명 66주년 기념사업 추진");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  it("'6.25' 표기 → 기념일 (마침표 구분자)", () => {
    const article = makeArticle("6.25 전쟁 75주년 기념일");
    assert.equal(classifyArticleCategory(article), "기념일");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 제외 케이스: 연예
  // ════════════════════════════════════════════════════════════════════════════

  it("'드라마' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("인기 드라마 시청률 30% 돌파, 시청자 반응 폭발적");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("'아이돌' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("국내 아이돌 그룹, 빌보드 차트 1위 달성");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("'K-POP' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("K-POP 월드투어 일정 발표");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("'콘서트' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("가수 A 단독 콘서트 티켓 매진");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("'BTS' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("BTS 신보 발매, 글로벌 스트리밍 기록 경신");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("'시청률' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("예능 프로그램 시청률 최고치 기록");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("'연예인' 키워드 포함 → 연예 (제외)", () => {
    const article = makeArticle("연예인 A, 열애설 인정");
    assert.equal(classifyArticleCategory(article), "연예");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 제외 케이스: 스포츠
  // ════════════════════════════════════════════════════════════════════════════

  it("'야구' 키워드 포함 → 스포츠 (제외)", () => {
    const article = makeArticle("KBO 리그 야구 경기 결과");
    assert.equal(classifyArticleCategory(article), "스포츠");
  });

  it("'축구' 키워드 포함 → 스포츠 (제외)", () => {
    const article = makeArticle("K리그 축구 경기 하이라이트");
    assert.equal(classifyArticleCategory(article), "스포츠");
  });

  it("'올림픽' 키워드 포함 → 스포츠 (제외)", () => {
    const article = makeArticle("2028 LA 올림픽 한국 선수단 금메달 목표");
    assert.equal(classifyArticleCategory(article), "스포츠");
  });

  it("'월드컵' 키워드 포함 → 스포츠 (제외)", () => {
    const article = makeArticle("FIFA 월드컵 아시아 예선 결과");
    assert.equal(classifyArticleCategory(article), "스포츠");
  });

  it("'골프' 키워드 포함 → 스포츠 (제외)", () => {
    const article = makeArticle("박지은 선수 PGA 골프 우승");
    assert.equal(classifyArticleCategory(article), "스포츠");
  });

  it("'홈런' 키워드 포함 → 스포츠 (제외)", () => {
    const article = makeArticle("김타자 30호 홈런, 개인 최다 기록 경신");
    assert.equal(classifyArticleCategory(article), "스포츠");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 제외 케이스: 기타
  // ════════════════════════════════════════════════════════════════════════════

  it("날씨 기사 → 기타 (제외)", () => {
    const article = makeArticle("오늘 날씨: 전국 맑음, 낮 최고 25도");
    assert.equal(classifyArticleCategory(article), "기타");
  });

  it("경제·금융 기사 → 기타 (제외)", () => {
    const article = makeArticle("코스피 2,600 돌파, 외국인 순매수");
    assert.equal(classifyArticleCategory(article), "기타");
  });

  it("생활·소비 기사 → 기타 (제외)", () => {
    const article = makeArticle("편의점 신제품 출시, 소비자 반응");
    assert.equal(classifyArticleCategory(article), "기타");
  });

  it("빈 제목·설명 → 기타 (제외)", () => {
    const article = makeArticle("", "");
    assert.equal(classifyArticleCategory(article), "기타");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 우선순위 케이스: 연예·스포츠가 포함 키워드보다 우선
  // ════════════════════════════════════════════════════════════════════════════

  it("연예 + 정치사회 키워드 혼재 → 연예 우선 제외", () => {
    // 연예인 정치 발언 기사 같은 경우
    const article = makeArticle(
      "연예인 A, 대통령 발언 논란",
      "드라마 배우 A가 대통령을 비판하는 발언으로 화제"
    );
    assert.equal(classifyArticleCategory(article), "연예");
  });

  it("스포츠 + 기념일 키워드 혼재 → 스포츠 우선 제외", () => {
    // 광복절 기념 스포츠 행사 기사
    const article = makeArticle(
      "광복절 기념 국제 야구 대회 개최",
      "야구 국가대표팀 광복절 기념 특별 경기 출전"
    );
    // 연예가 아니므로 스포츠가 다음 우선 → 스포츠 반환
    assert.equal(classifyArticleCategory(article), "스포츠");
  });
});

// ── filterNewsByCategory 단위 테스트 ──────────────────────────────────────────

describe("filterNewsByCategory — 원시 기사 배열 필터링", () => {
  // ════════════════════════════════════════════════════════════════════════════
  // 기본 동작
  // ════════════════════════════════════════════════════════════════════════════

  it("빈 배열 입력 → 빈 배열 반환", () => {
    const result = filterNewsByCategory([]);
    assert.deepEqual(result, []);
  });

  it("대형사건 기사만 있는 배열 → 전체 반환", () => {
    const articles: RawArticle[] = [
      makeArticle("대형 화재 발생"),
      makeArticle("지진 피해 속보"),
    ];
    const result = filterNewsByCategory(articles);
    assert.equal(result.length, 2);
  });

  it("정치사회 기사만 있는 배열 → 전체 반환", () => {
    const articles: RawArticle[] = [
      makeArticle("대통령 신년 기자회견"),
      makeArticle("국회 본회의 파행"),
    ];
    const result = filterNewsByCategory(articles);
    assert.equal(result.length, 2);
  });

  it("기념일 기사만 있는 배열 → 전체 반환", () => {
    const articles: RawArticle[] = [
      makeArticle("5·18 기념식 거행"),
      makeArticle("현충일 추모 행사"),
    ];
    const result = filterNewsByCategory(articles);
    assert.equal(result.length, 2);
  });

  it("연예·스포츠 기사만 있는 배열 → 빈 배열 반환", () => {
    const articles: RawArticle[] = [
      makeArticle("인기 드라마 시청률 1위"),
      makeArticle("야구 한국시리즈 결과"),
      makeArticle("아이돌 콘서트 매진"),
    ];
    const result = filterNewsByCategory(articles);
    assert.equal(result.length, 0, "연예·스포츠 기사는 모두 제외되어야 합니다");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 혼합 배열 필터링
  // ════════════════════════════════════════════════════════════════════════════

  it("혼합 배열 — 포함 카테고리 기사만 반환", () => {
    const articles: RawArticle[] = [
      makeArticle("5·18 기념식 44주년"),                   // 기념일 ✓
      makeArticle("아이돌 그룹 컴백 무대"),                 // 연예 ✗
      makeArticle("대통령, 경제 정책 발표"),                // 정치사회 ✓
      makeArticle("KBO 야구 시즌 개막"),                    // 스포츠 ✗
      makeArticle("건물 붕괴 사고, 다수 사상자"),           // 대형사건 ✓
      makeArticle("주말 날씨 맑고 기온 상승"),              // 기타 ✗
    ];

    const result = filterNewsByCategory(articles);

    assert.equal(
      result.length,
      3,
      `포함 카테고리 기사 3개만 반환해야 합니다. 실제: ${result.length}`
    );

    const titles = result.map((a) => a.title);
    assert.ok(
      titles.includes("5·18 기념식 44주년"),
      "기념일 기사가 포함되어야 합니다"
    );
    assert.ok(
      titles.includes("대통령, 경제 정책 발표"),
      "정치사회 기사가 포함되어야 합니다"
    );
    assert.ok(
      titles.includes("건물 붕괴 사고, 다수 사상자"),
      "대형사건 기사가 포함되어야 합니다"
    );
  });

  it("모든 기사가 포함 카테고리인 배열 → 전체 반환", () => {
    const articles: RawArticle[] = [
      makeArticle("광복절 80주년 기념식"),
      makeArticle("국회 탄핵소추안 가결"),
      makeArticle("대형 산불, 이재민 발생"),
    ];
    const result = filterNewsByCategory(articles);
    assert.equal(result.length, 3);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 순수 함수 특성: 원본 배열 불변
  // ════════════════════════════════════════════════════════════════════════════

  it("원본 배열을 변경하지 않는다 (순수 함수)", () => {
    const articles: RawArticle[] = [
      makeArticle("대통령 외교 회담"),
      makeArticle("축구 경기 결과"),
      makeArticle("세월호 추모"),
    ];
    const originalLength = articles.length;
    const originalTitles = articles.map((a) => a.title);

    filterNewsByCategory(articles);

    assert.equal(articles.length, originalLength, "원본 배열 길이가 변경되지 않아야 합니다");
    assert.deepEqual(
      articles.map((a) => a.title),
      originalTitles,
      "원본 배열 내용이 변경되지 않아야 합니다"
    );
  });

  it("동일 입력에 항상 동일 출력을 반환한다 (결정론적)", () => {
    const articles: RawArticle[] = [
      makeArticle("5·18 기념식"),
      makeArticle("드라마 시청률"),
      makeArticle("국회 법안"),
    ];

    const result1 = filterNewsByCategory(articles);
    const result2 = filterNewsByCategory(articles);

    assert.deepEqual(result1, result2, "동일 입력에 동일 출력이어야 합니다");
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 제네릭 타입 보존: 확장된 타입의 추가 필드가 유지됨
  // ════════════════════════════════════════════════════════════════════════════

  it("NaverNewsItem처럼 추가 필드가 있는 타입도 필터링 후 타입 보존", () => {
    interface ExtendedArticle extends RawArticle {
      link: string;
      pubDate: string;
    }

    const articles: ExtendedArticle[] = [
      {
        title: "대통령 신년사",
        description: "국정 방향 발표",
        link: "https://example.com/1",
        pubDate: "Mon, 01 Jan 2026 09:00:00 +0900",
      },
      {
        title: "K-pop 신보 발매",
        description: "인기 가수 컴백",
        link: "https://example.com/2",
        pubDate: "Tue, 02 Jan 2026 10:00:00 +0900",
      },
    ];

    const result = filterNewsByCategory(articles);

    assert.equal(result.length, 1, "정치사회 기사 1개만 반환해야 합니다");
    assert.equal(result[0].link, "https://example.com/1", "추가 필드 link가 유지되어야 합니다");
    assert.equal(result[0].pubDate, "Mon, 01 Jan 2026 09:00:00 +0900", "추가 필드 pubDate가 유지되어야 합니다");
  });
});

// ── INCLUDED_CATEGORIES 상수 테스트 ───────────────────────────────────────────

describe("INCLUDED_CATEGORIES 상수", () => {
  it("대형사건·정치사회·기념일 세 카테고리를 포함한다", () => {
    const expected: ArticleCategory[] = ["대형사건", "정치사회", "기념일"];
    for (const cat of expected) {
      assert.ok(
        (INCLUDED_CATEGORIES as readonly ArticleCategory[]).includes(cat),
        `INCLUDED_CATEGORIES에 '${cat}'가 포함되어야 합니다`
      );
    }
  });

  it("연예·스포츠·기타는 포함하지 않는다", () => {
    const excluded: ArticleCategory[] = ["연예", "스포츠", "기타"];
    for (const cat of excluded) {
      assert.ok(
        !(INCLUDED_CATEGORIES as readonly ArticleCategory[]).includes(cat),
        `INCLUDED_CATEGORIES에 '${cat}'가 포함되지 않아야 합니다`
      );
    }
  });
});
