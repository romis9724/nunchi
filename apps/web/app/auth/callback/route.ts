import { NextRequest, NextResponse } from "next/server";
import { resolveAuthCallbackRedirect } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const result = await resolveAuthCallbackRedirect({
    code,
    successPath: "/onboarding",
    errorPath: "/auth/error",
  });

  return NextResponse.redirect(new URL(result.redirectUrl, request.url));
}
