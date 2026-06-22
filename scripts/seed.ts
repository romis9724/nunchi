import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Pool } from "pg";
import type { EventRecord } from "@noonchi/shared";
import { generateEmbedding } from "@noonchi/llm";

// CLI flags: pnpm db:seed -- --embed → events.embedding 도 채운다.
// generateEmbedding(Ollama bge-m3 primary, 폴백 포함). --embed 없으면 큐레이션
// 텍스트 컬럼만 upsert 하고 기존 임베딩은 보존한다(API 호출 없음).
const SHOULD_EMBED = process.argv.slice(2).includes("--embed");

// 루트 .env.local → apps/web/.env.local → .env 순서로 로드
const __dirname = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../apps/web/.env.local"),
  resolve(__dirname, "../.env"),
];

const loaded = candidates.find((p) => fs.existsSync(p));
if (loaded) {
  config({ path: loaded });
  console.log(`env loaded from ${loaded.replace(__dirname + "/..", "")}`);
} else {
  config();
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL 환경변수가 없습니다. (RDS nunchi DB 연결 문자열)");
  process.exit(1);
}

// RDS 는 TLS 를 요구한다. PGSSL=disable(로컬)일 때만 비활성화.
const ssl = process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false };
const pool = new Pool({ connectionString, ssl });

const EVENTS_DIR = resolve(__dirname, "../data/events");

function loadEvents(): EventRecord[] {
  const files = fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  return files.map((file) => {
    const raw = fs.readFileSync(resolve(EVENTS_DIR, file), "utf-8");
    return JSON.parse(raw) as EventRecord;
  });
}

/**
 * 임베딩 입력 텍스트. 재실행 시 동일하도록 안정적으로 구성한다.
 */
function buildEmbeddingSource(event: EventRecord): string {
  return [
    event.name,
    event.name_en ?? "",
    event.summary,
    (event.related_keywords ?? []).join(" "),
    (event.related_motifs ?? []).join(" "),
  ]
    .filter(Boolean)
    .join("\n");
}

/** number[] → pgvector 리터럴 문자열 "[v1,v2,...]". null 이면 null. */
function toVectorLiteral(embedding: number[] | null): string | null {
  return embedding ? `[${embedding.join(",")}]` : null;
}

async function main() {
  const events = loadEvents();
  console.log(
    `\nSeeding ${events.length}건 → RDS${SHOULD_EMBED ? " [+ embeddings]" : ""}\n`
  );

  let success = 0;
  let failed = 0;
  let embedded = 0;
  let embedFailed = 0;

  for (const event of events) {
    let vectorLiteral: string | null = null;

    if (SHOULD_EMBED) {
      try {
        const embedding = await generateEmbedding(buildEmbeddingSource(event));
        vectorLiteral = toVectorLiteral(embedding);
        if (vectorLiteral) embedded++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`    ⚠ embed generation failed (${event.slug}): ${msg}`);
        embedFailed++;
      }
    }

    try {
      // 임베딩 미생성 시 기존 임베딩 보존(COALESCE) — 텍스트만 갱신하는 재실행 안전.
      await pool.query(
        `INSERT INTO events (
           slug, date_type, month, day, day_end, country, name, name_en,
           category, risk_level, summary, related_keywords, related_motifs,
           recommended_tone, "references", embedding, status, source
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13,
           $14, $15::jsonb, $16::vector, 'approved', 'manual'
         )
         ON CONFLICT (slug) DO UPDATE SET
           date_type = EXCLUDED.date_type,
           month = EXCLUDED.month,
           day = EXCLUDED.day,
           day_end = EXCLUDED.day_end,
           country = EXCLUDED.country,
           name = EXCLUDED.name,
           name_en = EXCLUDED.name_en,
           category = EXCLUDED.category,
           risk_level = EXCLUDED.risk_level,
           summary = EXCLUDED.summary,
           related_keywords = EXCLUDED.related_keywords,
           related_motifs = EXCLUDED.related_motifs,
           recommended_tone = EXCLUDED.recommended_tone,
           "references" = EXCLUDED."references",
           embedding = COALESCE(EXCLUDED.embedding, events.embedding),
           updated_at = NOW()`,
        [
          event.slug,
          event.date_type,
          event.month,
          event.day ?? null,
          event.day_end ?? null,
          event.country,
          event.name,
          event.name_en ?? null,
          event.category,
          event.risk_level,
          event.summary,
          event.related_keywords,
          event.related_motifs,
          event.recommended_tone,
          JSON.stringify(event.references ?? []),
          vectorLiteral,
        ]
      );

      const dim = vectorLiteral ? (vectorLiteral.match(/,/g)?.length ?? 0) + 1 : 0;
      console.log(`  ✓ ${event.name}${dim ? ` (embedding ${dim}d)` : ""}`);
      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ ${event.name} — ${msg}`);
      failed++;
    }
  }

  console.log(`\n완료: 성공 ${success}건 / 실패 ${failed}건`);
  if (SHOULD_EMBED) {
    console.log(`임베딩: 생성 ${embedded}건 / 실패 ${embedFailed}건`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
