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

const SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

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
  embedding           VECTOR(768),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_month_day   ON events (month, day);
CREATE INDEX IF NOT EXISTS events_risk_level  ON events (risk_level);

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
  flagged_keywords TEXT[] NOT NULL DEFAULT '{}',
  matched_events  JSONB   NOT NULL DEFAULT '[]',
  suggestions     TEXT[]  NOT NULL DEFAULT '{}',
  llm_rationale   TEXT NOT NULL,
  rule_triggered  BOOLEAN NOT NULL DEFAULT FALSE,
  cached_until    TIMESTAMPTZ NOT NULL,
  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_input_hash ON reviews (input_hash);
CREATE INDEX IF NOT EXISTS reviews_date       ON reviews (date);

CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
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
