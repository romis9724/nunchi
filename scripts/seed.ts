import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import type { EventRecord } from "@nunchi/shared";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  console.error("   apps/web/.env.local 파일을 확인해주세요.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function main() {
  const events = loadEvents();
  console.log(`\nSeeding ${events.length}건 → Supabase (${supabaseUrl})\n`);

  let success = 0;
  let failed = 0;

  for (const event of events) {
    const { error } = await supabase
      .from("events")
      .upsert(
        {
          slug:             event.slug,
          date_type:        event.date_type,
          month:            event.month,
          day:              event.day ?? null,
          day_end:          event.day_end ?? null,
          country:          event.country,
          name:             event.name,
          name_en:          event.name_en ?? null,
          category:         event.category,
          risk_level:       event.risk_level,
          summary:          event.summary,
          related_keywords: event.related_keywords,
          related_motifs:   event.related_motifs,
          recommended_tone: event.recommended_tone,
          references:       event.references,
        },
        { onConflict: "slug" }
      );

    if (error) {
      console.error(`  ✗ ${event.name} — ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${event.name}`);
      success++;
    }
  }

  console.log(`\n완료: 성공 ${success}건 / 실패 ${failed}건`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
