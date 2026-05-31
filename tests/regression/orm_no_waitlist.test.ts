/**
 * Sub-AC 3b — ORM/query-layer scanner: no waitlist table or column references
 *
 * Scans every TypeScript/JavaScript source file in the monorepo's apps/ and
 * packages/ directories and asserts that no file (outside the explicitly
 * excluded legacy waitlist implementation module) contains an ORM query call,
 * import statement, known function call, or raw SQL query string that
 * references the `waitlist` table or column.
 *
 * The test FAILS if any such reference is detected outside the excluded module.
 *
 * Exclusions:
 *   - apps/web/lib/waitlist.ts: the isolated legacy implementation module that
 *     is pending full removal. It is deliberately excluded here because the
 *     scanner's purpose is to prevent UNINTENTIONAL references in production
 *     application code. The legacy module itself is referenced only by its own
 *     regression test suite (tests/regression/waitlist*.test.ts) and is not
 *     imported anywhere in the active application code.
 *   - node_modules/, .next/, dist/, build/, .turbo/: generated or third-party
 *     directories that are not authored source code.
 *
 * Run: tsx --test regression/orm_no_waitlist.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join, extname, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ---------------------------------------------------------------------------
// Scan configuration
// ---------------------------------------------------------------------------

/** Top-level directories to scan (relative to monorepo root). */
const SOURCE_DIRS: string[] = ["apps", "packages"];

/** File extensions that constitute TypeScript/JavaScript source. */
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);

/**
 * Workspace-relative paths that are explicitly excluded from the scan.
 *
 * apps/web/lib/waitlist.ts is the isolated legacy waitlist implementation
 * module. It is excluded because:
 *   1. It is a known, deliberate legacy artifact — not an accidental reference.
 *   2. Its regression tests (tests/regression/waitlist*.test.ts) still import
 *      from it and must remain green during the Beta transition.
 *   3. No other file in apps/ or packages/ imports from it; it is already
 *      isolated and not wired into any active application code path.
 *   4. The goal of THIS scanner is to guard against UNINTENTIONAL waitlist
 *      ORM usage appearing in new production code.
 *
 * When the module is eventually deleted, remove it from this set.
 */
const EXCLUDED_RELATIVE_PATHS = new Set<string>([
  "apps/web/lib/waitlist.ts",
]);

/**
 * Directory names that are never descended into.
 * These contain generated output or third-party code, not authored source.
 */
const EXCLUDED_DIR_NAMES = new Set<string>([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  ".git",
  "__pycache__",
]);

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

/**
 * Recursively collect all TypeScript/JavaScript source files under a
 * directory, honouring the exclusion lists above.
 *
 * @param dir  Absolute path to the directory to scan.
 * @returns    Sorted array of absolute file paths.
 */
function collectSourceFiles(dir: string): string[] {
  const result: string[] = [];

  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...collectSourceFiles(fullPath));
    } else if (
      entry.isFile() &&
      SCAN_EXTENSIONS.has(extname(entry.name).toLowerCase())
    ) {
      const relPath = relative(ROOT, fullPath).replace(/\\/g, "/");
      if (!EXCLUDED_RELATIVE_PATHS.has(relPath)) {
        result.push(fullPath);
      }
    }
  }

  return result.sort();
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface WaitlistPattern {
  /** Human-readable label used in violation reports. */
  label: string;
  /** Regex tested against each line of the file content. */
  regex: RegExp;
}

/**
 * Each pattern targets one way that a TypeScript/JavaScript source file could
 * reference the `waitlist` table or column in the ORM/query layer:
 *
 *  1. Supabase ORM table argument:  .from("waitlist") / .from('waitlist')
 *  2. Import of the waitlist module:  from "…/waitlist"
 *  3. Calls to known waitlist ORM helper functions
 *  4. Raw SQL string literals targeting the waitlist table
 */
