"use client";

import { useState, useEffect } from "react";

/**
 * NearbyEventsPreview
 * /check 페이지에서 사용자가 날짜를 선택하면 해당 일자와
 * 정확히 일치하는 큐레이션 사건을 미리 보여준다.
 *
 * - 디바운스 250ms로 입력 중복 호출 방지
 * - 사건 0건이면 차분한 "특이사항 없음" 메시지
 * - 2건 이상이면 2열 그리드로 표시
 * - 최대 6건까지 우선 노출 + 더보기
 */

interface NearbyEvent {
  id: string;
  name: string;
  month: number;
  day: number | null;
  category: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  summary: string;
  grade: "F" | "D" | "C" | "B" | "A";
}

interface ApiResponse {
  date: string;
  events: NearbyEvent[];
}

const GRADE_BG: Record<string, string> = {
  F: "var(--grade-f-bg)", D: "var(--grade-d-bg)", C: "var(--grade-c-bg)",
  B: "var(--grade-b-bg)", A: "var(--grade-a-bg)",
};
const GRADE_TEXT: Record<string, string> = {
  F: "var(--grade-f-text)", D: "var(--grade-d-text)", C: "var(--grade-c-text)",
  B: "var(--grade-b-text)", A: "var(--grade-a-text)",
};
const GRADE_BORDER: Record<string, string> = {
  F: "var(--grade-f-border)", D: "var(--grade-d-border)", C: "var(--grade-c-border)",
  B: "var(--grade-b-border)", A: "var(--grade-a-border)",
};

const MAX_SHOWN = 6;

function MiniGrade({ g }: { g: string }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22,
        fontWeight: 900, fontSize: 11,
        color: GRADE_TEXT[g] ?? GRADE_TEXT.C,
        background: GRADE_BG[g] ?? GRADE_BG.C,
        borderRadius: "5px",
        fontFamily: "var(--font-display)",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {g}
    </span>
  );
}

export function NearbyEventsPreview({ date }: { date: string }) {
  const [events, setEvents] = useState<NearbyEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

    const controller = new AbortController();
    setLoading(true);

    const handle = setTimeout(() => {
      fetch(`/api/events/nearby?date=${encodeURIComponent(date)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d: ApiResponse) => {
          setEvents(d.events ?? []);
          setExpanded(false);
        })
        .catch(() => {
          // 네트워크 오류 시 조용히 무시 — 미리보기는 부가 정보
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(handle);
      setLoading(false);
    };
  }, [date]);

  if (events === null) {
    return loading ? (
      <div style={{
        marginTop: "10px", fontSize: "12px", color: "var(--ms-text-3)",
        padding: "8px 12px",
      }}>
        ⌛ 해당 날짜 사건 확인 중…
      </div>
    ) : null;
  }

  if (events.length === 0) {
    return (
      <div style={{
        marginTop: "10px",
        background: "var(--ms-blue-light)",
        border: "1px solid var(--ms-blue-mid)",
        borderRadius: "10px",
        padding: "10px 14px",
        fontSize: "12.5px",
        color: "var(--ms-text-2)",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{ color: "var(--ms-blue)" }}>✓</span>
        <span>이 날짜에는 등록된 사건이 없습니다.</span>
      </div>
    );
  }

  const visible = expanded ? events : events.slice(0, MAX_SHOWN);
  const hidden = events.length - visible.length;
  const twoColumn = events.length >= 2;

  return (
    <div style={{
      marginTop: "10px",
      background: "var(--ms-surface)",
      border: "1px solid var(--ms-border)",
      borderRadius: "10px",
      padding: "12px 14px 10px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "10px",
      }}>
        <div style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
          color: "var(--ms-text-2)", textTransform: "uppercase",
        }}>
          이 날짜 · 관련 사건 {events.length}건
        </div>
      </div>

      <ul style={{
        listStyle: "none", margin: 0, padding: 0,
        display: "grid",
        gridTemplateColumns: twoColumn ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
        gap: "6px",
      }}>
        {visible.map((ev) => (
          <li
            key={ev.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: "10px 12px",
              background: "#fff",
              border: `1px solid ${GRADE_BORDER[ev.grade] ?? "var(--ms-border)"}`,
              borderLeft: `3px solid ${GRADE_TEXT[ev.grade] ?? "var(--ms-text-2)"}`,
              borderRadius: "8px",
              minWidth: 0,
            }}
          >
            <MiniGrade g={ev.grade} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "13px", fontWeight: 700,
                color: "var(--charcoal)", letterSpacing: "-0.005em",
                marginBottom: "3px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {ev.name}
              </div>
              <div style={{
                fontSize: "11.5px", color: "var(--ms-text-2)",
                lineHeight: 1.5,
                overflow: "hidden", textOverflow: "ellipsis",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {ev.summary}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            marginTop: "8px",
            background: "transparent", border: "none",
            color: "var(--brand-red, #E11D48)",
            fontSize: "12px", fontWeight: 600,
            cursor: "pointer", padding: "4px 0",
          }}
        >
          +{hidden}건 더 보기
        </button>
      )}
    </div>
  );
}
