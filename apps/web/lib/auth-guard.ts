import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";

/** requireAdmin 통과 시 반환되는 세션 래퍼. */
export interface AdminGuardPass {
  session: Session;
}

/**
 * 관리자 전용 라우트 가드. 라우트 핸들러 진입부에서 호출한다.
 *
 * ```ts
 * const guard = await requireAdmin();
 * if (guard instanceof NextResponse) return guard; // 401/403
 * // guard.session.user 사용 가능
 * ```
 *
 * - 비로그인 → 401
 * - 로그인했으나 role !== 'admin' → 403
 *
 * 이전 구조에서는 /api/admin/* 가 인증 없이 service role 로 무방비 노출됐다.
 * 이 가드가 서버 측 최종 권위이며, proxy.ts 의 admin 리다이렉트는 UX 용 optimistic 체크일 뿐이다.
 */
export async function requireAdmin(): Promise<NextResponse | AdminGuardPass> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  return { session };
}
