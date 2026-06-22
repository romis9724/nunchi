import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Next.js 16 Proxy(구 Middleware). 엣지에서 동작하도록 auth.config(경량) 인스턴스만 사용한다
 * — DB(pg)를 import 하는 auth.ts 는 여기서 쓰지 않는다.
 *
 * NextAuth 가 세션 JWT(JWE)의 서명을 검증해 디코드하므로, 이전 proxy.ts 의
 * "서명 무검증 base64 디코드" 결함이 해소된다. role·onboarded 는 토큰에 적재된
 * 값을 optimistic 하게 읽어 리다이렉트만 수행하며, 최종 권위는 서버의 requireAdmin/auth() 다.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;
  const onboarded = session?.user?.onboarded ?? false;

  const needsAuth =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/mypage") ||
    pathname.startsWith("/admin");

  // 1) 비로그인 보호 경로 → 홈(로그인)
  if (needsAuth && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 2) 관리자 경로 role 체크 (optimistic — 서버 requireAdmin 이 최종 권위)
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // 3) 온보딩 미완료 로그인 사용자 → /onboarding 강제 (/check·/admin 진입 시)
  if (isLoggedIn && !onboarded && (pathname.startsWith("/check") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }

  // 4) 온보딩 완료자가 /onboarding 진입 → /check
  if (isLoggedIn && onboarded && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/check", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/check",
    "/check/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/mypage",
    "/mypage/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
