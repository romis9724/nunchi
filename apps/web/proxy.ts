import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Parse the Supabase v2 auth cookie to extract the access token. */
function getAccessToken(request: NextRequest): string | null {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(cookie.value) as { access_token?: string };
        return parsed.access_token ?? null;
      } catch {
        // some versions store the raw token string
        return cookie.value || null;
      }
    }
  }
  return null;
}

/** Decode a JWT payload without verifying the signature (middleware-only). */
function decodeJwtSub(token: string): string | null {
  try {
    const payload = Buffer.from(token.split(".")[1], "base64url").toString();
    return (JSON.parse(payload) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

/** Check user role in users table via Supabase REST API. */
async function getUserRole(userId: string, accessToken: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=role&id=eq.${userId}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );
    const rows = (await res.json()) as { role?: string }[];
    return rows[0]?.role ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = getAccessToken(request);
  const isLoggedIn = !!accessToken;

  // /check는 비로그인도 접근 가능 (personalizedComment만 로그인 시 추가)

  // /onboarding requires authentication
  if (pathname.startsWith("/onboarding") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /mypage requires authentication
  if (pathname.startsWith("/mypage") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /admin/* — proxy에서는 체크하지 않음 (Supabase v2 세션이 localStorage에 있어 서버 쿠키 접근 불가)
  // 대신 각 admin 페이지의 AdminGuard 클라이언트 컴포넌트에서 인증·권한 검증

  return NextResponse.next();
}

export const config = {
  matcher: ["/onboarding/:path*", "/mypage/:path*"],
};
