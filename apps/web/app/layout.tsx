import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { FeedbackWidget } from "../components/FeedbackWidget";
import { GlobalFooter } from "../components/GlobalFooter";
import { Providers } from "../components/Providers";
import { SITE_URL } from "../lib/site";
import { CURATED_EVENT_COUNT } from "@noonchi/shared";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "noonch-i — 캠페인 날짜 리스크 & 호재 검증",
    template: "%s · noonch-i",
  },
  description: `마케터를 위한 캠페인 사전 검토. 날짜와 카피를 한국 사건·기념일 ${CURATED_EVENT_COUNT}건과 교차 검토해 F~A 5단계 등급과 근거를 제시합니다.`,
  keywords: [
    "캠페인 검토", "브랜드 안전", "마케팅 날짜", "민감일 캘린더",
    "광고 리스크", "한국 마케팅", "브랜드 캘린더", "AI 캠페인 검토",
    "noonch-i", "눈치",
  ],
  authors: [{ name: "noonch-i" }],
  creator: "noonch-i",
  publisher: "noonch-i",
  applicationName: "noonch-i",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "noonch-i",
    title: "noonch-i — 캠페인 날짜 리스크 & 호재 검증",
    description: `한국 마케터를 위한 캠페인 사전 검토. 날짜와 카피를 한국 사건·기념일 ${CURATED_EVENT_COUNT}건과 교차 검토합니다.`,
  },
  twitter: {
    card: "summary_large_image",
    title: "noonch-i — 캠페인 날짜 리스크 & 호재 검증",
    description: `날짜와 카피를 한국 사건·기념일 ${CURATED_EVENT_COUNT}건과 교차 검토. F~A 5단계 등급과 근거를 제시합니다.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${interTight.variable}`}>
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* TODO: Google Analytics 추가 예정 */}
      </head>
      <body className="min-h-screen">
        <Providers>
          {children}
          <GlobalFooter />
          <FeedbackWidget />
        </Providers>
      </body>
    </html>
  );
}
