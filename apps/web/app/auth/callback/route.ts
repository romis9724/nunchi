import { NextRequest, NextResponse } from "next/server";
import { resolveAuthCallbackRedirect } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  // OAuth 코드 교환 — 세션 생성
  const result = await resolveAuthCallbackRedirect({
    code,
    successPath: "/onboarding",
    errorPath: "/auth/error",
  });

  if (result.redirectUrl === "/auth/error") {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  // 온보딩 완료 여부 확인 — 완료했으면 /check으로
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed_at) {
        return NextResponse.redirect(new URL("/check", request.url));
      }
    }
  } catch {
    // 프로필 조회 실패 시 기본값 /onboarding으로 진행
  }

  return NextResponse.redirect(new URL("/onboarding", request.url));
}
