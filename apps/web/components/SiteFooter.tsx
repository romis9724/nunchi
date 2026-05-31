import Link from "next/link";
import { NoonchiLogo } from "./NoonchiLogo";

/**
 * SiteFooter — 모든 페이지 공통 푸터
 *
 * variants:
 *  - default(dark): 랜딩·마케팅용 다크 풀 푸터
 *  - compact: 앱 내부용 흰 배경 축소 푸터 (저작권 + 법적 링크만)
 */

interface SiteFooterProps {
  variant?: "default" | "compact";
}

const PRODUCT_LINKS = [
  { label: "캠페인 검토", href: "/check" },
  { label: "리스크 캘린더", href: "/calendar" },
  { label: "사건 인덱스", href: "/events" },
];

const COMPANY_LINKS = [
  { label: "문의하기", href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
];

export function SiteFooter({ variant = "default" }: SiteFooterProps) {
  if (variant === "compact") {
    return (
      <footer
        style={{
          borderTop: "1px solid var(--ms-border)",
          background: "#fff",
          padding: "24px 20px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12.5px",
            color: "var(--ms-text-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: 600 }}>© {new Date().getFullYear()} noonch-i</span>
            <span style={{ color: "var(--ms-text-3)" }}>·</span>
            <span>한국 마케터를 위한 브랜드 안전 인텔리전스</span>
          </div>
          <div style={{ display: "flex", gap: "18px" }}>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  color: "var(--ms-text-2)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  // default — dark full footer for landing
  return (
    <footer
      style={{
        background: "#0F0F11",
        color: "rgba(255,255,255,0.65)",
        padding: "56px 24px 32px",
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr repeat(3, 1fr)",
            gap: "40px",
            marginBottom: "40px",
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ marginBottom: "12px" }}>
              <NoonchiLogo size={26} color="#fff" />
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                margin: 0,
                maxWidth: "320px",
              }}
            >
              한국 마케터를 위한 브랜드 안전 인텔리전스.
              캠페인 출시 전, AI가 60+ 한국 민감일과 5초에 교차 검토합니다.
            </p>
          </div>

          {/* Product */}
          <div>
            <FooterColumnTitle>제품</FooterColumnTitle>
            <FooterLinks links={PRODUCT_LINKS} />
          </div>

          {/* Company */}
          <div>
            <FooterColumnTitle>회사</FooterColumnTitle>
            <FooterLinks links={COMPANY_LINKS} />
          </div>

          {/* Legal */}
          <div>
            <FooterColumnTitle>법적 고지</FooterColumnTitle>
            <FooterLinks links={LEGAL_LINKS} />
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <span>© {new Date().getFullYear()} noonch-i. All rights reserved.</span>
          <span style={{ display: "flex", gap: "16px" }}>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
              >
                {l.label}
              </Link>
            ))}
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
          .footer-grid > div:first-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </footer>
  );
}

function FooterColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.45)",
        marginBottom: "14px",
        fontFamily: "var(--font-display)",
      }}
    >
      {children}
    </div>
  );
}

function FooterLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            style={{
              fontSize: "13.5px",
              color: "rgba(255,255,255,0.75)",
              textDecoration: "none",
              transition: "color 0.12s",
            }}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
