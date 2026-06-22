// seed-rds.mjs — 의존성 최소(pg 하나) 자립형 RDS 시더.
//
// 배경: 배포 EC2(t3.micro, 루트 6.7G)가 디스크가 빠듯해 pnpm 워크스페이스 설치
// (next/sharp 등 apps/web 의존성 동반)가 ENOSPC 로 실패한다. 이 스크립트는 워크스페이스·
// tsx 없이 `npm i pg` 만으로 ①스키마 DDL ②data/events/*.json 시딩 ③Ollama bge-m3
// 1024 임베딩을 한 번에 수행한다. DDL 은 scripts/migrate.ts 와 동일하게 유지한다.
//
// 실행: DATABASE_URL, OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL, OLLAMA_EMBED_DIM,
//       EVENTS_DIR(기본 ../data/events) 환경변수 필요.
//   node seed-rds.mjs            # 텍스트만 시딩(임베딩 생략)
//   node seed-rds.mjs --embed    # 임베딩 포함

import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHOULD_EMBED = process.argv.slice(2).includes("--embed");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = process.env.EVENTS_DIR ?? path.resolve(__dirname, "../data/events");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "bge-m3:latest";
const OLLAMA_EMBED_DIM = process.env.OLLAMA_EMBED_DIM ? Number(process.env.OLLAMA_EMBED_DIM) : 1024;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL 환경변수가 없습니다.");
  process.exit(1);
}

const ssl = process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false };
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl });

// ── 스키마 DDL (scripts/migrate.ts 와 동일) ─────────────────────────────────────
const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  date_type   TEXT NOT NULL CHECK (date_type IN ('fixed', 'recurring', 'range')),
  month       SMALLINT NOT NULL,
  day         SMALLINT,
  day_end     SMALLINT,
  country     TEXT NOT NULL DEFAULT 'KR',
  name        TEXT NOT NULL,
  name_en     TEXT,
  category    TEXT NOT NULL CHECK (category IN (
    'massacre', 'disaster', 'political', 'social', 'memorial',
    'independence', 'labor', 'human_rights', 'celebration', 'commercial'
  )),
  risk_level  TEXT NOT NULL CHECK (risk_level IN ('critical', 'high', 'medium', 'low')),
  summary     TEXT NOT NULL,
  related_keywords    TEXT[]  NOT NULL DEFAULT '{}',
  related_motifs      TEXT[]  NOT NULL DEFAULT '{}',
  recommended_tone    TEXT NOT NULL CHECK (recommended_tone IN (
    'avoid', 'memorial', 'neutral', 'celebration'
  )),
  "references"        JSONB   NOT NULL DEFAULT '[]',
  embedding           VECTOR(1024),
  status      TEXT NOT NULL DEFAULT 'approved'
                CHECK (status IN ('draft', 'pending_review', 'approved', 'archived')),
  source      TEXT NOT NULL DEFAULT 'manual'
                CHECK (source IN ('manual', 'naver_auto')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('draft', 'pending_review', 'approved', 'archived'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'naver_auto'));
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check CHECK (category IN (
  'massacre','disaster','political','social','memorial',
  'independence','labor','human_rights','celebration','commercial'
));
CREATE INDEX IF NOT EXISTS events_month_day   ON events (month, day);
CREATE INDEX IF NOT EXISTS events_risk_level  ON events (risk_level);
CREATE INDEX IF NOT EXISTS events_embedding_idx
  ON events USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

CREATE TABLE IF NOT EXISTS keywords_blacklist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term            TEXT NOT NULL,
  term_normalized TEXT NOT NULL,
  related_event_id UUID REFERENCES events(id),
  severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium')),
  context_note    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS keywords_blacklist_term ON keywords_blacklist (term_normalized);

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_hash      TEXT NOT NULL UNIQUE,
  date            DATE NOT NULL,
  campaign_name   TEXT,
  copy            TEXT NOT NULL,
  asset_keywords  TEXT[]  NOT NULL DEFAULT '{}',
  risk_score      TEXT NOT NULL CHECK (risk_score IN ('safe', 'caution', 'danger', 'critical')),
  grade           TEXT CHECK (grade IN ('F', 'D', 'C', 'B', 'A')),
  flagged_keywords TEXT[] NOT NULL DEFAULT '{}',
  matched_events  JSONB   NOT NULL DEFAULT '[]',
  suggestions     TEXT[]  NOT NULL DEFAULT '{}',
  llm_rationale   TEXT NOT NULL,
  rule_triggered  BOOLEAN NOT NULL DEFAULT FALSE,
  cached_until    TIMESTAMPTZ NOT NULL,
  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('F', 'D', 'C', 'B', 'A'));
