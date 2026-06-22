import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findUserProfile } from "@/lib/repositories/users.repo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const profile = await findUserProfile(session.user.id);

  return NextResponse.json(
    profile ?? {
      industries: [],
      channels: [],
      company: null,
      brand: null,
      product_name: null,
    }
  );
}
