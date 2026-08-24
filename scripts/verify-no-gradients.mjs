/**
 * Enforces Design System prohibition #1: no gradients, anywhere.
 *
 * Tailwind v4 removed `corePlugins`, so the gradient utilities cannot be
 * deleted at the framework level the way v3 allowed. This script is the
 * ONLY thing enforcing the rule — see Design System 4.4.
 *
 * Two spellings, both banned:
 *   - raw CSS functions: linear-gradient() / radial-gradient() / conic-gradient()
 *   - v4 utility classes: bg-linear-* / bg-radial* / bg-conic*
 *
 * Gradient colour stops (from-*, via-*, to-*) emit nothing without one of the
 * three bg- utilities, so matching those three is both sufficient and precise.
 *
 * Run: node scripts/verify-no-gradients.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const SOURCE_DIRS = ['src'];
const BUILD_DIR = 'dist';
const SOURCE_EXT = new Set([
  '.astro',
  '.css',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.md',
  '.mdx',
  '.json',
]);

const RAW = /(linear|radial|conic)-gradient/;
const UTILITY = /\bbg-(linear|radial|conic)\b/;

function walk(dir, keep) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, keep));
    else if (keep(full)) out.push(full);
  }
  return out;
}

const hits = [];

/**
 * Blanks out /* *\/ comment bodies, preserving newlines so line numbers stay
 * correct. Applied ONLY to .css files: those are outside Tailwind's @source
 * glob, so a class name in a CSS comment cannot generate anything. Comments
 * in .astro/.tsx ARE scanned by Tailwind — a class name in one of those does
 * emit real CSS — so they are deliberately left in scope.
 */
function blankCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function scan(files, patterns) {
  for (const file of files) {
    let text = readFileSync(file, 'utf8');
    if (extname(file) === '.css') text = blankCssComments(text);
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      for (const [label, re] of patterns) {
        if (re.test(line)) {
          hits.push({ file, line: i + 1, label, text: line.trim().slice(0, 110) });
        }
      }
    });
  }
}

// Source: both spellings.
const SELF = new Set([]);
for (const dir of SOURCE_DIRS) {
  if (!existsSync(dir)) continue;
  const files = walk(dir, (f) => SOURCE_EXT.has(extname(f)) && !SELF.has(f));
  scan(files, [
    ['raw gradient function', RAW],
    ['v4 gradient utility', UTILITY],
  ]);
}

// Built CSS: only the raw functions — class names are gone by this point.
if (existsSync(BUILD_DIR)) {
  scan(
    walk(BUILD_DIR, (f) => extname(f) === '.css'),
    [['raw gradient function in built CSS', RAW]],
  );
} else {
  console.warn(
    `  ! ${BUILD_DIR}/ not present — run \`pnpm build\` first to check the built CSS too.`,
  );
}

if (hits.length) {
  console.error(
    `\n✗ Gradients found (${hits.length}) — Design System prohibition #1 is absolute:\n`,
  );
  for (const h of hits) console.error(`  ${h.file}:${h.line}  [${h.label}]\n    ${h.text}`);
  console.error('');
  process.exit(1);
}
console.log('✓ No gradients in src/ or built CSS.');
