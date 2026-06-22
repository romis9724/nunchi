import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { completeOnboarding } from "@/lib/repositories/users.repo";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { industries, channels, company, brand, product_name } = body as {
    industries?: string[];
    channels?: string[];
    company?: string | null;
    brand?: string | null;
    product_name?: string | null;
  };

  if (!Array.isArray(industries) || industries.length === 0) {
    return NextResponse.json({ error: "업종을 1개 이상 선택해 주세요." }, { status: 422 });
  }
  if (!Array.isArray(channels) || channels.length === 0) {
    return NextResponse.json({ error: "채널을 1개 이상 선택해 주세요." }, { status: 422 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    await completeOnboarding(session.user.id, {
      industries,
      channels,
      company: company ?? null,
      brand: brand ?? null,
      product_name: product_name ?? null,
    });
  } catch (error) {
    console.error(
      "[onboarding] DB error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
