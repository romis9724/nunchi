You are the second reviewer, collaborating with Claude (first reviewer / lead) on approving a Korean "expression risk" lexicon for Nunchi (nunch-i), a marketing pre-screening SaaS. Repo at working root, READ-ONLY — do not modify files. The product owner delegated the approval decision to Claude + you jointly.

## Read first
- docs/decisions/0004-expression-risk-layer.md (tiers, grade impact: hard → grade cap D; contextual → LLM usage judgment, warning only; watch → informational only; wording principles; data principles: verified sources ≥1 non-wiki, political neutrality, symmetric harm standard, no person-labeling)
- data/lexicon/README.md (schema, approval workflow)
- data/lexicon/community.json, gender.json, region.json — ALL 68 entries (status draft)
- apps/web/lib/expression-lexicon.ts (matcher semantics: `literal` = word boundary + particle suffixes, does NOT match inside compounds; `regex` raw; `cooccur` = all must co-occur in the same sentence)
- packages/llm/src/prompts/review-campaign.ts (how contextual entries are judged by qwen3:8b)

## Your task
Review EVERY entry and return a verdict. Criteria, in priority order:
1. **Evidence**: ≥1 non-wiki source that plausibly documents the pejorative usage (news/official/academic). Judge plausibility from label/URL/type — do not fetch. Thin evidence (single minor source, or only "reported" hedges) → prefer `hold`.
2. **Tier correctness** per ADR: `hard` only if marketing copy has essentially no benign usage; anything overlapping with a normal word (food, place, dialect, common noun, legal/business term) must be `contextual` (with benign_usages) or use `cooccur`; disputed-origin terms → `watch`.
3. **False-positive exposure**: would this entry fire on ordinary marketing copy? Check the pattern (literal/regex/cooccur). If a regex is over-broad (e.g., prefix generalizations), recommend `hold` or a narrower regex.
4. **Political neutrality / symmetry**: same harm standard regardless of origin camp. Do not remove an entry merely for being about one camp; do flag entries whose inclusion or wording reads as taking a side.
5. **Wording**: `note` (shown to users) must describe expression/usage/risk without labeling people; flag any note that classifies the user or a group.
6. **Product value**: informational `watch` items with weak evidence and low marketing relevance → `hold` (keep draft), not approve.

Also give specific opinions on these owner-flagged items: mom-chung, teuldak (contextual→hard?), sukkol (keep for symmetry vs category fit), nomu-prefix-mockery (regex inferred; 노무관리/노무사 noise), saneophwa-ilbe (thin evidence), no-o-rat-da (single source watch), no-ending-roh-context (needs a user-facing display name — propose one ≤ 14 Korean chars), jaegi-hae (command-form-only regex — sufficient?), boiru (retracted paper; is "watch" defensible or defamation-adjacent?), the three 2021 disputed onomatopoeia (웅앵웅·오조오억·허버허버).

## Output format (STRICT)
First, a Markdown table: key | term | current tier | verdict (approve/hold/reject) | tier (final) | rename (or -) | one-line reason (Korean). Then a fenced ```json block:
{"verdicts":[{"key":"...","decision":"approve|hold|reject","tier":"hard|contextual|watch","rename":null|"...","note_fix":null|"...","reason":"..."}]}
covering ALL 68 keys exactly once. Korean for reasons/renames. Under 2,500 words total excluding the JSON.
