You are collaborating with Claude (lead engineer/advisor) on a **content & copy audit** of "Nunchi" (repo at working root, read-only — DO NOT modify files). Nunchi is a Korean SaaS that pre-screens marketing campaigns (date × concept × copy) for social/historical/cultural risk, now extended with an "expression risk" layer (community slang / gender / regional slurs; see docs/decisions/0004-expression-risk-layer.md). Output ONE Markdown document in Korean (identifiers in English), under ~3,000 words.

## Read first (read-only)
- CLAUDE.md (positioning, target users, principles: "inform + recommend, never forbid", political neutrality), README.md (STALE — says Vercel/Supabase/Gemini/31 events; do not trust as current), docs/decisions/0001-mvp-scope.md (persona: 1인 PMM, no-signup), docs/decisions/0003-five-grade-system.md, docs/decisions/0004-expression-risk-layer.md
- ALL user-facing UI text: apps/web/app/layout.tsx (metadata/OG), apps/web/app/(landing)/page.tsx, app/check/page.tsx, app/calendar/page.tsx, app/events/page.tsx, app/events/[slug]/page.tsx, app/contact/page.tsx, app/privacy/page.tsx, app/terms/page.tsx, app/onboarding/page.tsx, app/mypage/page.tsx, app/auth/error/page.tsx, components/AppHeader.tsx, NavigationMenu.tsx, SiteFooter.tsx, GlobalFooter.tsx, FeedbackWidget.tsx, NearbyEventsPreview.tsx, NoonchiLogo.tsx, result-card/ResultCard.tsx (grade labels, disclaimers), packages/shared/src/types.ts (GRADE_LABEL etc.), apps/web/lib/routes.ts
- Backend truths to check claims against: apps/web/lib/review-engine.ts, packages/llm/src/claude.ts, data/events/ (count files excluding _template.json), scripts/migrate.ts

## Ground truth (verified by Claude today, 2026-09-13)
- Event DB: **50 curated events** (51 JSON files incl. `_template.json`). The landing says "60+ 사건" somewhere — verify and flag.
- Review latency: rule-hit path ~50ms; LLM path (Ollama qwen3:8b, remote) **10–20 seconds**. Landing says "5초 검토" — flag if present.
- LLM: self-hosted Ollama qwen3:8b (not Gemini/Claude). Never expose vendor names in UI unless already there; check privacy policy claims about where campaign text is sent (it goes to a self-hosted Ollama endpoint over plain HTTP; Gemini only if GEMINI_API_KEY set).
- Auth: Google login via NextAuth; /check is public (no login needed); onboarding is optional personalization; /admin for admins.
- Email: Gmail SMTP (nodemailer) for contact/inquiry notifications. No waitlist feature anymore (removed) — flag any waitlist remnants in text.
- Brand: logo wordmark shows **"nunch●i"** (hyphen-as-mark, red dot), domain **nunch-i.com**, but many texts still say **"noonch-i"** (layout title, footer, terms, emails), README says "Noonchi (눈치)". Produce a full inventory table of brand-name variants with file:line. Do NOT decide the final brand name — present options (nunch-i / noonch-i / Nunchi / 눈치) with pros/cons (domain match, Korean readability, pronunciation of "눈치", search/SEO) for the owner to decide.
- Hosting now: local Docker (dev). Future: Vercel + Supabase. Current production site is offline. Remove/flag any "beta live" claims that imply an operating service if present.
- Grades: F 회피 필수 / D 재검토 권고 / C 일반 주의 / B 안전 / A 최적 타이밍 (packages/shared). CLAUDE.md principle says the product informs and recommends, never forbids — "회피 필수" and "재검토 필요 — 컨셉·카피를 수정하세요" (imperative) may conflict; propose softer alternatives that keep urgency.
- New feature to message on landing/check page: 표현 리스크 (community slang / gender / region) with 3 tiers; wording principle: never label people ("일베 사용자" 등 금지), describe expression/usage/evidence only. Landing currently does not mention it.

## Deliverables
1. **사실 오류·과장 표** — every claim in UI text that is false, outdated, or unverifiable (event count, speed, "60+", "실시간", "AI가 100%…", vendor, waitlist, beta, pricing, "무료" claims, team/company facts). For each: file:line, current text, why wrong, proposed replacement.
2. **브랜드 표기 인벤토리** — all variants with file:line; then the options analysis (no decision).
3. **페르소나·톤 일관성** — CLAUDE.md targets 대기업 마케팅팀/대행사 AE first, ADR-0001 targets 1인 PMM; landing hero speaks to whom? Point out mismatches and propose ONE consistent voice (recommend, with reasoning). Check 존댓말/해요체 consistency, 영문 혼용, 외래어 표기(캠페인·카피·컨셉/콘셉트 — 국립국어원 표기는 '콘셉트'), 띄어쓰기 (예: '재검토', '사전 검증').
4. **원칙 위반 문구** — anything that forbids/commands ("금지", "하지 마세요", "수정하세요"), that labels people, that takes a political stance, that overclaims safety ("안전합니다" → "등록된 사건에서 위험을 찾지 못했습니다" 등). Propose replacements.
5. **랜딩 페이지 카피 리라이트 제안** — section by section (hero H1/H2/CTA, 문제 제기, 작동 방식 3단계, 5등급 설명, 표현 리스크 신규 섹션 초안, 사례, FAQ 추가/수정 항목, 푸터 disclaimer). Give BEFORE → AFTER for each string, keep length similar, Korean marketing copy quality (short, concrete, no hype). Mark which are "사실 수정(필수)" vs "톤 개선(선택)".
6. **법적·개인정보 문구 점검** — privacy/terms vs actual data flow (campaign text sent to self-hosted LLM over HTTP; reviews cached 7 days in DB with the copy text; Google login stores email/name/image; Gmail SMTP for inquiries; no waitlist). List concrete mismatches and replacement sentences. Mark items needing a lawyer.
7. **SEO/메타데이터** — title/description/OG per page; propose concrete strings (≤60 chars title, ≤155 chars description) in Korean.
8. **적용 우선순위 목록** — P0 (사실 오류·법적), P1 (원칙·톤), P2 (카피 개선), each item as `file:line — before → after`, ready for Claude to hand to an implementation worker. Keep P0 strictly to things that are objectively wrong.

Cite exact file paths and line numbers you actually observed. Do not invent UI strings that are not in the files. Where you are unsure, say "(확인 필요)".
