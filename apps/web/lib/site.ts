/**
 * 사이트 공개 URL 단일 출처.
 * 메타데이터·canonical·robots·sitemap·OG 이미지가 모두 이 값을 쓴다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://nunch-i.com"
).replace(/\/$/, "");

/** OG 이미지 등 표시용 호스트명 (예: nunch-i.com) */
export const SITE_HOST = new URL(SITE_URL).host;
