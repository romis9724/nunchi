import NextAuth from "next-auth";
import { authConfig, type AppClaims } from "./auth.config";
import {
  upsertUserByGoogleSub,
  isOnboarded,
} from "@/lib/repositories/users.repo";

/**
 * Node 런타임 NextAuth 인스턴스 — DB(pg)에 접근하는 jwt 콜백을 포함한다.
 * 서버 컴포넌트·라우트 핸들러에서 `auth()` 로 세션을 읽고, /api/auth/* 핸들러를 제공한다.
 * (엣지 proxy.ts 는 auth.config 만으로 만든 경량 인스턴스를 따로 사용한다.)
 *
 * 필수 환경변수: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET.
 * 자체 도메인 + 리버스프록시 뒤에서는 AUTH_URL, AUTH_TRUST_HOST=true 권장.
 * ADMIN_EMAILS(쉼표구분)에 포함된 이메일은 로그인 시 role=admin 으로 승격된다.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * 최초/재로그인(account+profile 존재): Google profile 을 google_sub 기준으로
     * RDS upsert 하고 토큰에 uid·role·onboarded 를 적재한다.
     * 온보딩 완료 후 클라이언트가 useSession().update() 를 호출하면
     * trigger==='update' 로 재진입하여 onboarded 플래그를 갱신한다.
     */
    async jwt({ token, account, profile, trigger }) {
      const claims = token as AppClaims;
      if (account && profile) {
        const email = (profile.email as string | undefined) ?? null;
        const user = await upsertUserByGoogleSub({
          googleSub: profile.sub as string,
          email,
          name: (profile.name as string | undefined) ?? null,
          image: (profile.picture as string | undefined) ?? null,
          isAdmin: email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false,
        });
        claims.uid = user.id;
        claims.role = user.role;
        claims.onboarded = user.onboarding_completed_at != null;
      } else if (trigger === "update" && claims.uid) {
        claims.onboarded = await isOnboarded(claims.uid);
      }
      return token;
    },
  },
});
