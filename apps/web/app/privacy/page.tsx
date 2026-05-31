import { AppHeader } from "@/components/AppHeader";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)" }}>
      <AppHeader />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "8px" }}>개인정보처리방침</h1>
        <p style={{ color: "var(--muted-ink)", fontSize: "13px", marginBottom: "40px" }}>최종 업데이트: 2026년 5월 31일</p>

        {[
          { title: "1. 수집하는 개인정보", content: "서비스 이용을 위해 Google 로그인 시 이메일 주소와 프로필 정보(이름, 프로필 사진)를 수집합니다. 캠페인 검토 시 입력된 날짜, 카피, 키워드는 검토 품질 향상을 위해 암호화된 형태로 저장됩니다." },
          { title: "2. 개인정보 이용 목적", content: "수집된 정보는 서비스 제공, 맞춤형 검토 결과 생성, 서비스 개선에만 사용됩니다. 제3자에게 판매하거나 마케팅 목적으로 사용하지 않습니다." },
          { title: "3. 개인정보 보관 기간", content: "서비스 탈퇴 시 30일 이내 모든 개인정보를 삭제합니다. 단, 관계 법령에 따라 보관이 필요한 정보는 해당 기간 동안 보관합니다." },
          { title: "4. 개인정보 보호 조치", content: "모든 데이터는 암호화된 채널(HTTPS)을 통해 전송되며 Supabase(SOC 2 Type II 인증)에 안전하게 저장됩니다. 내부 임직원만 최소 권한으로 접근 가능합니다." },
          { title: "5. 문의", content: "개인정보 관련 문의는 /contact 페이지를 통해 접수해 주세요." },
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
