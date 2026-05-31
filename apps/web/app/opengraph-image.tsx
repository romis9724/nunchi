import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "noonch-i — 캠페인 날짜 리스크 & 호재 검증";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 55%, #FFF1F2 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          fontFamily: "system-ui, -apple-system",
          position: "relative",
        }}
      >
        {/* 우상단 빨강 글로우 */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 540,
            height: 540,
            background: "radial-gradient(circle, rgba(225,29,72,0.25) 0%, rgba(255,255,255,0) 70%)",
            borderRadius: "50%",
            display: "flex",
          }}
        />

        {/* 상단: 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, zIndex: 1 }}>
          <span
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: "#0F172A",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            noonch
            <span
              style={{
                width: 14,
                height: 14,
                background: "#E11D48",
                borderRadius: "50%",
                display: "flex",
                marginTop: -4,
              }}
            />
            i
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#E11D48",
              background: "rgba(225,29,72,0.10)",
              border: "1px solid rgba(225,29,72,0.28)",
              padding: "3px 10px",
              borderRadius: 4,
              display: "flex",
            }}
          >
            BETA
          </span>
        </div>

        {/* 중간: 헤드라인 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 18,
              fontWeight: 700,
              color: "#E11D48",
              background: "rgba(225,29,72,0.08)",
              border: "1px solid rgba(225,29,72,0.28)",
              padding: "8px 18px",
              borderRadius: 999,
              alignSelf: "flex-start",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E11D48", display: "flex" }} />
            브랜드 안전 · 날짜 리스크 분석
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: "#0F172A",
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ display: "flex" }}>
              광고 사고는&nbsp;
              <span style={{ color: "#E11D48", display: "flex" }}>출시 전</span>에
            </span>
            <span style={{ display: "flex" }}>막아야 합니다.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#475569",
              lineHeight: 1.5,
              maxWidth: 920,
              display: "flex",
            }}
          >
            한국 역사 60+ 사건과 교차 검토 · F부터 A까지 5단계 등급
          </div>
        </div>

        {/* 하단: URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 20, color: "#475569", fontWeight: 600 }}>
            nunchi-bay.vercel.app
          </span>
          <span style={{ display: "flex", gap: 16 }}>
            {(["F", "D", "C", "B", "A"] as const).map((g) => {
              const colors: Record<string, [string, string]> = {
                F: ["#C50F1F", "#FDE7E9"],
                D: ["#BC4B09", "#FFF4CE"],
                C: ["#605E5C", "#F3F2F1"],
                B: ["#107C10", "#DFF6DD"],
                A: ["#0078D4", "#EFF6FC"],
              };
              return (
                <span
                  key={g}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: colors[g][1],
                    color: colors[g][0],
                    fontSize: 22,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {g}
                </span>
              );
            })}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
