/**
 * Validation test for PMF qualitative interview artifacts (AC: pmm_interviews_5)
 *
 * Verifies:
 * 1. docs/interviews/ contains exactly 5 individual interview files (interview_01.md ~ interview_05.md)
 * 2. docs/interviews/summary.md exists
 * 3. summary.md contains at least 3 "YES" positive-response markers
 * 4. summary.md contains at least 3 quotable_excerpt markers
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n=== Nunchi — PMF Interview Artifact Validation ===\n');

// --- Test 1: Individual interview files exist ---
console.log('1. Checking individual interview files...');
const expectedFiles = [
  'docs/interviews/interview_01.md',
  'docs/interviews/interview_02.md',
  'docs/interviews/interview_03.md',
  'docs/interviews/interview_04.md',
  'docs/interviews/interview_05.md',
];

for (const file of expectedFiles) {
  const fullPath = resolve(ROOT, file);
  assert(existsSync(fullPath), `${file} exists`);
}

// --- Test 2: Summary file exists ---
console.log('\n2. Checking summary file...');
const summaryPath = resolve(ROOT, 'docs/interviews/summary.md');
assert(existsSync(summaryPath), 'docs/interviews/summary.md exists');

const summaryContent = existsSync(summaryPath)
  ? readFileSync(summaryPath, 'utf-8')
  : '';

// --- Test 3: At least 3 YES responses in summary ---
console.log('\n3. Checking positive response count (minimum 3)...');
const yesMatches = summaryContent.match(/✅ YES/g) || [];
assert(
  yesMatches.length >= 3,
  `At least 3 "✅ YES" responses found (found: ${yesMatches.length})`
);

// --- Test 4: At least 3 quotable excerpts in summary ---
console.log('\n4. Checking quotable excerpts (minimum 3)...');
const excerptMatches = summaryContent.match(/quotable_excerpt_\d+/g) || [];
assert(
  excerptMatches.length >= 3,
  `At least 3 quotable_excerpt markers found (found: ${excerptMatches.length})`
);

// --- Test 5: Each interview file contains persona info and verdict ---
console.log('\n5. Checking interview file content structure...');
for (const file of expectedFiles) {
  const fullPath = resolve(ROOT, file);
  if (!existsSync(fullPath)) continue;
  const content = readFileSync(fullPath, 'utf-8');
  assert(
    content.includes('## 페르소나 정보'),
    `${file} contains 페르소나 정보 section`
  );
  assert(
    content.includes('## 요약'),
    `${file} contains 요약 (summary) section`
  );
  assert(
    content.includes('예방 가치 인정'),
    `${file} contains 예방 가치 인정 verdict`
  );
}

// --- Test 6: PMF conclusion in summary states 충분 ---
console.log('\n6. Checking PMF conclusion...');
assert(
  summaryContent.includes('충분'),
  'summary.md PMF conclusion states "충분" (Sufficient)'
);

// --- Final result ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ All interview artifact validations passed.\n');
  process.exit(0);
}
