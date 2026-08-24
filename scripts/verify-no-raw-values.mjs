/**
 * Asserts component code invents no values (Design System §0, Phase 3 gate).
 *
 * Two different rules, because the two cases are not the same:
 *
 *  1. COLOUR — banned outright. Every colour in this system is a token, with
 *     no exceptions, so any hex literal in a component is by definition a
 *     value someone made up.
 *
 *  2. LENGTH — a px literal is allowed only if the Design System document
 *     itself contains that number. Component dimensions like the 44px button
 *     height or the 24px tag height are specified in px and have no spacing
 *     token (the scale jumps 32 → 48), so a blanket px ban would be
 *     unfollowable. What the rule actually has to catch is a px value that
 *     appears nowhere in the spec — a number someone chose by eye. That is
 *     mechanically checkable: harvest every length the spec names, and fail
 *     on anything outside the set.
 *
 * Run: node scripts/verify-no-raw-values.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SPEC = 'docs/design-system-portfolio-website.md';
const ROOTS = ['src/components', 'src/layouts'];
const EXTS = new Set(['.astro', '.tsx', '.jsx', '.ts', '.js', '.css']);

/** Lengths the Design System actually names. Anything else is invented. */
const spec = readFileSync(SPEC, 'utf8');
const ALLOWED_PX = new Set([...spec.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((m) => m[1]));
// Sub-pixel and zero are always fine: 0 is not a design decision, and hairline
// borders are expressed as 1px everywhere including inside the token values.
for (const n of ['0', '1', '2']) ALLOWED_PX.add(n);

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // directory not created yet — nothing to check
  }
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (EXTS.has(extname(path))) out.push(path);
  }
  return out;
}

/**
 * Blanks out comments so an explanatory note quoting a spec value is not
 * mistaken for code. String contents stay, because a colour smuggled into a
 * class string is exactly what this is here to catch.
 *
 * Block comments are blanked rather than deleted so line numbers survive.
 * The `//` rule skips a `:` immediately before it, or every `https://` URL
 * would take the rest of its line with it.
 */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const fail = [];

for (const file of ROOTS.flatMap(walk)) {
  const src = stripComments(readFileSync(file, 'utf8'));
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      // `#main-content`, `#work` and friends are anchors, not colours.
      if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/.test(m[0])) {
        fail.push(`${file}:${i + 1}  hex colour ${m[0]} — every colour is a token (§3.1)`);
      }
    }
    for (const m of line.matchAll(/(?<![\w.-])(-?\d+(?:\.\d+)?)px\b/g)) {
      if (!ALLOWED_PX.has(m[1])) {
        fail.push(
          `${file}:${i + 1}  ${m[0]} appears nowhere in the Design System — ` +
            `use a token, or specify the value in the document first`,
        );
      }
    }
  });
}

if (fail.length) {
  console.error(`\n✗ Invented values in component code (${fail.length}):\n`);
  for (const f of fail) console.error(`  - ${f}`);
  console.error(`\n  ${ALLOWED_PX.size} lengths are named by ${SPEC}.\n`);
  process.exit(1);
}
console.log(`✓ No invented values: every length in component code is one the Design System names.`);
