import { query } from "../db";

/**
 * waitlist 에 이메일을 등록한다. 중복(email)은 무시(DO NOTHING).
 * email 은 호출 전에 정규화(trim+lowercase)되어 들어온다고 가정하지 않고
 * 여기서 한 번 더 정규화한다.
 */
export async function upsertWaitlistEmail(
  email: string,
  source = "landing"
): Promise<void> {
  await query(
    `INSERT INTO waitlist (email, source)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [email.trim().toLowerCase(), source]
  );
}

/** waitlist 총 행 수. */
export async function getWaitlistCount(): Promise<number> {
  const rows = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM waitlist`
  );
  return rows[0]?.count ?? 0;
}
