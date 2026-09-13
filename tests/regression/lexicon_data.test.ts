/**
 * Regression: data/lexicon/*.json 스키마 검증 (ADR-0004)
 *
 * 표현 사전은 사건 DB보다 법적으로 민감하다. 잘못된 정규식 하나가 런타임에서
 * 조용히 무시되거나, 출처 없는 항목이 approved 로 새어나가지 않게 막는다.
 * 사전이 비어 있어도(초안 작성 전) 통과한다.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateLexiconEntries } from "../../packages/shared/src/validateLexiconSchema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEXICON_DIR = resolve(__dirname, "../../data/lexicon");

/** apps/web/lib/expression-lexicon.ts 가 정적 import 하는 파일 목록과 동일해야 한다. */
const LEXICON_FILES = ["community.json", "gender.json", "region.json"];

function readEntries(fileName: string): unknown[] {
  const raw = readFileSync(resolve(LEXICON_DIR, fileName), "utf-8");
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed), `${fileName} must contain a JSON array`);
  return parsed as unknown[];
}

describe("data/lexicon 스키마", () => {
  for (const fileName of LEXICON_FILES) {
    it(`${fileName} passes validateLexiconEntries`, () => {
      const errors = validateLexiconEntries(readEntries(fileName), { label: fileName });
      assert.deepEqual(errors, [], errors.join("\n"));
    });
  }

  it("keys are unique across every lexicon file", () => {
    const all = LEXICON_FILES.flatMap(readEntries);
    const errors = validateLexiconEntries(all, { label: "lexicon" }).filter((e) =>
      e.includes("duplicated")
    );
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});
