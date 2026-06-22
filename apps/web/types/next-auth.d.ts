import type { DefaultSession } from "next-auth";

/**
 * NextAuth 세션·JWT 타입 증강.
 * jwt 콜백이 토큰에 적재한 커스텀 클레임(uid·role·onboarded)을 세션에 노출한다.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "user";
      onboarded: boolean;
    } & DefaultSession["user"];
  }
}

// JWT 커스텀 클레임은 @auth/core/jwt 에 선언되나 해당 모듈이 apps/web 에서
// 직접 해소되지 않아(pnpm 중첩) 모듈 증강이 병합되지 않는다. 대신 auth.config 의
// AppClaims 타입으로 토큰을 명시 캐스트해 다룬다.
