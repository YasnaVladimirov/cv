/**
 * Asserts that no placeholder content remains anywhere a visitor can reach.
 *
 * Phase 9's first verification item is "zero fixture content remains". That is
 * a claim someone has to check, and reading every file by eye is exactly the
 * check that gets skipped on the day it matters. So it is code.
 *
 * Two markers are load-bearing and deliberate:
 *   FIXTURE      — seeded through the content collections in Phase 2
 *   TODO(human)  — seeded through the i18n dictionaries in Phase 3
 * Neither string occurs in real content, so a hit is never a false positive.
 *
 * Also flags the stub CV PDFs. They are 193-byte generated files; no typeset
 * CV is that small, so size alone separates a stub from the real thing.
 *
 * NOT in `verify:source` yet — it fails by design until Phase 9.2 lands the
 * real content, and a gate that is red on every commit trains people to
 * ignore it. Plan 9.3 wires it into the blocking set once it can pass.
 *
 * Run: node scripts/verify-no-fixtures.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/** Markers that only ever appear in seeded placeholder content. */
const MARKERS = [/FIXTURE/, /TODO\(human\)/];

/** Trees whose every file is visitor-facing content. */
const ROOTS = ['src/content'];

/** Read as text; anything else is checked by name and size, not content. */
const TEXT = new Set(['.json', '.mdx', '.md', '.yaml', '.yml', '.txt']);

/**
 * A real CV is a typeset multi-page document. The seeded stubs are 193 bytes.
 * Anything under this cannot be a CV, and anything over it is not our business.
 */
const MIN_PDF_BYTES = 5_000;
const PDFS = ['public/cv.pdf', 'public/cv-sr.pdf'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const fail = [];

// 1. Placeholder markers in content text.
for (const root of ROOTS) {
  for (const path of walk(root)) {
    if (!TEXT.has(extname(path))) continue;
    const lines = readFileSync(path, 'utf8').split('\n');
    const hits = lines
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => MARKERS.some((m) => m.test(line)));
    if (hits.length) {
      fail.push(
        `${path} — ${hits.length} placeholder line${hits.length === 1 ? '' : 's'}:`,
        ...hits.slice(0, 5).map(({ n, line }) => `    ${n}: ${line.trim().slice(0, 90)}`),
        ...(hits.length > 5 ? [`    … and ${hits.length - 5} more`] : []),
      );
    }
  }
}

// 2. Stub CV PDFs. Missing is as bad as stubbed — the hero links to both.
for (const pdf of PDFS) {
  let size;
  try {
    size = statSync(pdf).size;
  } catch {
    fail.push(`${pdf} — missing; the hero resume CTA links to it`);
    continue;
  }
  if (size < MIN_PDF_BYTES) {
    fail.push(`${pdf} — ${size} bytes, still the generated stub (expected a real CV)`);
  }
}

// 3. Fixture-named files that should have been deleted, not emptied (plan 9.2).
const strays = walk('src/content').filter((p) => /fixture/i.test(p));
if (strays.length) {
  fail.push(
    'Fixture files still present — plan 9.2 says delete them, do not empty them:',
    ...strays.map((p) => `    ${p}`),
  );
}

if (fail.length) {
  console.error('verify-no-fixtures: placeholder content still present\n');
  console.error(fail.join('\n'));
  console.error('\nEvery item above is visible to a visitor. Replace or remove it.');
  process.exit(1);
}

console.log('verify-no-fixtures: no placeholder content found');
