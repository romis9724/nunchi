import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * jwt 콜백이 토큰에 적재하는 커스텀 클레임. JWT 모듈 증강이 pnpm 중첩 해소 문제로
 * 병합되지 않으므로, 토큰을 이 타입으로 캐스트해 안전하게 읽고 쓴다.
 */
export interface AppClaims {
  uid?: string;
  role?: "admin" | "user";
  onboarded?: boolean;
}

/**
 * Edge-safe NextAuth 설정.
 *
 * proxy.ts(엣지 런타임에서 토큰만 디코드)와 auth.ts(Node — DB 콜백 보유) 양쪽이 공유한다.
 * 그러므로 여기에는 pg 등 Node 전용 모듈을 절대 import 하지 않는다.
 *
 * Google provider 는 인자 없이 사용하며 AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 환경변수를
 * 자동으로 읽는다. 콜백 redirect URI 는 `<origin>/api/auth/callback/google` 이다.
 */
export const authConfig = {
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    /**
     * 토큰 → 세션 매핑. 순수 함수(DB 미접근)라 엣지에서도 동작한다.
     * uid·role·onboarded 는 auth.ts 의 jwt 콜백이 토큰에 적재한 값이다.
     */
    session({ session, token }) {
      const claims = token as AppClaims;
      if (session.user) {
        if (claims.uid) session.user.id = claims.uid;
        session.user.role = claims.role ?? "user";
        session.user.onboarded = claims.onboarded ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
