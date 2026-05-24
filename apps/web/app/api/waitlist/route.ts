import { NextRequest, NextResponse } from "next/server";
import { handleWaitlistPost } from "@/lib/waitlist";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const result = await handleWaitlistPost(body);
  return NextResponse.json(result.body, { status: result.status });
}