CREATE INDEX IF NOT EXISTS reviews_input_hash ON reviews (input_hash);
CREATE INDEX IF NOT EXISTS reviews_date       ON reviews (date);

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub  TEXT NOT NULL UNIQUE,
  email       TEXT,
  name        TEXT,
  image       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  company       TEXT,
  brand         TEXT,
  product_name  TEXT,
  industries    TEXT[]  NOT NULL DEFAULT '{}',
  channels      TEXT[]  NOT NULL DEFAULT '{}',
  onboarding_completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_email ON users (email);

CREATE TABLE IF NOT EXISTS inquiries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS inquiries_created_at ON inquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL DEFAULT 'suggestion'
               CHECK (type IN ('bug', 'suggestion', 'praise')),
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback (created_at DESC);
`;

function loadEvents() {
  return fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, f), "utf-8")));
}

function buildEmbeddingSource(e) {
  return [e.name, e.name_en ?? "", e.summary, (e.related_keywords ?? []).join(" "), (e.related_motifs ?? []).join(" ")]
    .filter(Boolean)
    .join("\n");
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  if (!Array.isArray(data?.embedding)) throw new Error(`embedding 누락: ${JSON.stringify(data).slice(0, 120)}`);
  if (data.embedding.length !== OLLAMA_EMBED_DIM)
    throw new Error(`차원 불일치: 기대 ${OLLAMA_EMBED_DIM}, 실제 ${data.embedding.length}`);
  return data.embedding;
}

async function main() {
  console.log("=== 스키마 적용 ===");
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("  pgvector 확장 OK");
  } catch (e) {
    console.warn(`  ⚠ CREATE EXTENSION vector 실패(권한?): ${e.message} — 이미 존재하면 무시하고 계속`);
  }
  await pool.query(SCHEMA);
  console.log("  테이블/인덱스 적용 완료");

  const events = loadEvents();
  console.log(`\n=== 시딩 ${events.length}건${SHOULD_EMBED ? " [+embeddings 1024]" : ""} ===`);
  let ok = 0, fail = 0, emb = 0, embFail = 0;

  for (const e of events) {
    let vec = null;
    if (SHOULD_EMBED) {
      try {
        vec = `[${(await embed(buildEmbeddingSource(e))).join(",")}]`;
        emb++;
      } catch (err) {
        console.error(`    ⚠ embed 실패 (${e.slug}): ${err.message}`);
        embFail++;
      }
    }
    try {
      await pool.query(
        `INSERT INTO events (
           slug, date_type, month, day, day_end, country, name, name_en,
           category, risk_level, summary, related_keywords, related_motifs,
           recommended_tone, "references", embedding, status, source
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::vector,'approved','manual')
         ON CONFLICT (slug) DO UPDATE SET
           date_type=EXCLUDED.date_type, month=EXCLUDED.month, day=EXCLUDED.day,
           day_end=EXCLUDED.day_end, country=EXCLUDED.country, name=EXCLUDED.name,
           name_en=EXCLUDED.name_en, category=EXCLUDED.category, risk_level=EXCLUDED.risk_level,
           summary=EXCLUDED.summary, related_keywords=EXCLUDED.related_keywords,
           related_motifs=EXCLUDED.related_motifs, recommended_tone=EXCLUDED.recommended_tone,
           "references"=EXCLUDED."references",
           embedding=COALESCE(EXCLUDED.embedding, events.embedding), updated_at=NOW()`,
        [
          e.slug, e.date_type, e.month, e.day ?? null, e.day_end ?? null, e.country,
          e.name, e.name_en ?? null, e.category, e.risk_level, e.summary,
          e.related_keywords ?? [], e.related_motifs ?? [], e.recommended_tone,
          JSON.stringify(e.references ?? []), vec,
        ]
      );
      console.log(`  ✓ ${e.name}${vec ? ` (1024d)` : ""}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${e.name} — ${err.message}`);
      fail++;
    }
  }

  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS total, COUNT(embedding)::int AS embedded FROM events"
  );
  console.log(`\n완료: 시딩 성공 ${ok} / 실패 ${fail}`);
  if (SHOULD_EMBED) console.log(`임베딩: 생성 ${emb} / 실패 ${embFail}`);
  console.log(`events 테이블: 총 ${rows[0].total}행, 임베딩 ${rows[0].embedded}행`);
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
