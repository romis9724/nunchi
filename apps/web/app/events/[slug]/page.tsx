import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PageHeader, Card, Button, Chip } from "@/components/ui";
import { findEventBySlug } from "@/lib/repositories/events.repo";
import { toneToGrade } from "@noonchi/shared";
import type { EventRecord } from "@noonchi/shared";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

async function fetchEvent(slug: string): Promise<EventRecord | null> {
  try {
    return await findEventBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEvent(slug);
  if (!event) return { title: "사건을 찾을 수 없습니다" };

  const title = `${event.month}월 ${event.day ?? ""}일 — ${event.name}`;
  const description = `${event.name} · ${event.summary?.slice(0, 140) ?? ""}`;
  const canonical = `https://nunchi-bay.vercel.app/events/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const RISK_LABEL: Record<string, string> = {
  critical: "극도 위험",
  high: "고위험",
  medium: "중간 위험",
  low: "낮음",
};

const CATEGORY_LABEL: Record<string, string> = {
  memorial: "추모일",
  political: "정치 사건",
  social: "사회 사건",
  disaster: "재난·사고",
  cultural: "문화 기념일",
  labor: "노동 기념일",
  economic: "경제 사건",
  celebration: "축제·기념일",
  commercial: "상업 이벤트",
  independence: "독립·민주화",
  human_rights: "인권",
  massacre: "학살·비극",
};

const TONE_LABEL: Record<string, string> = {
  avoid: "회피 권고",
  memorial: "추모 톤 권장",
  neutral: "중립 톤 권장",
  celebration: "축하 톤 권장",
};

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await fetchEvent(slug);
  if (!event) notFound();

  const grade = toneToGrade(event.recommended_tone, event.risk_level);
  const dateLabel = `${event.month}월 ${event.day ?? ""}일`;
  const checkUrl = `/check?date=2027-${String(event.month).padStart(2, "0")}-${String(event.day ?? 1).padStart(2, "0")}`;

  // Schema.org Event 구조화 데이터
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.summary,
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: "대한민국" },
    isAccessibleForFree: true,
    organizer: { "@type": "Organization", name: "noonch-i", url: "https://nunchi-bay.vercel.app" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-body)" }}>
      <AppHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <Link href="/events" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontSize: "13px", color: "var(--ms-text-2)",
          textDecoration: "none", marginBottom: "20px",
        }}>
          ← 리스크 라이브러리
        </Link>

        <PageHeader
          eyebrow={`${dateLabel} · ${CATEGORY_LABEL[event.category] ?? event.category}`}
          eyebrowIcon="calendar"
          title={event.name}
          subtitle={event.name_en ?? undefined}
          actions={<Chip grade={grade} size="md">{grade}</Chip>}
        />

        {/* 메타 정보 */}
        <Card padding="lg" tone="soft" style={{ marginBottom: "20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "16px",
          }}>
            {[
              { label: "위험도", value: RISK_LABEL[event.risk_level] ?? event.risk_level },
              { label: "권장 톤", value: TONE_LABEL[event.recommended_tone] ?? event.recommended_tone },
              { label: "카테고리", value: CATEGORY_LABEL[event.category] ?? event.category },
            ].map((m) => (
              <div key={m.label}>
                <div style={{
                  fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "var(--ms-text-3)", marginBottom: "4px",
                }}>{m.label}</div>
                <div style={{
                  fontSize: "14px", fontWeight: 600, color: "var(--ms-text)",
                }}>{m.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 요약 */}
        <section style={{ marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "13px", fontWeight: 800,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--ms-text-2)", margin: "0 0 10px",
          }}>요약</h2>
          <p style={{
            fontSize: "15.5px", color: "var(--ms-text)",
            lineHeight: 1.75, margin: 0,
          }}>
            {event.summary}
          </p>
        </section>

        {/* 위험 키워드 */}
        {event.related_keywords && event.related_keywords.length > 0 && (
          <section style={{ marginBottom: "24px" }}>
            <h2 style={{
              fontSize: "13px", fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--ms-text-2)", margin: "0 0 10px",
            }}>주의 키워드</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {event.related_keywords.map((k) => (
                <Chip key={k} tone="red" size="sm">{k}</Chip>
              ))}
            </div>
          </section>
        )}

        {/* 시각 모티프 */}
        {event.related_motifs && event.related_motifs.length > 0 && (
          <section style={{ marginBottom: "24px" }}>
            <h2 style={{
              fontSize: "13px", fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--ms-text-2)", margin: "0 0 10px",
            }}>주의 시각 모티프</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {event.related_motifs.map((m) => (
                <Chip key={m} tone="amber" size="sm">{m}</Chip>
              ))}
            </div>
          </section>
        )}

        {/* 참고 자료 */}
        {event.references && event.references.length > 0 && (
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "13px", fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--ms-text-2)", margin: "0 0 10px",
            }}>출처·참고 자료</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {event.references.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      fontSize: "13.5px", color: "var(--brand-red)",
                      textDecoration: "none", fontWeight: 600,
                    }}
                  >
                    {r.label} <span style={{ fontSize: "12px" }}>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA — 이 날짜에 캠페인 검토 */}
        <Card padding="lg" tone="red" style={{ marginTop: "24px" }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "17px", fontWeight: 800,
            color: "var(--ms-text)", margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}>
            이 날짜로 캠페인을 기획 중이신가요?
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--ms-text-2)", margin: "0 0 16px", lineHeight: 1.65 }}>
            카피·시각 키워드를 입력하면 AI가 이 사건과의 충돌 여부를 5초에 분석해 드립니다.
          </p>
          <Button href={checkUrl} variant="primary" size="md" iconRight="arrow-right">
            지금 무료로 검토하기
          </Button>
        </Card>
      </main>
    </div>
  );
}
