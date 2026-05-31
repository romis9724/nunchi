"use client";

import { useState } from "react";
import type { CheckResponse, Grade } from "@nunchi/shared";
import { GRADE_LABEL, toneToGrade } from "@nunchi/shared";
import { GradeBadge } from "./GradeBadge";

interface ResultCardProps {
  result: CheckResponse;
  date: string;
  campaignName?: string;
}

const GRADE_ACCENT: Record<Grade, string> = {
  F: "var(--grade-f-border)",
  D: "var(--grade-d-border)",
  C: "var(--grade-c-border)",
  B: "var(--grade-b-border)",
  A: "var(--grade-a-border)",
};

const GRADE_BG: Record<Grade, string> = {
  F: "var(--grade-f-bg)",
  D: "var(--grade-d-bg)",
  C: "#ffffff",
  B: "var(--grade-b-bg)",
  A: "var(--grade-a-bg)",
};

export function ResultCard({ result, date, campaignName }: ResultCardProps) {
  const [memo, setMemo] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`nunchi-memo-${date}`) ?? "";
  });

  const handleMemoChange = (v: string) => {
    setMemo(v);
    localStorage.setItem(`nunchi-memo-${date}`, v);
  };

  const grade = result.grade;
  const isPositive = grade === "A" || grade === "B";
  const isNegative = grade === "F" || grade === "D";

  return (
    <div
      style={{
        background: GRADE_BG[grade],
        border: `1px solid var(--border-warm)`,
        borderLeft: `4px solid ${GRADE_ACCENT[grade]}`,
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: "var(--font-body)",
      }}
      role="region"
      aria-label="캠페인 검토 결과"
    >
      {/* Header strip */}
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "12px", color: "var(--muted-ink)", marginBottom: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span>{date}</span>
            {campaignName && <span>· {campaignName}</span>}
            {result.cached && <span style={{ opacity: 0.5 }}>· 캐시</span>}
            {result.ruleTriggered && (
              <span style={{ color: "var(--grade-f-text)", fontWeight: 600 }}>⚡ 즉시 감지</span>
            )}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <GradeBadge grade={grade} size="lg" showLabel />
            <p style={{ fontSize: "13px", color: "var(--muted-ink)", margin: 0 }}>
              {isPositive ? "이 날짜, 캠페인에 유리합니다" : isNegative ? "재검토를 권고합니다" : "특이사항 없음"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--border-warm)", margin: "0 20px" }} />

      {/* Rationale */}
      <div style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
          {isPositive ? "호재 이유" : "분석 근거"}
        </p>
        <p style={{ fontSize: "14px", color: "var(--charcoal)", lineHeight: 1.7, margin: 0 }}>
          {result.rationale}
        </p>
      </div>

      {/* Flagged keywords */}
      {result.flaggedKeywords.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            감지된 위험 단어
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {result.flaggedKeywords.map((kw) => (
              <span
                key={kw}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--grade-f-text)",
                  background: "var(--grade-f-bg)",
                  border: "1px solid var(--grade-f-border)",
                  padding: "3px 10px",
                  borderRadius: "100px",
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matched events */}
      {result.matchedEvents.length > 0 && (
        <>
          <div style={{ height: "1px", background: "var(--border-warm)", margin: "0 20px" }} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
              {isPositive ? "연관 기념일" : "관련 사건"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.matchedEvents.map((event) => {
                const evGrade = event.grade ?? toneToGrade(event.recommendedTone, event.riskLevel);
                return (
                  <div
                    key={event.id}
                    className="studio-card"
                    style={{ padding: "14px 16px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <GradeBadge grade={evGrade} size="xs" showLabel={false} />
                      <span style={{ fontWeight: 600, fontSize: "13px", fontFamily: "var(--font-display)" }}>
                        {event.name}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--muted-ink)", lineHeight: 1.6, margin: "0 0 8px" }}>
                      {event.summary}
                    </p>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {event.references.slice(0, 2).map((ref) => (
                        <a
                          key={ref.url}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "11px", color: "#5A72E0", textDecoration: "underline", textUnderlineOffset: "2px" }}
                        >
                          {ref.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <>
          <div style={{ height: "1px", background: "var(--border-warm)", margin: "0 20px" }} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
              {isPositive ? "활용 아이디어" : "대안 제안"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "var(--warm-white)",
                    border: "1px solid var(--border-warm)",
                    borderRadius: "10px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--muted-ink)", marginTop: "2px", minWidth: "20px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: "13px", color: "var(--charcoal)", lineHeight: 1.65, margin: 0 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 맞춤 코멘트 — 로그인 사용자 + onboarding 완료 시만 표시 */}
      {result.personalizedComment && (
        <>
          <div style={{ height: "1px", background: "var(--border-warm)", margin: "0 20px" }} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ms-blue, #2563EB)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              맞춤 코멘트
            </p>
            <p style={{ fontSize: "13px", color: "var(--charcoal)", lineHeight: 1.7, margin: 0, padding: "12px 14px", background: "var(--ms-blue-light, #EFF6FF)", borderRadius: "8px", border: "1px solid var(--ms-blue-mid, #BFDBFE)" }}>
              {result.personalizedComment}
            </p>
          </div>
        </>
      )}

      {/* Memo */}
      <div style={{ height: "1px", background: "var(--border-warm)", margin: "0 20px" }} />
      <div style={{ padding: "16px 20px" }}>
        <label
          htmlFor="result-memo"
          style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-ink)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}
        >
          메모
        </label>
        <textarea
          id="result-memo"
          value={memo}
          onChange={(e) => handleMemoChange(e.target.value)}
          placeholder="팀 공유용 메모, 결정 근거를 기록하세요…"
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "1px solid var(--border-warm)",
            borderRadius: "10px",
            background: "var(--warm-white)",
            fontSize: "13px",
            color: "var(--charcoal)",
            resize: "none",
            outline: "none",
            fontFamily: "var(--font-body)",
            lineHeight: 1.6,
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--muted-ink)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-warm)")}
        />
        <p style={{ fontSize: "11px", color: "var(--muted-ink)", marginTop: "6px" }}>
          메모는 이 기기에만 저장됩니다.
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ fontSize: "11px", color: "var(--muted-ink)", background: "var(--warm-white)", border: "1px solid var(--border-faint)", borderRadius: "8px", padding: "10px 14px", margin: 0, lineHeight: 1.6 }}>
          ⓘ 이 검토 결과는 참고용입니다. 최종 캠페인 결정은 귀하의 판단과 책임 하에 이루어집니다.
        </p>
      </div>
    </div>
  );
}
