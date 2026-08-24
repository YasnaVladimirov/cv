/**
 * Asserts the glass recipe survives the build (Design System §3.6, §10.4–10.5).
 *
 * Every other check in this repo reads source. This one reads `dist/`, because
 * the failure it exists for happens *after* source is correct: the CSS
 * minifier decides one of the two `backdrop-filter` declarations is redundant
 * and deletes it. Source is right, the build is green, and glass silently
 * loses its blur on a browser inside the supported range — Firefox if the
 * unprefixed form goes, Safari 16.4–17 if the prefixed one does.
 *
 * The `@supports not (backdrop-filter)` fallback does not catch it. Those
 * browsers DO support the property; they simply never received the spelling
 * they understand. So the panel keeps its 0.55-alpha background with nothing
 * blurred behind it, which is the contrast failure §10.1 is written to
 * prevent — and no automated a11y check would see it, since Lighthouse runs
 * Chrome.
 *
 * Run AFTER `pnpm build`: node scripts/verify-css-output.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ not found — run \`pnpm build\` first.`);
  process.exit(1);
}

function cssFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cssFiles(path));
    else if (entry.name.endsWith('.css')) out.push(path);
  }
  return out;
}

const files = cssFiles(DIST);
if (files.length === 0) {
  console.error(`✗ No stylesheet in ${DIST}/ — the theme did not reach the build.`);
  process.exit(1);
}

const css = files.map((f) => readFileSync(f, 'utf8')).join('\n');
const fail = [];

/** Both spellings, for each of the two glass strengths. */
for (const [label, blurVar] of [
  ['glass', '--glass-blur)'],
  ['glass-strong', '--glass-blur-strong)'],
]) {
  for (const prop of ['-webkit-backdrop-filter', 'backdrop-filter']) {
    // `-webkit-backdrop-filter` contains `backdrop-filter`, so the unprefixed
    // check has to require something that is NOT the prefix in front of it.
    const re =
      prop === 'backdrop-filter'
        ? new RegExp(`(?<!-)\\bbackdrop-filter:\\s*blur\\(var\\(${blurVar.replace(')', '\\)')}`)
        : new RegExp(`-webkit-backdrop-filter:\\s*blur\\(var\\(${blurVar.replace(')', '\\)')}`);
    if (!re.test(css)) {
      fail.push(
        `.${label} is missing \`${prop}\` in the built CSS. The minifier dropped it — ` +
          `check vite.build.target in astro.config.mjs still names the §4.5 browser floor.`,
      );
    }
  }
}

/** The two mandatory fallbacks (§10.4, §10.5). */
if (!/@supports\s+not\s*\(/.test(css) || !css.includes('backdrop-filter')) {
  fail.push(
    'The `@supports not (backdrop-filter)` fallback is missing from the built CSS (§10.4).',
  );
}
if (!css.includes('prefers-reduced-transparency')) {
  fail.push('The `prefers-reduced-transparency` fallback is missing from the built CSS (§10.5).');
}

if (fail.length) {
  console.error(`\n✗ Glass recipe damaged in the build (${fail.length}):\n`);
  for (const f of fail) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}
console.log(
  '✓ Built CSS verified: both backdrop-filter spellings and both glass fallbacks survive.',
);
