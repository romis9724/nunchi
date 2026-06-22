import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { findAdminUsers } from "@/lib/repositories/users.repo";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const users = await findAdminUsers();
  return NextResponse.json(users);
}
