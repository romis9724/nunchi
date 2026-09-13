import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { PageHeader } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "nunch-i 서비스의 개인정보 수집·이용·전송·보관과 권리 행사 방법 안내",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

// TODO(legal): 변호사 검토 필요 — 보유기간·위탁·국외이전·면책

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보",
    content: "(가) Google 로그인 시 계정 식별자, 이메일 주소, 이름, 프로필 사진 URL을 저장합니다.\n(나) 캠페인 검토 시 입력한 날짜·캠페인명·카피·시각 키워드는 검토 결과와 함께 저장됩니다.\n(다) 온보딩에서 선택한 업종·채널은 맞춤 코멘트 생성에 사용합니다. 선택 입력하신 회사명·브랜드명·제품명은 프로필에 저장됩니다.\n(라) 문의 폼 제출 시 이름·이메일·문의 내용이 저장됩니다.\n(마) 피드백 위젯으로 보내신 유형·내용이 저장됩니다.\n(바) 서비스 운영을 위해 호스팅 환경의 접속 기록이 남을 수 있습니다.",
  },
  {
    title: "2. 데이터 저장 방식",
    content: "(가) 데이터는 PostgreSQL 데이터베이스에 저장됩니다.\n(나) 캠페인 카피 등 검토 입력값은 애플리케이션 수준의 별도 암호화 없이 저장됩니다.\n(다) 미공개 신제품 정보 등 대외비 내용은 입력을 피해 주세요.",
  },
  {
    title: "3. AI 분석 서버 전송",
    content: "(가) AI 분석이 필요한 경우 날짜·캠페인명·카피·시각 키워드를 자체 운영 분석 서버로 전송합니다.\n(나) 현재 분석 서버 전송 구간에는 HTTPS 암호화가 적용되어 있지 않습니다.\n(다) 외부 AI 서비스를 사용하는 경우 공급자와 처리 조건을 별도로 고지합니다.\n(라) 프로필의 회사명·브랜드명·제품명은 AI 요청에 포함하지 않습니다. 다만 검토 입력에 직접 적은 내용은 전송될 수 있습니다.",
  },
  {
    title: "4. 개인정보 이용 목적",
    content: "수집된 정보는 다음 목적으로만 사용됩니다.\n(가) 서비스 제공 및 인증\n(나) 맞춤형 검토 코멘트 생성\n(다) 서비스 품질 개선 및 오류 추적\n(라) 문의 응답 및 고객 지원\n\n제3자에게 판매하거나 광고 마케팅 목적으로 사용하지 않습니다.",
  },
  {
    title: "5. 개인정보 보관 및 삭제 요청",
    content: "(가) 검토 입력·결과의 캐시 유효기간은 7일이며, 유효기간 만료가 원문의 자동 삭제를 뜻하지는 않습니다.\n(나) 개인정보 삭제 요청은 문의하기 페이지로 접수하며, 접수 후 처리합니다.\n(다) 관계 법령에 따라 보관 의무가 있는 정보는 해당 기간 동안 별도 보관합니다.",
  },
  {
    title: "6. 개인정보 보호 조치",
    content: "(가) 관리자 기능은 로그인과 관리자 권한 확인을 거쳐 접근합니다.\n(나) 서비스 키·API 키 등 인증 정보는 환경 변수로 관리되며 소스 코드에 포함되지 않습니다.",
  },
  {
    title: "7. 쿠키 사용",
    content: "(가) Google 로그인과 로그인 상태 유지를 위한 인증용 쿠키만 사용합니다.\n(나) 광고·추적 쿠키는 사용하지 않습니다.",
  },
  {
    title: "8. 권리와 행사 방법",
    content: "이용자는 다음 권리를 가집니다.\n(가) 개인정보 열람 요청\n(나) 정정·삭제 요청\n(다) 처리 정지 요청\n(라) 자료 이전(데이터 포터빌리티) 요청\n\n위 권리 행사는 문의하기 페이지를 통해 접수하며, 본인 확인 후 처리합니다.",
  },
  {
    title: "9. 정책 변경",
    content: "본 처리방침이 변경될 경우 서비스 내 공지를 통해 사전 안내합니다.",
  },
  {
    title: "10. 문의처",
    content: "개인정보 관련 모든 문의와 권리 행사 요청은 문의하기 페이지를 이용해 주세요.\n접수한 문의는 이메일로 답변드립니다.",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-body)" }}>
      <AppHeader />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <PageHeader
          eyebrow="법적 고지"
          eyebrowIcon="lock"
          title="개인정보처리방침"
          subtitle="최종 업데이트: 2026년 9월 13일"
        />
        {SECTIONS.map(({ title, content }) => (
          <section key={title} style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "17px", fontWeight: 800,
              color: "var(--ms-text)", letterSpacing: "-0.01em",
              margin: "0 0 12px",
            }}>{title}</h2>
            <p style={{
              fontSize: "14px", color: "var(--ms-text-2)",
              lineHeight: 1.85, margin: 0,
              whiteSpace: "pre-wrap",
            }}>{content}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
