import { query } from "../db";

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  message: string;
  user_id: string | null;
  created_at: string;
}

export interface InsertInquiryInput {
  name: string;
  email: string;
  message: string;
  user_id?: string | null;
}

/** inquiries 에 문의를 삽입하고 생성된 행을 반환한다. */
export async function insertInquiry(
  input: InsertInquiryInput
): Promise<InquiryRow> {
  const rows = await query<InquiryRow>(
    `INSERT INTO inquiries (name, email, message, user_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      input.name.trim(),
      input.email.trim(),
      input.message.trim(),
      input.user_id ?? null,
    ]
  );
  return rows[0];
}

/** 관리자용 — 최신순 전체 문의 목록. */
export async function listInquiries(): Promise<InquiryRow[]> {
  return query<InquiryRow>(
    `SELECT * FROM inquiries ORDER BY created_at DESC`
  );
}
