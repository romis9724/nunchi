import { AppHeader } from "@/components/AppHeader";

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)" }}>
      <AppHeader />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "8px" }}>이용약관</h1>
        <p style={{ color: "var(--muted-ink)", fontSize: "13px", marginBottom: "40px" }}>최종 업데이트: 2026년 5월 31일</p>

        {[
          { title: "1. 서비스 목적", content: "눈치(Nunchi)는 마케팅 캠페인의 날짜별 사회·역사적 리스크를 사전 검토하는 참고용 서비스입니다. 본 서비스의 결과는 AI 분석에 기반하며, 최종 캠페인 결정은 이용자의 판단과 책임 하에 이루어집니다." },
          { title: "2. 베타 서비스 안내", content: "현재 베타 서비스로 운영 중이며, 기능이 예고 없이 변경되거나 서비스가 일시 중단될 수 있습니다. 베타 기간 동안은 무료로 제공되며, 정식 출시 시 요금제가 도입될 수 있습니다." },
          { title: "3. 금지 사항", content: "본 서비스를 통해 얻은 분석 결과를 무단으로 재판매하거나, 서비스를 자동화·크롤링하거나, 타인에게 해를 끼치는 목적으로 사용하는 것을 금지합니다." },
          { title: "4. 면책 조항", content: "눈치의 검토 결과는 참고 정보로만 제공됩니다. 해당 결과를 바탕으로 실행된 캠페인에 대해 눈치는 법적 책임을 지지 않습니다. 이용자는 자체적으로 전문가 검토를 병행하는 것을 권장합니다." },
          { title: "5. 약관 변경", content: "약관이 변경되는 경우 서비스 내 공지를 통해 사전 안내합니다. 변경 후 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 간주합니다." },
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
