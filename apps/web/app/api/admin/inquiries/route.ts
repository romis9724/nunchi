import { NextResponse } from "next/server";
import { listInquiries } from "@/lib/repositories/inquiries.repo";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const rows = await listInquiries();
    // 원본 응답 형태 보존 — id, name, email, message, created_at 만 노출.
    const result = rows.map(({ id, name, email, message, created_at }) => ({
      id,
      name,
      email,
      message,
      created_at,
    }));
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
