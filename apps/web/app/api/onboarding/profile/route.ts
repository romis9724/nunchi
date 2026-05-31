import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("industries, channels, company, brand, product_name")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ industries: [], channels: [], company: null, brand: null, product_name: null });
  }

  return NextResponse.json(data);
}
