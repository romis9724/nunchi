"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NunchiLogo } from "@/components/NunchiLogo";

const INDUSTRIES = [
  "식품·음료", "패션·뷰티", "IT·테크", "금융·보험", "유통·리테일",
  "자동차", "의료·헬스케어", "교육", "엔터테인먼트", "여행·호텔",
  "공공·정부", "부동산", "에너지", "기타",
];

const CHANNELS = [
  "인스타그램", "유튜브", "트위터·X", "페이스북", "카카오",
  "네이버 블로그", "틱톡", "이메일 뉴스레터", "오프라인 이벤트", "OOH 광고",
];

interface Profile {
  industries: string[];
  channels: string[];
  company: string | null;
  brand: string | null;
  product_name: string | null;
}

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setSelectedIndustries(data.industries ?? []);
        setSelectedChannels(data.channels ?? []);
        setCompany(data.company ?? "");
        setBrand(data.brand ?? "");
        setProductName(data.product_name ?? "");
      })
      .catch(() => {});
  }, []);

  function toggle(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIndustries.length === 0 || selectedChannels.length === 0) {
      setError("업종과 채널을 각각 1개 이상 선택해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industries: selectedIndustries,
        channels: selectedChannels,
        company: company || null,
        brand: brand || null,
        product_name: productName || null,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "저장 중 오류가 발생했습니다.");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  if (!profile) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rice-paper, #F8F7F4)" }}>
        <p style={{ color: "var(--muted-ink)" }}>불러오는 중…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--rice-paper, #F8F7F4)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <NunchiLogo size={28} />
          <Link href="/check" style={{ fontSize: "13px", color: "var(--muted-ink)", textDecoration: "none" }}>← 검토로 돌아가기</Link>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "24px" }}>
          내 정보 수정
        </h1>

        <form onSubmit={handleSave}>
          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--charcoal)", marginBottom: "12px" }}>업종 <span style={{ color: "#E53935" }}>*</span></h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {INDUSTRIES.map((ind) => (
                <button key={ind} type="button" onClick={() => toggle(selectedIndustries, ind, setSelectedIndustries)}
                  style={{ padding: "7px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    border: selectedIndustries.includes(ind) ? "1.5px solid var(--ms-blue, #2563EB)" : "1.5px solid var(--border-warm)",
                    background: selectedIndustries.includes(ind) ? "var(--ms-blue-light, #EFF6FF)" : "#fff",
                    color: selectedIndustries.includes(ind) ? "var(--ms-blue, #2563EB)" : "var(--charcoal)", transition: "all 0.1s" }}
                >{ind}</button>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--charcoal)", marginBottom: "12px" }}>채널 <span style={{ color: "#E53935" }}>*</span></h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CHANNELS.map((ch) => (
                <button key={ch} type="button" onClick={() => toggle(selectedChannels, ch, setSelectedChannels)}
                  style={{ padding: "7px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    border: selectedChannels.includes(ch) ? "1.5px solid var(--ms-blue, #2563EB)" : "1.5px solid var(--border-warm)",
                    background: selectedChannels.includes(ch) ? "var(--ms-blue-light, #EFF6FF)" : "#fff",
                    color: selectedChannels.includes(ch) ? "var(--ms-blue, #2563EB)" : "var(--charcoal)", transition: "all 0.1s" }}
                >{ch}</button>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: "32px", padding: "20px", background: "#fff", borderRadius: "12px", border: "1px solid var(--border-warm)" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--charcoal)", marginBottom: "16px" }}>브랜드 정보 <span style={{ color: "var(--muted-ink)", fontWeight: 400 }}>(선택사항)</span></h2>
            {[
              { label: "회사명", value: company, setter: setCompany },
              { label: "브랜드명", value: brand, setter: setBrand },
              { label: "제품·서비스명", value: productName, setter: setProductName },
            ].map(({ label, value, setter }) => (
              <div key={label} style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted-ink)", marginBottom: "4px" }}>{label}</label>
                <input type="text" value={value} onChange={(e) => setter(e.target.value)}
                  placeholder={label + " (선택)"}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border-warm)", borderRadius: "8px", fontSize: "14px", color: "var(--charcoal)", background: "#FAFAF8", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </section>

          {error && <p style={{ color: "#E53935", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
          {saved && <p style={{ color: "#16A34A", fontSize: "13px", marginBottom: "16px" }}>저장됐습니다.</p>}

          <button type="submit" disabled={saving}
            style={{ width: "100%", padding: "14px", background: "var(--charcoal)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
