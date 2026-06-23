/**
 * run-eval — the per-anniversary automated evaluation harness (main runner).
 *
 * REQUIRES a live RDS (pg) + Ollama (qwen3:8b) — i.e. EC2. Locally this only
 * type-checks; the Stage-0 pure-function tests under `lib/*.test.ts` cover the
 * deterministic logic without any backend.
 *
 * Flow:
 *   loadEvents → generateCases → for each case: runReviewEngine(skipCache) →
 *   structure-gate → (benign / rule-gap-banned) judgeRationale → report.
 *
 * Output (per round N):
 *   reports/round-N.json  — full raw records
 *   reports/round-N.md    — human summary
 *
 * Env: DATABASE_URL, PGSSL, OLLAMA_BASE_URL, OLLAMA_MODEL (default qwen3:8b).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { CheckResponse } from "@noonchi/shared";

import { runReviewEngine } from "../../apps/web/lib/review-engine.js";
import { loadEvents } from "./lib/classify-events.js";
import { generateCases } from "./lib/generate-cases.js";
import type { EvalCase } from "./lib/generate-cases.js";
import { evaluateStructure } from "./lib/structure-gate.js";
import type { StructureResult } from "./lib/structure-gate.js";
import { judgeRationale } from "./prompts/judge.js";
import type { JudgeVerdict } from "./prompts/judge.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_EVENTS_DIR = path.resolve(HERE, "../../data/events");
const REPORTS_DIR = path.resolve(HERE, "reports");

const DEFAULT_ROUND = 1;
const DEFAULT_CONCURRENCY = 4;
const LOWEST_RATIONALES_IN_REPORT = 5;

interface CliArgs {
  round: number;
  concurrency: number;
  limit?: number;
  eventsDir: string;
}

interface CaseRecord {
  id: string;
  eventSlug: string;
  kind: EvalCase["kind"];
  request: EvalCase["request"];
  response?: CheckResponse;
  structure: StructureResult;
  judge?: JudgeVerdict;
  error?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    round: DEFAULT_ROUND,
    concurrency: DEFAULT_CONCURRENCY,
    eventsDir: DEFAULT_EVENTS_DIR,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case "--round":
        args.round = Number(value);
        i++;
        break;
      case "--concurrency":
        args.concurrency = Math.max(1, Number(value));
        i++;
        break;
      case "--limit":
        args.limit = Number(value);
        i++;
        break;
      case "--events-dir":
        args.eventsDir = path.resolve(process.cwd(), value);
        i++;
        break;
      default:
        break;
    }
  }
  return args;
}

function ollamaConfig(): { baseUrl: string; model: string } {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
  };
}

/** Run one case end-to-end: engine → structure gate → (maybe) judge. */
async function runCase(evalCase: EvalCase): Promise<CaseRecord> {
  const base: Pick<CaseRecord, "id" | "eventSlug" | "kind" | "request"> = {
    id: evalCase.id,
    eventSlug: evalCase.eventSlug,
    kind: evalCase.kind,
    request: evalCase.request,
  };

  let response: CheckResponse;
  try {
    response = await runReviewEngine(evalCase.request, { skipCache: true });
  } catch (err) {
    return {
      ...base,
      structure: {
        pass: false,
        failures: [
          `engine threw: ${err instanceof Error ? err.message : String(err)}`,
        ],
        softWarnings: [],
      },
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const structure = evaluateStructure(evalCase, response);

  let judge: JudgeVerdict | undefined;
  if (evalCase.qualitative.applicable && !response.ruleTriggered) {
    const cfg = ollamaConfig();
    judge = await judgeRationale(
      {
        date: evalCase.request.date,
        copy: evalCase.request.copy,
        eventName: evalCase.qualitative.mustIdentifyEvent ?? evalCase.eventSlug,
        eventSummary: "",
        recommendedTone: "",
        riskLevel: "",
        rationale: response.rationale,
      },
      cfg
    );
  }

  return { ...base, response, structure, judge };
}

/** Bounded-concurrency map preserving input order. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
      completed++;
      process.stdout.write(
        `\r  progress: ${completed}/${items.length} cases`
      );
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, Math.max(1, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  process.stdout.write("\n");
  return results;
}

function buildMarkdown(round: number, records: CaseRecord[]): string {
  const total = records.length;
  const passed = records.filter((r) => r.structure.pass).length;
  const failed = records.filter((r) => !r.structure.pass);

  const judged = records.filter((r) => r.judge != null);
  const judgeAvg =
    judged.length > 0
      ? Math.round(
          (judged.reduce((acc, r) => acc + (r.judge?.score ?? 0), 0) /
            judged.length) *
            100
        ) / 100
      : 0;

  const lowest = [...judged]
    .sort((a, b) => (a.judge?.score ?? 0) - (b.judge?.score ?? 0))
    .slice(0, LOWEST_RATIONALES_IN_REPORT);

  const softWarnings = records.flatMap((r) =>
    r.structure.softWarnings.map((w) => `- \`${r.eventSlug}\` (${r.kind}): ${w}`)
  );

  const highVariance = judged.filter((r) => r.judge?.highVariance);

  const lines: string[] = [];
  lines.push(`# Eval Report — Round ${round}`);
  lines.push("");
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Structure pass: **${passed}/${total}**`);
  lines.push(
    `- Qualitative (judge) average: **${judgeAvg}/5** over ${judged.length} judged case(s)`
  );
  lines.push("");

  lines.push(`## Structure failures (${failed.length})`);
  if (failed.length === 0) {
    lines.push("None — all hard oracles satisfied.");
  } else {
    for (const r of failed) {
      lines.push(
        `- \`${r.eventSlug}\` (${r.kind}): ${r.structure.failures.join("; ")}`
      );
    }
  }
  lines.push("");

  lines.push(`## Lowest-scoring rationales (bottom ${lowest.length})`);
  if (lowest.length === 0) {
    lines.push("No judged cases this round.");
  } else {
    for (const r of lowest) {
      const score = r.judge?.score ?? 0;
      const excerpt = (r.response?.rationale ?? "")
        .replace(/\s+/g, " ")
        .slice(0, 280);
      lines.push(`### \`${r.eventSlug}\` (${r.kind}) — ${score}/5`);
      lines.push(`> ${excerpt || "(empty rationale)"}`);
      if (r.judge?.highVariance) {
        lines.push(`> ⚠️ high variance: raw=${JSON.stringify(r.judge.rawScores)}`);
      }
      lines.push("");
    }
  }

  lines.push(`## Soft warnings (${softWarnings.length})`);
  lines.push(softWarnings.length > 0 ? softWarnings.join("\n") : "None.");
  lines.push("");

  lines.push(`## High-variance judge calls (${highVariance.length})`);
  if (highVariance.length === 0) {
    lines.push("None.");
  } else {
    for (const r of highVariance) {
      lines.push(
        `- \`${r.eventSlug}\` (${r.kind}): raw=${JSON.stringify(r.judge?.rawScores)}`
      );
    }
  }
  lines.push("");

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cfg = ollamaConfig();

  console.log(`[eval] round=${args.round} concurrency=${args.concurrency}`);
  console.log(`[eval] events-dir=${args.eventsDir}`);
  console.log(`[eval] ollama=${cfg.baseUrl} model=${cfg.model}`);
  console.log(`[eval] DATABASE_URL set=${Boolean(process.env.DATABASE_URL)}`);

  const events = loadEvents(args.eventsDir);
  let cases = generateCases(events);
  if (args.limit != null && Number.isFinite(args.limit)) {
    cases = cases.slice(0, args.limit);
  }
  console.log(
    `[eval] ${events.length} events → ${cases.length} cases (running)`
  );

  const records = await mapWithConcurrency(cases, args.concurrency, runCase);

  mkdirSync(REPORTS_DIR, { recursive: true });
  const jsonPath = path.join(REPORTS_DIR, `round-${args.round}.json`);
  const mdPath = path.join(REPORTS_DIR, `round-${args.round}.md`);
  writeFileSync(jsonPath, JSON.stringify(records, null, 2), "utf8");
  writeFileSync(mdPath, buildMarkdown(args.round, records), "utf8");

  const passed = records.filter((r) => r.structure.pass).length;
  console.log(`[eval] structure pass: ${passed}/${records.length}`);
  console.log(`[eval] wrote ${jsonPath}`);
  console.log(`[eval] wrote ${mdPath}`);

  // Non-zero exit when any hard oracle failed, so CI / loops can branch.
  if (passed < records.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[eval] fatal:", err);
  process.exitCode = 1;
});
