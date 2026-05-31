"use client";

import { useState } from "react";
import Link from "next/link";
import type { CheckResponse, Grade } from "@noonchi/shared";
import { GRADE_LABEL, toneToGrade } from "@noonchi/shared";
import { GradeBadge } from "./GradeBadge";

interface ResultCardProps {
  result: CheckResponse;
  date: string;
  campaignName?: string;
}

/* ── Grade color tokens ─────────────────────────────────────── */
const GRADE_SCHEME: Record<Grade, {
  headerBg: string;
  headerBorder: string;
  accent: string;
  bodyBg: string;
  bodyBorder: string;
  textColor: string;
  tagBg: string;
  tagBorder: string;
}> = {
  F: {
    headerBg: "#FEE2E2",
    headerBorder: "#FCA5A5",
    accent: "#DC2626",
    bodyBg: "#FFF1F2",
    bodyBorder: "#FCA5A5",
    textColor: "#991B1B",
    tagBg: "#FEE2E2",
    tagBorder: "#FCA5A5",
  },
  D: {
    headerBg: "#FEF9C3",
    headerBorder: "#FCD34D",
    accent: "#D97706",
    bodyBg: "#FFFBEB",
    bodyBorder: "#FCD34D",
    textColor: "#92400E",
    tagBg: "#FEF9C3",
    tagBorder: "#FCD34D",
  },
  C: {
    headerBg: "#F3F2F1",
    headerBorder: "#E1DFDD",
    accent: "#6B7280",
    bodyBg: "#F8F8F8",
    bodyBorder: "#E5E7EB",
    textColor: "#374151",
    tagBg: "#F3F2F1",
    tagBorder: "#E1DFDD",
  },
  B: {
    headerBg: "#DCFCE7",
    headerBorder: "#86EFAC",
    accent: "#16A34A",
    bodyBg: "#F0FDF4",
    bodyBorder: "#86EFAC",
    textColor: "#14532D",
    tagBg: "#DCFCE7",
    tagBorder: "#86EFAC",
  },
  A: {
    headerBg: "#DBEAFE",
    headerBorder: "#93C5FD",
    accent: "#2563EB",
    bodyBg: "#EFF6FF",
    bodyBorder: "#93C5FD",
    textColor: "#1E3A8A",
    tagBg: "#DBEAFE",
    tagBorder: "#93C5FD",
  },
};

const GRADE_HEADLINE: Record<Grade, string> = {
  F: "즉각 회피 — 캠페인 재설계를 권고합니다",
  D: "재검토 필요 — 컨셉·카피를 수정하세요",
  C: "일반 주의 — 특이사항 없음",
  B: "안전 — 진행 가능합니다",
  A: "최적 타이밍 — 강력한 호재입니다",
};

