/**
 * Verifies the Tailwind v4 theme still matches the Design System.
 *
 * Three failure modes this catches, all of which are silent — the build
 * succeeds and the site just looks wrong:
 *
 *  1. base.css drifts from Design System 4.2.
 *  2. A `--namespace-*: initial` line goes missing, letting Tailwind's full
 *     default scale leak back in (every default colour, the dynamic spacing
 *     scale, extra breakpoints).
 *  3. `@theme static` loses its `static`, tree-shaking every token that no
 *     utility happens to reference.
 *
 * Run: node scripts/verify-theme.mjs
 */
import { readFileSync } from 'node:fs';

const SPEC = 'docs/design-system-portfolio-website.md';
const CSS = 'src/styles/base.css';

const fail = [];
const css = readFileSync(CSS, 'utf8');

// --- 1. base.css matches the spec block verbatim -------------------------
const doc = readFileSync(SPEC, 'utf8');
const section = doc.slice(
  doc.indexOf('### 4.2 Required base stylesheet'),
  doc.indexOf('### 4.3 Wiring Tailwind'),
);
const specCss = /```css\n([\s\S]*?)\n```/.exec(section)?.[1];

if (!specCss) {
  fail.push(`Could not find the CSS block in ${SPEC} section 4.2.`);
} else if (specCss.trim() !== css.trim()) {
  fail.push(
    `${CSS} has drifted from ${SPEC} section 4.2.\n` +
      `    Design System is the authority: copy the spec block into the stylesheet,\n` +
      `    or change the spec first if the token itself is meant to change.`,
  );
}

// --- 2. every namespace is wiped before its tokens are declared ----------
// Miss one and Tailwind's default scale silently returns.
const WIPED = [
  '--color-*',
  '--font-*',
  '--text-*',
  '--font-weight-*',
  '--radius-*',
  '--shadow-*',
  '--ease-*',
  '--breakpoint-*',
  '--container-*',
  '--blur-*',
];
// Anchored to a real declaration at the start of a line. A substring match
// would also hit these token names where they appear inside the explanatory
// comments in this same file, which makes the check silently useless.
const declared = (name) =>
  new RegExp(`^\\s*${name.replace(/[*]/g, '\\*')}:\\s*initial\\s*;`, 'm').test(css);

for (const ns of WIPED) {
  if (!declared(ns)) {
    fail.push(`Namespace ${ns} is not wiped with \`initial\` — Tailwind's defaults leak back in.`);
  }
}
// --spacing has no trailing star: it disables the dynamic scale (p-5, gap-7).
if (!declared('--spacing')) {
  fail.push(
    "`--spacing: initial` is missing — v4's dynamic spacing scale is active, so p-5 and gap-7 exist.",
  );
}

// --- 3. @theme static ----------------------------------------------------
if (!/@theme\s+static\s*\{/.test(css)) {
  fail.push(
    '@theme is missing the `static` keyword — unreferenced tokens get tree-shaken,\n' +
      '    so hand-written CSS like the glass recipe resolves var(--color-*) to nothing.',
  );
}

// --- report --------------------------------------------------------------
if (fail.length) {
  console.error(`\n✗ Theme verification failed (${fail.length}):\n`);
  for (const f of fail) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}
console.log('✓ Theme verified: matches Design System 4.2, all namespaces wiped, @theme static.');
