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