/* ── Label ──────────────────────────────────────────────────── */
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--ms-text-3)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        margin: "0 0 10px",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/* ── Divider ────────────────────────────────────────────────── */
function Divider() {
  return (
    <div
      style={{
        height: "1px",
        background: "var(--ms-border)",
        margin: "0 20px",
      }}
    />
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export function ResultCard({ result, date, campaignName }: ResultCardProps) {
  const [memo, setMemo] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`noonchi-memo-${date}`) ?? "";
  });

  const handleMemoChange = (v: string) => {
    setMemo(v);
    localStorage.setItem(`noonchi-memo-${date}`, v);
  };

  const grade = result.grade;
  const scheme = GRADE_SCHEME[grade];
  const isPositive = grade === "A" || grade === "B";
  const isNegative = grade === "F" || grade === "D";

  return (
    <article
      style={{
        background: scheme.bodyBg,
        border: `1px solid ${scheme.bodyBorder}`,
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: "var(--font-body)",
      }}
      role="region"
      aria-label="캠페인 검토 결과"
    >

      {/* ── HEADER BANNER ─────────────────────────────────────── */}
      <header
        style={{
          background: scheme.headerBg,
          borderBottom: `2px solid ${scheme.accent}`,
          padding: "20px 20px 18px",
        }}
      >
        {/* Meta row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "var(--ms-text-3)",
              margin: 0,
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600 }}>{date}</span>
            {campaignName && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{campaignName}</span>
              </>
            )}
            {result.cached && (
              <span style={{ opacity: 0.45 }}>· 캐시</span>
            )}
            {result.ruleTriggered && (
              <span
                style={{
                  color: scheme.accent,
                  fontWeight: 700,
                  background: scheme.tagBg,
                  border: `1px solid ${scheme.tagBorder}`,
                  padding: "1px 7px",
                  borderRadius: "3px",
                  fontSize: "13px",
                  letterSpacing: "0.06em",
                }}
              >
                ⚡ 즉시 감지
              </span>
            )}
          </p>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid var(--ms-border)",
                background: "#fff",
                cursor: "pointer",
                color: "var(--ms-text-2)",
                fontWeight: 500,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  scheme.accent)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--ms-border)")
              }
            >
              ↑ 다시 검토
            </button>
            <button
              onClick={() => {
                const text = `[noonch-i 검토 결과] ${date} ${campaignName ?? ""}\n등급: ${result.grade} — ${GRADE_LABEL[result.grade]}\n${result.rationale}`;
                navigator.clipboard.writeText(text).catch(() => {});
              }}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid var(--ms-border)",
                background: "#fff",
                cursor: "pointer",
                color: "var(--ms-text-2)",
                fontWeight: 500,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  scheme.accent)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--ms-border)")
              }
            >
              복사
            </button>
          </div>
        </div>

        {/* Grade + headline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <GradeBadge grade={grade} size="lg" showLabel />
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: scheme.textColor,
              margin: 0,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
            }}
          >
            {GRADE_HEADLINE[grade]}
          </p>
        </div>
      </header>

      {/* ── RATIONALE ─────────────────────────────────────────── */}
      <div style={{ padding: "18px 20px" }}>
        <SectionLabel>{isPositive ? "호재 이유" : "분석 근거"}</SectionLabel>
        {result.transient ? (
          <div
            role="status"
            style={{
              background: "var(--grade-d-bg)",
              border: "1px solid var(--grade-d-border)",
              borderLeft: "3px solid var(--grade-d-text)",
              borderRadius: "10px",
              padding: "14px 16px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1, marginTop: "2px" }}>⚠️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: "13.5px", fontWeight: 700,
                color: "var(--grade-d-text)", margin: "0 0 4px",
              }}>
                AI 분석이 임시로 제한되었습니다
              </p>
              <p style={{
                fontSize: "13px", color: "var(--ms-text-2)",
                lineHeight: 1.65, margin: "0 0 8px",
              }}>
                현재 AI 모델 호출 한도에 도달했습니다. 잠시 후 다시 검토해 주세요.
                아래 <strong>관련 사건</strong> 정보는 정상적으로 표시됩니다.
              </p>
              <p style={{
                fontSize: "11.5px", color: "var(--ms-text-3)",
                margin: 0, lineHeight: 1.5,
              }}>
                * 등급(C)은 임시 분류이며 실제 위험도를 반영하지 않습니다.
              </p>
            </div>
          </div>
        ) : (
          <p
            style={{
              fontSize: "14px",
              color: "var(--ms-text)",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {result.rationale}
          </p>
        )}
      </div>

      {/* ── FLAGGED KEYWORDS ──────────────────────────────────── */}
      {result.flaggedKeywords.length > 0 && (
        <>
          <Divider />
          <div style={{ padding: "16px 20px" }}>
            <SectionLabel>감지된 위험 단어</SectionLabel>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {result.flaggedKeywords.map((kw) => (
                <span
                  key={kw}
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#DC2626",
                    background: "#FEE2E2",
                    border: "1px solid #FCA5A5",
                    padding: "3px 10px",
                    borderRadius: "3px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── MATCHED EVENTS ────────────────────────────────────── */}
      {result.matchedEvents.length > 0 && (
        <>
          <Divider />
          <div style={{ padding: "16px 20px" }}>
            <SectionLabel>
              {isPositive ? "연관 기념일" : "관련 사건"}
            </SectionLabel>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {result.matchedEvents.map((event) => {
                const evGrade =
                  event.grade ?? toneToGrade(event.recommendedTone, event.riskLevel);
                const evScheme = GRADE_SCHEME[evGrade];
                return (
                  <div
                    key={event.id}
                    style={{
                      background: "#fff",
                      border: `1px solid ${evScheme.bodyBorder}`,
                      borderLeft: `4px solid ${evScheme.accent}`,
                      borderRadius: "8px",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <GradeBadge grade={evGrade} size="xs" showLabel={false} />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "var(--ms-text)",
                          fontFamily: "var(--font-display)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {event.name}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: evScheme.textColor,
                          background: evScheme.tagBg,
                          border: `1px solid ${evScheme.tagBorder}`,
                          padding: "1px 6px",
                          borderRadius: "3px",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {GRADE_LABEL[evGrade]}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--ms-text-2)",
                        lineHeight: 1.65,
                        margin: "0 0 8px",
                      }}
                    >
                      {event.summary}
                    </p>
                    <div style={{
                      display: "flex", gap: "12px",
                      alignItems: "center", flexWrap: "wrap",
                      paddingTop: "8px",
                      borderTop: event.references.length > 0 ? "1px dashed var(--ms-border)" : "none",
                      marginTop: event.references.length > 0 ? "8px" : "0",
                    }}>
                      {event.slug && (
                        <Link
                          href={`/events/${event.slug}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--brand-red)",
                            textDecoration: "none",
                          }}
                        >
                          라이브러리에서 보기 →
                        </Link>
                      )}
                      {event.references.slice(0, 2).map((ref) => (
                        <a
                          key={ref.url}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "12px",
                            color: "var(--ms-text-2)",
                            textDecoration: "underline",
                            textUnderlineOffset: "2px",
                          }}
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

      {/* ── SUGGESTIONS ───────────────────────────────────────── */}
      {result.suggestions.length > 0 && (
        <>
          <Divider />
          <div style={{ padding: "16px 20px" }}>
            <SectionLabel>
              {isPositive ? "활용 아이디어" : "대안 제안"}
            </SectionLabel>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "11px 14px",
                    background: "#fff",
                    border: `1px solid ${scheme.bodyBorder}`,
                    borderLeft: `3px solid ${scheme.accent}`,
                    borderRadius: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontFamily: "monospace",
                      color: scheme.accent,
                      fontWeight: 700,
                      marginTop: "2px",
                      minWidth: "18px",
                      opacity: 0.8,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--ms-text)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── ALTERNATIVE DATES — F/D only ──────────────────────── */}
      {isNegative && (
        <>
          <Divider />
          <div
            style={{
              padding: "14px 20px",
              background: "#F0FDF4",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#14532D",
                margin: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              다른 날짜 시도
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[1, 7, 14].map((offset) => {
                const d = new Date(date);
                d.setDate(d.getDate() + offset);
                const ds = d.toISOString().split("T")[0];
                return (
                  <a
                    key={ds}
                    href={`/check?date=${ds}`}
                    style={{
                      fontSize: "12px",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      border: "1px solid #86EFAC",
                      background: "#fff",
                      color: "#16A34A",
                      textDecoration: "none",
                      fontWeight: 600,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.background =
                        "#DCFCE7")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.background =
                        "#fff")
                    }
                  >
                    {ds.slice(5).replace("-", "/")} +{offset}일
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── PERSONALIZED COMMENT ──────────────────────────────── */}
      {result.personalizedComment && (
        <>
          <Divider />
          <div style={{ padding: "16px 20px" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1D4ED8",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              맞춤 코멘트
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--ms-text)",
                lineHeight: 1.75,
                margin: 0,
                padding: "12px 14px",
                background: "#EFF6FF",
                borderRadius: "8px",
                border: "1px solid #BFDBFE",
              }}
            >
              {result.personalizedComment}
            </p>
          </div>
        </>
      )}

      {/* ── MEMO ──────────────────────────────────────────────── */}
      <Divider />
      <div style={{ padding: "16px 20px" }}>
        <label
          htmlFor="result-memo"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--ms-text-3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "8px",
          }}
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
            padding: "10px 12px",
            border: "1px solid var(--ms-border)",
            borderRadius: "8px",
            background: "#fff",
            fontSize: "13px",
            color: "var(--ms-text)",
            resize: "none",
            outline: "none",
            fontFamily: "var(--font-body)",
            lineHeight: 1.65,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = scheme.accent)
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--ms-border)")
          }
        />
        <p
          style={{
            fontSize: "12px",
            color: "var(--ms-text-3)",
            marginTop: "5px",
            margin: "5px 0 0",
          }}
        >
          메모는 이 기기에만 저장됩니다.
        </p>
      </div>

      {/* ── DISCLAIMER ────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 18px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "var(--ms-text-3)",
            background: "var(--ms-surface-2)",
            border: "1px solid var(--ms-border)",
            borderRadius: "6px",
            padding: "9px 12px",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          ⓘ 이 검토 결과는 참고용입니다. 최종 캠페인 결정은 귀하의 판단과 책임 하에 이루어집니다.
        </p>
      </div>
    </article>
  );
}
