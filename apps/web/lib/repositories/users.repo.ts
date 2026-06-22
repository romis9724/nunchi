import { query } from "../db";

/** users 행 전체 형태. */
export interface UserRow {
  id: string;
  google_sub: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: "admin" | "user";
  company: string | null;
  brand: string | null;
  product_name: string | null;
  industries: string[];
  channels: string[];
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** /api/onboarding/profile · /mypage · /api/check 개인화에 쓰이는 프로필 부분집합. */
export interface UserProfile {
  industries: string[];
  channels: string[];
  company: string | null;
  brand: string | null;
  product_name: string | null;
}

/** 관리자 사용자 목록 행. */
export interface AdminUserRow {
  id: string;
  email: string | null;
  role: "admin" | "user";
  industries: string[];
  channels: string[];
  onboarding_completed_at: string | null;
  created_at: string;
}

export interface UpsertUserInput {
  googleSub: string;
  email: string | null;
  name: string | null;
  image: string | null;
  /** ADMIN_EMAILS 매칭 여부. true 면 role 을 admin 으로 승격(강등은 하지 않음). */
  isAdmin: boolean;
}

/**
 * Google 로그인 사용자를 google_sub 기준으로 upsert 한다.
 * NextAuth jwt 콜백(최초/재로그인)에서 호출된다.
 *
 * - 신규: role = isAdmin ? 'admin' : 'user'
 * - 기존: email·name·image 갱신. role 은 isAdmin=true 일 때만 admin 으로 승격하고,
 *   그렇지 않으면 기존 role 을 유지한다(수동 지정 admin 이 env 미등록으로 강등되지 않도록).
 */
export async function upsertUserByGoogleSub(
  input: UpsertUserInput
): Promise<UserRow> {
  const rows = await query<UserRow>(
    `INSERT INTO users (google_sub, email, name, image, role)
     VALUES ($1, $2, $3, $4, CASE WHEN $5 THEN 'admin' ELSE 'user' END)
     ON CONFLICT (google_sub) DO UPDATE
       SET email = EXCLUDED.email,
           name  = EXCLUDED.name,
           image = EXCLUDED.image,
           role  = CASE WHEN $5 THEN 'admin' ELSE users.role END,
           updated_at = NOW()
     RETURNING *`,
    [input.googleSub, input.email, input.name, input.image, input.isAdmin]
  );
  return rows[0];
}

/** id 로 단건 조회. 없으면 null. */
export async function findUserById(id: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/** 개인화에 필요한 프로필 부분집합. 사용자가 없으면 null. */
export async function findUserProfile(id: string): Promise<UserProfile | null> {
  const rows = await query<UserProfile>(
    `SELECT industries, channels, company, brand, product_name
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/** 온보딩 완료 여부(토큰 갱신·리다이렉트 판단용). */
export async function isOnboarded(id: string): Promise<boolean> {
  const rows = await query<{ onboarded: boolean }>(
    `SELECT onboarding_completed_at IS NOT NULL AS onboarded
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0]?.onboarded ?? false;
}

export interface CompleteOnboardingInput {
  industries: string[];
  channels: string[];
  company?: string | null;
  brand?: string | null;
  product_name?: string | null;
}

/**
 * 온보딩 프로필을 저장하고 onboarding_completed_at 을 현재 시각으로 설정한다.
 * (이미 완료한 사용자가 /mypage 에서 수정해도 동일 경로로 갱신된다.)
 */
export async function completeOnboarding(
  id: string,
  input: CompleteOnboardingInput
): Promise<void> {
  await query(
    `UPDATE users
       SET industries = $2,
           channels = $3,
           company = $4,
           brand = $5,
           product_name = $6,
           onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
           updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      input.industries,
      input.channels,
      input.company ?? null,
      input.brand ?? null,
      input.product_name ?? null,
    ]
  );
}

/** 관리자용 — 전체 사용자 목록(가입 최신순). */
export async function findAdminUsers(): Promise<AdminUserRow[]> {
  return query<AdminUserRow>(
    `SELECT id, email, role, industries, channels, onboarding_completed_at, created_at
     FROM users
     ORDER BY created_at DESC`
  );
}

/** 관리자용 — 사용자 role 갱신. */
export async function updateUserRole(
  id: string,
  role: "admin" | "user"
): Promise<void> {
  await query(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1`,
    [id, role]
  );
}
