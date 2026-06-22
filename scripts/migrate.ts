import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Pool } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../apps/web/.env.local"),
  resolve(__dirname, "../.env"),
];
const loaded = candidates.find((p) => fs.existsSync(p));
if (loaded) config({ path: loaded });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost/noonchi",
});

/**
 * RDS-native schema (Supabase 비의존).
 *
 * Supabase 시절 마이그레이션(migrations/004~006)은 `auth.users` 참조·RLS·트리거에
 * 의존했으나, AWS RDS로 완전 이전하면서 인증을 NextAuth(자체 users 테이블)로 교체했다.
 * 따라서 이 스크립트는:
 *   - auth 스키마/RLS/트리거 없이
 *   - users 를 자체 UUID PK + google_sub(유니크) 로 직접 소유
 *   - 임베딩을 bge-m3 차원(1024)으로 정의
 * 한다. migrations/*.sql 은 Supabase 레거시 기록이며 RDS 에는 적용하지 않는다.
 *
 * 전부 IF NOT EXISTS / ADD COLUMN IF NOT EXISTS 로 멱등하게 작성되어 재실행 안전하다.
 */
const SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

-- ───────────────────────── events ─────────────────────────
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
    'independence', 'labor', 'human_rights'
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

-- 기존 DB 정합(멱등): status·source 추가
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'archived'));
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'naver_auto'));

CREATE INDEX IF NOT EXISTS events_month_day   ON events (month, day);
CREATE INDEX IF NOT EXISTS events_risk_level  ON events (risk_level);
-- pgvector IVF Flat (cosine). lists=10 은 ~50-500행 적정 — 데이터 증가 시 sqrt(n)로 조정.
CREATE INDEX IF NOT EXISTS events_embedding_idx
  ON events USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ──────────────────── keywords_blacklist ────────────────────
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

-- ───────────────────────── reviews ─────────────────────────
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
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('F', 'D', 'C', 'B', 'A'));
CREATE INDEX IF NOT EXISTS reviews_input_hash ON reviews (input_hash);
CREATE INDEX IF NOT EXISTS reviews_date       ON reviews (date);

-- (waitlist 테이블은 제거됨 — 웨이트리스트 기능 폐기, orm_no_waitlist 가드가 부재를 강제)

-- ────────────────────────── users ──────────────────────────
-- NextAuth(Google) 로그인 사용자. Supabase auth.users 미사용 — 자체 소유.
-- google_sub = Google 계정 고유 ID(OAuth profile.sub). 재로그인 시 이 키로 upsert.
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

-- ──────────────────────── inquiries ────────────────────────
-- /contact 공개 폼. user_id 는 로그인 사용자만 채워짐(비로그인 NULL 허용).
CREATE TABLE IF NOT EXISTS inquiries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS inquiries_created_at ON inquiries (created_at DESC);

-- ──────────────────────── feedback ─────────────────────────
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

async function main() {
  console.log("Running migrations on:", process.env.DATABASE_URL ?? "postgresql://localhost/noonchi");
  await pool.query(SQL);
  console.log("Migration complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
