import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = "https://nunchi-bay.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,         changeFrequency: "weekly",  priority: 1.0,  lastModified: now },
    { url: `${BASE_URL}/check`,    changeFrequency: "weekly",  priority: 0.9,  lastModified: now },
    { url: `${BASE_URL}/calendar`, changeFrequency: "daily",   priority: 0.9,  lastModified: now },
    { url: `${BASE_URL}/events`,   changeFrequency: "daily",   priority: 0.8,  lastModified: now },
    { url: `${BASE_URL}/contact`,  changeFrequency: "monthly", priority: 0.5,  lastModified: now },
    { url: `${BASE_URL}/terms`,    changeFrequency: "yearly",  priority: 0.3,  lastModified: now },
    { url: `${BASE_URL}/privacy`,  changeFrequency: "yearly",  priority: 0.3,  lastModified: now },
  ];

  // 이벤트 상세 페이지 — 큐레이션된 이벤트만 (approved 상태)
  let eventRoutes: MetadataRoute.Sitemap = [];
  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasEnv) return staticRoutes;

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("events")
      .select("slug, updated_at")
      .eq("country", "KR")
      .or("status.is.null,status.eq.approved");

    eventRoutes = (data ?? []).map((e) => ({
      url: `${BASE_URL}/events/${e.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      lastModified: e.updated_at ? new Date(e.updated_at) : now,
    }));
  } catch {
    /* fail-soft: 정적 라우트만 반환 */
  }

  return [...staticRoutes, ...eventRoutes];
}
