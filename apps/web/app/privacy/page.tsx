import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "noonch-i 서비스의 개인정보 수집·이용·보관·삭제에 관한 정책",
  alternates: { canonical: "https://nunchi-bay.vercel.app/privacy" },
};

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보",
    content: "(가) Google 로그인 시 이메일 주소와 이름을 수집합니다(프로필 사진은 저장하지 않습니다).\n(나) 캠페인 검토 시 입력된 날짜·캠페인명·카피·시각 키워드는 동일 입력에 대한 응답 속도 향상(캐싱) 목적으로 서버에 저장됩니다.\n(다) 온보딩 시 입력하신 업종·채널·회사명·브랜드명·제품명은 검토 결과 맞춤화에 사용됩니다.\n(라) 문의 폼 제출 시 이름·이메일·메시지가 저장됩니다.\n(마) 자동으로 수집되는 기술 정보: IP 주소, 브라우저 종류, 접속 시간, 페이지뷰(Plausible Analytics는 쿠키를 사용하지 않으며 개인 식별이 불가능한 집계 데이터만 수집합니다).",
  },
  {
    title: "2. 데이터 저장 방식",
    content: "(가) 모든 데이터는 Supabase(PostgreSQL, SOC 2 Type II 인증) 데이터베이스에 저장됩니다.\n(나) 전송 구간은 TLS 1.3 HTTPS로 암호화됩니다.\n(다) 저장 데이터는 Supabase 인프라의 디스크 암호화(AES-256)가 적용됩니다.\n(라) 캠페인 카피 등 검토 입력값은 애플리케이션 수준에서 별도 암호화 없이 평문으로 저장됩니다. 민감한 캠페인 정보(미공개 신제품 등)는 공개 전 검토 도구로만 사용하실 것을 권장합니다.",
  },
  {
    title: "3. 외부 AI 서비스 전송",
    content: "(가) 캠페인 검토 시 입력하신 날짜·카피·시각 키워드는 Google Gemini API에 전송되어 분석됩니다.\n(나) Google의 데이터 처리 정책에 따라 해당 데이터는 모델 학습에 사용되지 않습니다(Gemini API 무료/유료 tier 모두 동일).\n(다) 회사명·브랜드명·제품명은 외부 LLM에 전송되지 않으며, 사용자 본인의 검토 결과 표시에만 사용됩니다.",
  },
  {
    title: "4. 개인정보 이용 목적",
    content: "수집된 정보는 다음 목적으로만 사용됩니다.\n(가) 서비스 제공 및 인증\n(나) 맞춤형 검토 결과 생성\n(다) 서비스 품질 개선 및 버그 추적\n(라) 문의 응답 및 고객 지원\n\n제3자에게 판매하거나 광고 마케팅 목적으로 사용하지 않습니다.",
  },
  {
    title: "5. 개인정보 보관 및 삭제 요청",
    content: "(가) 회원 탈퇴 또는 개인정보 삭제 요청 시 30일 이내에 모든 개인 식별 정보를 삭제합니다.\n(나) 단, 관계 법령(전자상거래법, 통신비밀보호법 등)에 따라 보관 의무가 있는 정보는 해당 기간 동안 별도 분리 보관합니다.\n(다) 삭제 요청은 문의하기 페이지를 통해 접수 가능합니다.",
  },
  {
    title: "6. 개인정보 보호 조치",
    content: "(가) 데이터베이스는 Row Level Security(RLS) 정책을 통해 본인 데이터에만 접근 가능하도록 제한됩니다.\n(나) 관리자 계정만 전체 데이터에 접근할 수 있으며, 관리자 접근 시 모든 조회 행위가 감사 로그로 기록됩니다.\n(다) 서비스 키·API 키 등 인증 정보는 환경 변수로 관리되며 소스 코드에 포함되지 않습니다.\n(라) 모든 통신은 HTTPS만 허용되며 HTTP 요청은 자동으로 리다이렉트됩니다.",
  },
  {
    title: "7. 쿠키 사용",
    content: "(가) 본 서비스는 인증 유지를 위한 필수 쿠키만 사용합니다(Supabase Auth 세션 쿠키).\n(나) 마케팅·광고 추적용 쿠키는 사용하지 않습니다.\n(다) Plausible Analytics는 쿠키를 사용하지 않는 privacy-friendly 분석 도구로 GDPR/PIPL/CCPA 준수합니다.",
  },
  {
    title: "8. 권리와 행사 방법",
    content: "이용자는 다음 권리를 가집니다.\n(가) 개인정보 열람 요청\n(나) 정정·삭제 요청\n(다) 처리 정지 요청\n(라) 자료 이전(데이터 포터빌리티) 요청\n\n위 권리 행사는 문의하기 페이지를 통해 가능하며, 본인 확인 후 14일 이내에 응답합니다.",
  },
  {
    title: "9. 정책 변경",
    content: "본 처리방침이 변경될 경우 서비스 공지사항을 통해 최소 7일 전(중대한 변경은 30일 전) 사전 고지합니다.",
  },
  {
    title: "10. 문의처",
    content: "개인정보 관련 모든 문의와 권리 행사 요청은 문의하기 페이지를 이용해 주세요.\n응답 평일 1-2영업일 소요.",
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
          subtitle="최종 업데이트: 2026년 6월 1일"
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
