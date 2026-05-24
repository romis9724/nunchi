import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)를 .env.local에 추가해주세요.");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  }
  const key = supabaseServiceKey ?? supabaseAnonKey;
  if (!key) {
    throw new Error("Supabase key가 설정되지 않았습니다.");
  }
  return createClient(supabaseUrl, key);
}