const WAITLIST_PATTERNS: WaitlistPattern[] = [
  // ── 1. ORM table query argument ─────────────────────────────────────────
  {
    label: 'Supabase/ORM table query — .from("waitlist")',
    regex: /\.from\s*\(\s*["'`]waitlist["'`]\s*\)/,
  },

  // ── 2. Module import ──────────────────────────────────────────────────────
  {
    label: "ES import from waitlist module path",
    regex: /from\s+["'`][^"'`]*[/\\]waitlist(?:\.(?:ts|tsx|js|mjs))?["'`]/,
  },
  {
    label: "require() of waitlist module path",
    regex: /require\s*\(\s*["'`][^"'`]*[/\\]waitlist(?:\.(?:ts|tsx|js|mjs))?["'`]\s*\)/,
  },

  // ── 3. Calls to known waitlist ORM/helper functions ───────────────────────
  {
    label: "Function call — upsertWaitlistEmail()",
    regex: /\bupsertWaitlistEmail\s*\(/,
  },
  {
    label: "Function call — getWaitlistCount()",
    regex: /\bgetWaitlistCount\s*\(/,
  },
  {
    label: "Function call — handleWaitlistPost()",
    regex: /\bhandleWaitlistPost\s*\(/,
  },
  {
    label: "Function call — callWaitlistApi()",
    regex: /\bcallWaitlistApi\s*\(/,
  },
  {
    label: "Function call — sendWaitlistConfirmationEmail()",
    regex: /\bsendWaitlistConfirmationEmail\s*\(/,
  },

  // ── 4. Raw SQL query strings targeting the waitlist table ─────────────────
  {
    label: "SQL — INSERT INTO waitlist",
    regex: /INSERT\s+(?:IGNORE\s+)?INTO\s+["'`]?waitlist["'`]?\s*(?:\(|;|$)/i,
  },
  {
    label: "SQL — SELECT … FROM waitlist",
    regex: /\bFROM\s+["'`]?waitlist["'`]?\s*(?:WHERE|LIMIT|ORDER|GROUP|JOIN|;|$)/i,
  },
  {
    label: "SQL — UPDATE waitlist",
    regex: /\bUPDATE\s+["'`]?waitlist["'`]?\s+SET\b/i,
  },
  {
    label: "SQL — DELETE FROM waitlist",
    regex: /DELETE\s+FROM\s+["'`]?waitlist["'`]?\s*(?:WHERE|;|$)/i,
  },
  {
    label: "SQL — CREATE TABLE waitlist",
    regex: /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?waitlist["'`]?\s*\(/i,
  },
  {
    label: "SQL — ALTER TABLE waitlist",
    regex: /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?["'`]?waitlist["'`]?\b/i,
  },
];

// ---------------------------------------------------------------------------
// Per-file violation detection
// ---------------------------------------------------------------------------

interface Violation {
  /** Workspace-relative file path. */
  file: string;
  /** The pattern label that triggered this violation. */
  pattern: string;
  /** 1-based line number within the file. */
  lineNumber: number;
  /** Trimmed source line (capped for readability). */
  line: string;
}

/**
 * Scan a single source file for waitlist ORM/query patterns.
 *
 * @param absPath  Absolute file path to scan.
 * @returns        Array of violations found (empty when the file is clean).
 */
function checkFile(absPath: string): Violation[] {
  let content: string;
  try {
    content = readFileSync(absPath, "utf-8");
  } catch {
    return [];
  }

  const relPath = relative(ROOT, absPath).replace(/\\/g, "/");
  const violations: Violation[] = [];
  const lines = content.split("\n");

  for (const { label, regex } of WAITLIST_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        violations.push({
          file: relPath,
          pattern: label,
          lineNumber: i + 1,
          line: lines[i].trim().slice(0, 120),
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Collect source files (once, at module evaluation time for all tests to share)
// ---------------------------------------------------------------------------

const SOURCE_FILES: string[] = [];
for (const dir of SOURCE_DIRS) {
  SOURCE_FILES.push(...collectSourceFiles(join(ROOT, dir)));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe(
  "Sub-AC 3b — ORM/query-layer scanner: no waitlist table or column in apps/ and packages/",
  () => {
    // ── Setup sanity checks ───────────────────────────────────────────────

    it("scanner collects at least one source file (scan is non-empty)", () => {
      assert.ok(
        SOURCE_FILES.length > 0,
        `Expected to find TypeScript/JavaScript source files under ` +
          `${SOURCE_DIRS.join(", ")}, but found none. ` +
          "Verify that SOURCE_DIRS contains valid paths."
      );
    });

    it("apps/ directory is represented in the scanned file list", () => {
      const hasApps = SOURCE_FILES.some((f) =>
        relative(ROOT, f).replace(/\\/g, "/").startsWith("apps/")
      );
      assert.ok(
        hasApps,
        "No source files found under apps/ — verify the directory exists " +
          "and contains .ts / .tsx / .js / .mjs files."
      );
    });

    it("packages/ directory is represented in the scanned file list", () => {
      const hasPkgs = SOURCE_FILES.some((f) =>
        relative(ROOT, f).replace(/\\/g, "/").startsWith("packages/")
      );
      assert.ok(
        hasPkgs,
        "No source files found under packages/ — verify the directory " +
          "exists and contains .ts / .tsx / .js / .mjs files."
      );
    });

    it("excluded legacy waitlist module exists on disk (exclusion is still valid)", () => {
      for (const relPath of EXCLUDED_RELATIVE_PATHS) {
        const absPath = join(ROOT, relPath);
        assert.ok(
          existsSync(absPath),
          `Excluded legacy module is listed in EXCLUDED_RELATIVE_PATHS but was ` +
            `not found on disk: ${relPath}. ` +
            "If the file has been deleted, remove it from EXCLUDED_RELATIVE_PATHS."
        );
      }
    });

    it(
      "excluded legacy waitlist module is NOT imported or referenced " +
        "by any other file in apps/ or packages/",
      () => {
        // Build an import-path pattern for each excluded module
        // e.g. apps/web/lib/waitlist.ts → looks for "waitlist" or "./waitlist"
        // patterns in non-excluded files.
        const importViolations: Violation[] = [];

        for (const absPath of SOURCE_FILES) {
          let content: string;
          try {
            content = readFileSync(absPath, "utf-8");
          } catch {
            continue;
          }

          const relPath = relative(ROOT, absPath).replace(/\\/g, "/");
          const lines = content.split("\n");

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check: does any non-excluded file import from the waitlist module?
            if (
              /from\s+["'`][^"'`]*[/\\]waitlist(?:\.(?:ts|tsx|js|mjs))?["'`]/.test(line) ||
              /require\s*\(\s*["'`][^"'`]*[/\\]waitlist(?:\.(?:ts|tsx|js|mjs))?["'`]\s*\)/.test(line)
            ) {
              importViolations.push({
                file: relPath,
                pattern: "Import of waitlist module from non-waitlist source file",
                lineNumber: i + 1,
                line: line.trim().slice(0, 120),
              });
            }
          }
        }

        const report = importViolations
          .map((v) => `  ${v.file}:${v.lineNumber}\n    > ${v.line}`)
          .join("\n\n");

        assert.equal(
          importViolations.length,
          0,
          `${importViolations.length} source file(s) in apps/ or packages/ import ` +
            `from the deprecated waitlist module.\n\n` +
            `All such imports must be removed so the waitlist ORM layer is ` +
            `fully isolated:\n\n${report}`
        );
      }
    );

    // ── Main scan: no waitlist ORM references in any non-excluded file ────

    it(
      "no scanned source file contains an ORM query, import, function call, " +
        "or SQL query string referencing the waitlist table or column",
      () => {
        const allViolations: Violation[] = [];

        for (const absPath of SOURCE_FILES) {
          allViolations.push(...checkFile(absPath));
        }

        if (allViolations.length === 0) {
          return; // clean — test passes
        }

        const uniqueFiles = [...new Set(allViolations.map((v) => v.file))];
        const report = allViolations
          .map(
            (v) =>
              `  ${v.file}:${v.lineNumber} — [${v.pattern}]\n` +
              `    > ${v.line}`
          )
          .join("\n\n");

        assert.fail(
          `ORM/query-layer waitlist reference(s) detected in ` +
            `${allViolations.length} location(s) across ` +
            `${uniqueFiles.length} file(s).\n\n` +
            "No waitlist table or column references are permitted in apps/ or " +
            "packages/ source code outside the excluded legacy module " +
            "(apps/web/lib/waitlist.ts).\n\n" +
            "Violations:\n\n" +
            report
        );
      }
    );
  }
);
