/**
 * countEventFiles — data/events/ 디렉토리 파일 수 카운팅 유틸리티
 *
 * 템플릿 파일(언더스코어로 시작하는 파일, 예: _template.json)을 제외하고
 * data/events/ 디렉토리의 .json 파일 수를 반환한다.
 */

import { readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Default path to data/events/ relative to this module's location.
 * packages/shared/src/ -> ../../.. -> repo root -> data/events
 */
const DEFAULT_EVENTS_DIR = resolve(__dirname, "../../../data/events");

/**
 * Count non-template JSON files in the given events directory.
 *
 * A file is excluded from the count when:
 *  - it does not end with `.json`, or
 *  - its basename starts with `_` (template convention)
 *
 * @param eventsDir  Directory to scan (default: data/events/ in repo root)
 * @returns          Number of curated event JSON files
 */
export function countEventFiles(eventsDir: string = DEFAULT_EVENTS_DIR): number {
  const entries = readdirSync(eventsDir);
  return entries.filter(
    (file) => file.endsWith(".json") && !file.startsWith("_")
  ).length;
}
