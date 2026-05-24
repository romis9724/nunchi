import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  // Supabase 연결 테스트
  let supabaseTest: string;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await sb.from("events").select("count").limit(1);
    supabaseTest = error ? `error: ${error.message}` : `ok (${JSON.stringify(data)})`;
  } catch (e) {
    supabaseTest = `exception: ${(e as Error).message}`;
  }

  // Gemini 연결 테스트
  let geminiTest: string;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
      body: JSON.stringify({ model: "gemini-2.0-flash", messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
      signal: AbortSignal.timeout(10_000),
    });
    geminiTest = res.ok ? "ok" : `error ${res.status}: ${await res.text().then(t => t.slice(0,100))}`;
  } catch (e) {
    geminiTest = `exception: ${(e as Error).message}`;
  }

  return NextResponse.json({ envVars: checks, supabaseTest, geminiTest });
}
