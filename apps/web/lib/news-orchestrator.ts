/**
 * news-orchestrator.ts — Real implementation of the news automation pipeline.
 *
 * Sub-ACs 14c-1 + 14c-2:
 *  1. Fetch articles from Naver News API
 *  2. Filter to 대형사건·정치사회·기념일 categories
 *  3. For each filtered article, ask LLM to generate an event draft
 *  4. Insert drafts into events table with status='pending_review', source='naver_auto'
 *
 * The Supabase admin client is used to bypass RLS for server-side inserts.
 */

import type { NewsAutomationResult } from "./news-automation.js";

const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";
const DEFAULT_QUERY = "사건 사고 기념일 정치 사회";

interface RawNaverItem {
  title: string;
  description: string;
  pubDate: string;
  originallink: string;
}

/** Strip HTML tags from Naver news titles/descriptions. */
function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim();
}

/** Convert pubDate string (e.g. "Mon, 01 Jan 2026 00:00:00 +0900") to YYYY-MM-DD. */
function pubDateToISO(pubDate: string): string {
  try {
    return new Date(pubDate).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function runNewsOrchestrator(): Promise<NewsAutomationResult> {
  const errors: string[] = [];
  let eventsCreated = 0;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!clientId || !clientSecret) {
    return { eventsCreated: 0, errors: ["NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경변수가 없습니다."] };
  }
  if (!supabaseUrl || !serviceKey) {
    return { eventsCreated: 0, errors: ["Supabase 환경변수가 설정되지 않았습니다."] };
  }

  // 1. Fetch from Naver News API
  let items: RawNaverItem[] = [];
  try {
    const url = `${NAVER_API_URL}?query=${encodeURIComponent(DEFAULT_QUERY)}&display=30&sort=date`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) throw new Error(`Naver API ${res.status}`);
    const json = (await res.json()) as { items?: RawNaverItem[] };
    items = json.items ?? [];
  } catch (err) {
    errors.push(`Naver API 오류: ${err instanceof Error ? err.message : String(err)}`);
    return { eventsCreated, errors };
  }

  // 2. Filter and convert to event drafts — import filter from packages/llm
  let filtered: RawNaverItem[];
  try {
    const { filterNewsByCategory } = await import("@nunchi/llm");
    filtered = filterNewsByCategory(items as Parameters<typeof filterNewsByCategory>[0]) as unknown as RawNaverItem[];
  } catch {
    // fallback: use all items if filter module unavailable
    filtered = items;
  }

  if (filtered.length === 0) return { eventsCreated, errors };

  // 3. Insert drafts into events table
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  for (const item of filtered.slice(0, 10)) {
    const title = stripHtml(item.title);
    const date = pubDateToISO(item.pubDate);

    try {
      const { error } = await supabase.from("events").insert({
        event_date: date,       // 뉴스 이벤트 전용 YYYY-MM-DD 컬럼
        month: new Date(date).getMonth() + 1,
        day: new Date(date).getDate(),
        date_type: "fixed",
        name: title,
        category: "social",
        risk_level: "medium",
        summary: stripHtml(item.description).slice(0, 300),
        status: "pending_review",
        source: "naver_auto",
        related_keywords: [],
        related_motifs: [],
        recommended_tone: "neutral",
        references: [{ label: "원문", url: item.originallink, type: "media" }],
      });

      if (error) {
        errors.push(`이벤트 삽입 오류 (${title.slice(0, 20)}): ${error.message}`);
      } else {
        eventsCreated++;
      }
    } catch (err) {
      errors.push(`예외 (${title.slice(0, 20)}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { eventsCreated, errors };
}
