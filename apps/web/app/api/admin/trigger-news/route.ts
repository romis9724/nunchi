import { NextResponse } from "next/server";

export async function POST() {
  const cronSecret = process.env.CRON_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nunchi-bay.vercel.app";

  const res = await fetch(`${appUrl}/api/cron/news-automation`, {
    headers: { "Authorization": `Bearer ${cronSecret}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
