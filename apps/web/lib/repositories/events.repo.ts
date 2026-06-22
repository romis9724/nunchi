import { query } from "../db";
import type { EventRecord } from "@noonchi/shared";

/**
 * pgvector 컬럼은 node-postgres가 "[0.1,0.2,...]" 문자열로 반환한다.
 * 코사인 유사도 계산을 위해 number[] 로 파싱한다.
 */
function parseEmbedding(v: unknown): number[] {
  if (Array.isArray(v)) return v as number[];
  if (typeof v === "string" && v.length > 0) {
    try {
      return JSON.parse(v) as number[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * country=KR · status=approved · embedding 보유 이벤트 전체.
 * 의미 검색 후보 — 코사인 유사도 계산은 호출부 JS에서 수행한다
 * (events 행 수가 적어 충분하며, pgvector <=> 최적화는 후속 phase).
 */
export async function findEmbeddedApprovedEvents(): Promise<
  Array<EventRecord & { embedding: number[] }>
> {
  const rows = await query<EventRecord & { embedding: unknown }>(
    `SELECT * FROM events
     WHERE country = 'KR' AND status = 'approved' AND embedding IS NOT NULL`
  );
  return rows.map((r) => ({ ...r, embedding: parseEmbedding(r.embedding) }));
}

/**
 * 특정 월의 [dayLo, dayHi] 범위 approved 이벤트.
 * 위험도 정렬은 호출부에서 수행한다.
 */
export async function findNearbyEvents(
  month: number,
  dayLo: number,
  dayHi: number
): Promise<EventRecord[]> {
  return query<EventRecord>(
    `SELECT * FROM events
     WHERE country = 'KR' AND status = 'approved'
       AND month = $1 AND day BETWEEN $2 AND $3`,
    [month, dayLo, dayHi]
  );
}

/**
 * country=KR · (status IS NULL OR status='approved') 이벤트 전체.
 * /events 인덱스 · /sitemap · /api/events/nearby 등 공개 surface 에서 사용.
 * month·day 오름차순 정렬 — day NULL(범위 이벤트)은 NULLS FIRST 로 월 선두에 위치.
 */
export async function findApprovedEvents(): Promise<EventRecord[]> {
  return query<EventRecord>(
    `SELECT * FROM events
     WHERE country = 'KR' AND (status IS NULL OR status = 'approved')
     ORDER BY month ASC, day ASC NULLS FIRST`
  );
}

/**
 * status='approved' AND day IS NOT NULL 이벤트.
 * /calendar 그리드용 — 범위 이벤트(day NULL)는 제외한다.
 * month·day 오름차순 정렬.
 */
export async function findApprovedEventsWithDay(): Promise<EventRecord[]> {
  return query<EventRecord>(
    `SELECT * FROM events
     WHERE status = 'approved' AND day IS NOT NULL
     ORDER BY month ASC, day ASC`
  );
}

/** slug 단건 조회. 없으면 null. (status 무관 — 상세 페이지는 직접 링크 진입) */
export async function findEventBySlug(
  slug: string
): Promise<EventRecord | null> {
  const rows = await query<EventRecord>(
    `SELECT * FROM events WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

/** 관리자 이벤트 목록 행 (status 컬럼 포함). */
export interface AdminEventRow {
  id: string;
  month: number;
  day: number | null;
  name: string;
  category: string;
  risk_level: string;
  status: string;
  source: string;
  summary: string;
}

/**
 * 관리자용 — 전체 이벤트 목록(status 필터 옵션).
 * month·day 오름차순 정렬. status 미지정 시 전체.
 */
export async function findAdminEvents(
  status?: string | null
): Promise<AdminEventRow[]> {
  if (status) {
    return query<AdminEventRow>(
      `SELECT id, month, day, name, category, risk_level, status, source, summary
       FROM events
       WHERE status = $1
       ORDER BY month ASC, day ASC`,
      [status]
    );
  }
  return query<AdminEventRow>(
    `SELECT id, month, day, name, category, risk_level, status, source, summary
     FROM events
     ORDER BY month ASC, day ASC`
  );
}

/** 관리자용 — 이벤트 status 갱신. */
export async function updateEventStatus(
  id: string,
  status: string
): Promise<void> {
  await query(
    `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  );
}

export interface InsertNewsDraftInput {
  slug: string;
  month: number;
  day: number;
  name: string;
  summary: string;
  references: { label: string; url: string; type: string }[];
}

/**
 * 네이버 뉴스 자동화 초안 이벤트 1건 삽입.
 * status='pending_review', source='naver_auto' 고정. slug 중복 시 무시(DO NOTHING).
 * 실제 삽입되면 true, 중복 스킵이면 false.
 * (events 테이블에 event_date 컬럼은 없으므로 month·day 만 채운다.)
 */
export async function insertNewsDraftEvent(
  input: InsertNewsDraftInput
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO events (
       slug, date_type, month, day, country, name, category, risk_level,
       summary, related_keywords, related_motifs, recommended_tone,
       "references", status, source
     ) VALUES (
       $1, 'fixed', $2, $3, 'KR', $4, 'social', 'medium',
       $5, '{}', '{}', 'neutral',
       $6::jsonb, 'pending_review', 'naver_auto'
     )
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [
      input.slug,
      input.month,
      input.day,
      input.name,
      input.summary,
      JSON.stringify(input.references),
    ]
  );
  return rows.length > 0;
}
