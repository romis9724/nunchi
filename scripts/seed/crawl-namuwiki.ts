/**
 * 나무위키 날짜 페이지 크롤러
 * "사건·사고" 섹션에서 한국 역사 이벤트를 추출하여 events 테이블에 삽입
 *
 * 실행: tsx scripts/seed/crawl-namuwiki.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("환경변수를 설정하세요: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// 크롤링할 월/일 목록
// 한국 주요 역사 이벤트가 집중된 날짜들
const TARGET_DATES: [number, number][] = [
  // 1월
  [1, 14], [1, 20], [1, 28],
  // 2월
  [2, 28],
  // 3월
  [3, 1], [3, 8], [3, 10], [3, 15], [3, 26],
  // 4월
  [4, 3], [4, 5], [4, 11], [4, 16], [4, 19],
  // 5월
  [5, 1], [5, 5], [5, 15], [5, 16], [5, 18], [5, 20], [5, 23], [5, 25],
  // 6월
  [6, 6], [6, 10], [6, 15], [6, 25], [6, 29],
  // 7월
  [7, 17], [7, 27],
  // 8월
  [8, 14], [8, 15], [8, 29],
  // 9월
  [9, 3], [9, 15], [9, 16], [9, 21],
  // 10월
  [10, 3], [10, 9], [10, 16], [10, 26], [10, 29],
  // 11월
  [11, 3], [11, 11], [11, 17],
  // 12월
  [12, 3], [12, 9], [12, 12], [12, 18],
];

const MONTH_KR = ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

// 위험도 키워드 매핑
const RISK_KEYWORDS: { keywords: string[]; level: "critical" | "high" | "medium" | "low"; category: string }[] = [
  {
    keywords: ["학살", "학살", "고문", "참사", "민주화운동", "민주항쟁", "폭동", "진압", "계엄", "쿠데타"],
    level: "critical",
    category: "massacre",
  },
  {
    keywords: ["탄핵", "암살", "피격", "침략", "선전포고", "전쟁", "침공", "납치", "폭파", "폭발"],
    level: "high",
    category: "political",
  },
  {
    keywords: ["사망", "사고", "재해", "재난", "지진", "화재", "침몰", "추락", "붕괴", "사건"],
    level: "high",
    category: "disaster",
  },
  {
    keywords: ["데모", "시위", "집회", "파업", "항의", "규탄", "시국"],
    level: "medium",
    category: "social",
  },
  {
    keywords: ["기념일", "선언", "창설", "설립", "발족", "출범"],
    level: "low",
    category: "memorial",
  },
];

function classifyEvent(text: string): { level: "critical" | "high" | "medium" | "low"; category: string } {
  for (const { keywords, level, category } of RISK_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) {
      return { level, category };
    }
  }
  return { level: "medium", category: "social" };
}

function recommendedTone(level: string): string {
  if (level === "critical" || level === "high") return "memorial";
  if (level === "medium") return "neutral";
  return "neutral";
}

interface ParsedEvent {
  month: number;
  day: number;
  year?: number;
  name: string;
  summary: string;
  risk_level: "critical" | "high" | "medium" | "low";
  category: string;
  recommended_tone: string;
  source: string;
  status: string;
}

async function crawlDate(month: number, day: number): Promise<ParsedEvent[]> {
  const dateStr = `${MONTH_KR[month]} ${day}일`;
  const url = `https://namu.wiki/w/${encodeURIComponent(dateStr)}`;

  console.log(`  Fetching: ${url}`);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Noonchi/1.0; +https://noonchi-bay.vercel.app)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`    HTTP ${res.status}`);
      return [];
    }
    html = await res.text();
  } catch (e) {
    console.warn(`    Fetch failed: ${e}`);
    return [];
  }

  const events: ParsedEvent[] = [];

  // 사건·사고 섹션 추출
  const sectionPatterns = [
    /사건[··]?사고([\s\S]*?)(?=<h[12]|$)/i,
    /사건\s*사고([\s\S]*?)(?=<h[12]|$)/i,
  ];

  let sectionHtml = "";
  for (const pat of sectionPatterns) {
    const match = html.match(pat);
    if (match) {
      sectionHtml = match[1];
      break;
    }
  }

  if (!sectionHtml) {
    // 다른 방법: div.namu-content 에서 파싱
    const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (contentMatch) sectionHtml = contentMatch[1].substring(0, 5000);
  }

  if (!sectionHtml) return [];

  // 리스트 아이템 추출: 연도 - 사건명 패턴
  const listItemPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = listItemPattern.exec(sectionHtml)) !== null) {
    const rawText = liMatch[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!rawText) continue;

    // "1980년 - 사건명" 또는 "1980년: 사건명" 패턴
    const yearMatch = rawText.match(/^(\d{3,4})년\s*[-:·]\s*(.+)/);
    if (!yearMatch) continue;

    const year = parseInt(yearMatch[1]);
    const eventText = yearMatch[2].trim();

    // 너무 짧거나 영어만 있는 항목 제외
    if (eventText.length < 5) continue;
    if (/^[a-zA-Z\s]+$/.test(eventText)) continue;

    // 한국 관련 이벤트만 (외국 사건 제외)
    const foreignKeywords = ["미국", "영국", "일본", "중국", "러시아", "프랑스", "독일", "이탈리아", "스페인", "브라질"];
    const isForeign = foreignKeywords.some((kw) => eventText.startsWith(kw));

    const { level, category } = classifyEvent(eventText);

    // 외국 사건은 medium 이상이면 포함 (한국과 관련 있을 수 있으므로)
    if (isForeign && level === "low") continue;

    const slug = `${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${year}-${events.length}`;

    events.push({
      month,
      day,
      year,
      name: eventText.length > 80 ? eventText.substring(0, 80) + "…" : eventText,
      summary: `${year}년 ${MONTH_KR[month]} ${day}일에 발생한 사건입니다. (나무위키 크롤링 데이터 — 검토 후 수정 필요)`,
      risk_level: level,
      category,
      recommended_tone: recommendedTone(level),
      source: "manual",
      status: "pending_review",
    });
  }

  return events;
}

async function insertEvents(events: ParsedEvent[]): Promise<void> {
  if (events.length === 0) return;

  // 중복 방지: 같은 month/day/name 조합은 건너뜀
  for (const event of events) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("month", event.month)
      .eq("day", event.day)
      .eq("name", event.name)
      .single();

    if (existing) {
      console.log(`    Skip (duplicate): ${event.name}`);
      continue;
    }

    const { error } = await supabase.from("events").insert({
      slug: `namu-${event.month}-${event.day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      month: event.month,
      day: event.day,
      date_type: "fixed",
      country: "KR",
      name: event.name,
      category: event.category,
      risk_level: event.risk_level,
      summary: event.summary,
      recommended_tone: event.recommended_tone,
      related_keywords: [],
      related_motifs: [],
      references: [
        {
          label: `나무위키 — ${MONTH_KR[event.month]} ${event.day}일`,
          url: `https://namu.wiki/w/${encodeURIComponent(`${MONTH_KR[event.month]} ${event.day}일`)}`,
          type: "wiki",
        },
      ],
      status: event.status,
      source: event.source,
    });

    if (error) {
      console.error(`    Insert error: ${error.message} (${event.name})`);
    } else {
      console.log(`    ✓ [${event.risk_level}] ${event.month}/${event.day} ${event.name}`);
    }
  }
}

async function main() {
  console.log(`🕷️  나무위키 크롤러 시작 — ${TARGET_DATES.length}개 날짜\n`);

  let totalInserted = 0;

  for (const [month, day] of TARGET_DATES) {
    console.log(`\n📅 ${MONTH_KR[month]} ${day}일`);

    const events = await crawlDate(month, day);
    console.log(`  파싱된 이벤트: ${events.length}건`);

    if (events.length > 0) {
      await insertEvents(events);
      totalInserted += events.length;
    }

    // Rate limiting — 나무위키 서버 부하 방지
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n✅ 완료. 총 ${totalInserted}건 처리`);

  // 최종 pending_review 카운트
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  console.log(`📋 현재 검토 대기 이벤트: ${count}건`);
}

main().catch(console.error);
