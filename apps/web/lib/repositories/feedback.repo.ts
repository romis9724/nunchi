import { query } from "../db";

/** feedback 행 (관리자 조회용 필요 컬럼). */
export interface FeedbackRow {
  id: string;
  type: string;
  text: string;
  user_id: string | null;
  created_at: string;
}

export interface InsertFeedbackInput {
  type?: string;
  text: string;
  user_id?: string | null;
}

/**
 * feedback 에 피드백을 삽입한다.
 * type 미지정 시 'suggestion'. text 는 호출 전 trim 되어 들어온다고 가정하지 않고
 * 여기서 한 번 더 trim 한다.
 */
export async function insertFeedback(
  input: InsertFeedbackInput
): Promise<void> {
  await query(
    `INSERT INTO feedback (type, text, user_id)
     VALUES ($1, $2, $3)`,
    [input.type ?? "suggestion", input.text.trim(), input.user_id ?? null]
  );
}
