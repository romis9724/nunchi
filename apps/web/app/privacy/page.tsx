import { AppHeader } from "@/components/AppHeader";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)" }}>
      <AppHeader />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "8px" }}>개인정보처리방침</h1>
        <p style={{ color: "var(--muted-ink)", fontSize: "13px", marginBottom: "40px" }}>최종 업데이트: 2026년 5월 31일</p>

        {[
          {
            title: "1. 수집하는 개인정보",
            content: "Google 로그인 시 이메일 주소와 이름을 수집합니다(프로필 사진은 저장하지 않습니다). 캠페인 검토 시 입력된 날짜·카피·키워드는 동일 입력에 대한 응답 속도 향상(캐싱) 목적으로 서버에 저장됩니다. 문의 폼 제출 시 이름·이메일·메시지가 저장됩니다.",
          },
          {
            title: "2. 데이터 저장 방식",
            content: "모든 데이터는 Supabase(PostgreSQL, SOC 2 Type II 인증) 데이터베이스에 저장됩니다. 전송 구간은 HTTPS로 암호화되며, 저장 데이터는 Supabase 인프라의 디스크 암호화(AES-256)가 적용됩니다. 캠페인 카피 등 검토 입력값은 애플리케이션 수준에서 별도 암호화 없이 평문으로 저장됩니다. 민감한 캠페인 정보는 공개 전 검토 도구로만 사용하실 것을 권장합니다.",
          },
          {
            title: "3. 개인정보 이용 목적",
            content: "수집된 정보는 서비스 제공, 맞춤형 검토 결과 생성, 서비스 품질 개선에만 사용됩니다. 제3자에게 판매하거나 마케팅 목적으로 사용하지 않습니다.",
          },
          {
            title: "4. 개인정보 보관 및 삭제",
            content: "개인정보 삭제를 원하시면 문의하기 페이지를 통해 요청해 주세요. 요청 접수 후 30일 이내에 해당 정보를 삭제합니다. 관계 법령에 따라 보관이 필요한 정보는 해당 기간 동안 별도 보관합니다.",
          },
          {
            title: "5. 개인정보 보호 조치",
            content: "데이터베이스는 Row Level Security(RLS) 정책을 통해 본인 데이터에만 접근 가능하도록 제한됩니다. 관리자 계정만 전체 데이터에 접근할 수 있습니다. 서비스 키·API 키 등 인증 정보는 환경 변수로 관리되며 소스 코드에 포함되지 않습니다.",
          },
          {
            title: "6. 문의",
            content: "개인정보 관련 문의 및 삭제 요청은 문의하기 페이지를 이용해 주세요.",
          },
        ].map(({ title, content }) => (
          <section key={title} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--charcoal)", marginBottom: "8px" }}>{title}</h2>
            <p style={{ fontSize: "14px", color: "var(--muted-ink)", lineHeight: 1.8, margin: 0 }}>{content}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
