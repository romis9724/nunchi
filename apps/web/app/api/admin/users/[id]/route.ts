import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { updateUserRole } from "@/lib/repositories/users.repo";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = (await request.json()) as { role?: string };
  if (!body.role || !["user", "admin"].includes(body.role)) {
    return NextResponse.json({ error: "유효하지 않은 role" }, { status: 422 });
  }

  await updateUserRole(id, body.role as "admin" | "user");
  return NextResponse.json({ ok: true });
}
