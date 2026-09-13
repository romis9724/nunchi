You are collaborating with Claude (the lead engineer/advisor) on product research and architecture for "Nunchi" (눈치), a Korean SaaS that pre-screens marketing campaigns (date × concept × copy) for social/historical/cultural risk before launch. Repo is at the working root (read-only). DO NOT modify any files. Output a single Markdown document in Korean (technical identifiers in English).

## Context you must read first (read-only)
- CLAUDE.md (product definition, principles: data accuracy > features, political neutrality, "inform + recommend, never forbid", Korea-first)
- apps/web/lib/review-engine.ts (pipeline: cache → in-memory CRITICAL_KEYWORDS rule → nearby(±3d)+semantic(pgvector bge-m3 1024) event candidates → Ollama qwen3:8b LLM → grade F/D/C/B/A)
- apps/web/lib/critical-keywords.ts (20 date/event-bound terms → instant F)
- packages/llm/src/prompts/review-campaign.ts (LLM system/user prompt, JSON output {grade, rationale, suggestions})
- packages/shared/src/types.ts (CheckRequest/CheckResponse, Grade, RiskScore)
- scripts/migrate.ts (tables: events, keywords_blacklist [term, term_normalized, related_event_id, severity, context_note] — table exists but is UNUSED by code, reviews cache, users, inquiries, feedback)
- data/events/*.json (50 curated Korean sensitive dates; _template.json shows schema)
- apps/web/components/result-card/ (how results render)
- tests/eval/ (eval harness: 100 cases, deterministic structure gate + qwen3:8b self-judge)

## New requirement (from the product owner)
Trigger: In July 2026, RESCENE member Wonee said "무섭노" (natural Gyeongsang dialect exclamative) on YouTube; an MBC Gyeongnam PD accused it of being Ilbe (far-right community) "-노" mockery of the late President Roh Moo-hyun. Linguists (e.g., Prof. Shin Ji-young, Korea Univ.) said it is ordinary dialect; a large backlash followed. Lesson: the same surface form can be dialect OR a hate-community shibboleth; context decides.
The owner wants Nunchi to ALSO detect (a) Ilbe-origin slang (e.g., 운지, 노무noun mockery, "-노"/"이기야" endings, 홍어, 민주화 as pejorative, 급식충/맘충/틀딱, 삼일한 …) and (b) gender-discriminatory expressions (김치녀/된장녀/한남/맘충/보이루 controversy-type terms etc., both misogynist and misandrist), in campaign copy/name/asset keywords — as a NEW, date-independent "expression risk" dimension alongside the existing date-bound risk.

## Deliverables (Markdown, Korean)
1. **Benchmark**: 8–12 comparable products/tools (Korea + global) for pre-publish copy screening of hate/bias/community-slang: e.g., Textio, Writer.com inclusive-language, alex (open source), Grammarly inclusive suggestions, Perspective API (Jigsaw), Hive Moderation, TUNiB hate-speech API, Kakao 세이프봇, Naver 클린봇, Smilegate UnSmile model, Corepin moderation, etc. For each: what it screens, approach (lexicon / classifier / LLM), Korean support, pre-publish vs post-hoc, pricing tier if known, and the ONE idea Nunchi should borrow. Mark anything you are not certain about with "(확인 필요)". Do not invent product features.
2. **Data sources** for a Korean lexicon of Ilbe slang + gender-discriminatory terms: public datasets (UnSmile CC-BY-NC-ND 4.0 — note license implications for a commercial SaaS; K-MHaS; KOLD; BEEP!; Selectstar/TUNiB), wiki/community sources (namu.wiki "일베저장소/용어" — reliability caveats), 국립국어원 / 국가인권위 hate-speech guidance, news case archives ("연예인·공인들의 일베 논란"). Recommend a curation workflow consistent with the project principle "verified sources only, political neutrality".
3. **Architecture proposal** for the "expression risk" layer inside THIS codebase, minimal and reusing what exists (ponytail/YAGNI): 
   - Data model: reuse/extend `keywords_blacklist` (add `category`, `tier`, `pattern_type`, `evidence`/sources, nullable event FK) vs a new `data/lexicon/*.json` file as source of truth seeded like events. Recommend one.
   - Matching: exact substring vs word-boundary/regex for Korean particles/endings; how to handle contextual forms like "-노" (dialect overlap) — propose a 3-tier scheme: `hard` (unambiguous slur → grade cap, e.g., max D or F), `contextual` (needs LLM adjudication → warning + rationale, no auto-downgrade), `watch` (informational). Give concrete regex examples for "-노" endings that avoid flagging normal dialect (e.g., only when combined with 노무현-related nouns or when '-노' is used as a general polite-ending replacement in non-dialect context), and state honestly what cannot be solved by regex.
   - LLM: how to extend review-campaign.ts prompt (inject matched lexicon entries with context notes; ask for `expressionRisk` sub-judgment; keep political neutrality wording). qwen3:8b limitations.
   - API/Types: extend CheckResponse with an `expressionFlags: [{term, category, tier, note, sources}]` (backward compatible) and how grade interacts (recommend: hard → cap at D/F; contextual → no cap, show warning).
   - UI: ResultCard section "표현 리스크" — show flagged term, why, alternative, source link; wording that informs rather than accuses (avoid labeling the user "일베").
   - Eval: add cases to tests/eval (true positives, dialect false-positive controls like "무섭노", "그랬노", misandry/misogyny both directions), acceptance thresholds.
   - Rollout: MVP (lexicon ~50–100 terms, hard+contextual, prompt update, UI section) vs later (classifier via Ollama-hosted Korean BERT e.g., UnSmile model — license?, embeddings similarity for variants/초성 obfuscation like ㄴㅁㅎ, 운지→ㅇㅈ).
4. **Risks & open questions** for the product owner: legal/defamation risk of labeling, political neutrality (Ilbe is far-right; also cover left-leaning community slang? e.g., 메갈/워마드 terms — recommend symmetric coverage by harm, not by camp), false-positive harm to dialect speakers/regions, how to keep the lexicon current, who curates.
5. A prioritized task list (P0/P1/P2) with rough effort in hours, suitable for Claude to turn into implementation briefs.

Be concrete, cite file paths and line-level observations from the repo where relevant. Keep it under ~2,500 words.
