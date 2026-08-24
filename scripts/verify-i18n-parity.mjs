/**
 * Asserts the two UI dictionaries stay structurally identical.
 *
 * A key present in en.json but missing from sr.json means a Serbian visitor
 * hits a raw key or an English string mid-page. Design System 9.5 forbids a
 * silent fallback in production, so this fails the build instead.
 *
 * Also checks value TYPES match: `hero.availability.enabled` is a boolean in
 * both, and a string in one and a boolean in the other would break rendering
 * in only one language — exactly the kind of asymmetry that survives review.
 *
 * Run: node scripts/verify-i18n-parity.mjs
 */
import { readFileSync } from 'node:fs';

const EN = 'src/content/i18n/en.json';
const SR = 'src/content/i18n/sr.json';

const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Flattens to `a.b.c` -> typeof value, so structure and shape are comparable. */
function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.set(key, 'object');
      flatten(v, key, out);
    } else {
      out.set(key, Array.isArray(v) ? 'array' : typeof v);
    }
  }
  return out;
}

const en = flatten(load(EN));
const sr = flatten(load(SR));

const fail = [];

const missingInSr = [...en.keys()].filter((k) => !sr.has(k));
const missingInEn = [...sr.keys()].filter((k) => !en.has(k));
const typeMismatch = [...en.entries()]
  .filter(([k, t]) => sr.has(k) && sr.get(k) !== t)
  .map(([k, t]) => `${k}: en=${t}, sr=${sr.get(k)}`);

if (missingInSr.length)
  fail.push(`Missing from sr.json (${missingInSr.length}):\n      ${missingInSr.join('\n      ')}`);
if (missingInEn.length)
  fail.push(`Missing from en.json (${missingInEn.length}):\n      ${missingInEn.join('\n      ')}`);
if (typeMismatch.length)
  fail.push(`Type mismatches (${typeMismatch.length}):\n      ${typeMismatch.join('\n      ')}`);

// Empty strings are legal (optional subheads), but a key that is empty in one
// language and populated in the other is almost always an oversight.
const en2 = load(EN);
const sr2 = load(SR);
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const lopsided = [...en.entries()]
  .filter(([k, t]) => t === 'string' && sr.get(k) === 'string')
  .filter(([k]) => {
    const a = get(en2, k).trim();
    const b = get(sr2, k).trim();
    return (a === '') !== (b === '');
  })
  .map(([k]) => k);
if (lopsided.length) {
  fail.push(`Empty in one language only (${lopsided.length}):\n      ${lopsided.join('\n      ')}`);
}

if (fail.length) {
  console.error(`\n✗ i18n parity failed:\n`);
  for (const f of fail) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}

// TODO(human) markers are expected until Phase 9; surface the count, don't fail.
const todos = [...en.entries()]
  .filter(([k, t]) => t === 'string')
  .filter(([k]) => get(en2, k).includes('TODO(human)') || get(sr2, k).includes('TODO(human)'))
  .map(([k]) => k);

console.log(`✓ i18n parity: ${en.size} keys, identical structure and value types.`);
if (todos.length) {
  console.log(
    `  ${todos.length} keys still marked TODO(human) — must be zero before launch (plan 9.2):`,
  );
  for (const t of todos) console.log(`    ${t}`);
}
