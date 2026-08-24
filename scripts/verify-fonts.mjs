/**
 * Asserts the self-hosted fonts can actually render Serbian.
 *
 * Design System 9.2 requires the Latin Extended subset for both families.
 * Missing it is a silent failure: the browser falls back to a system font
 * for those five characters only, so Serbian text renders in a visibly
 * different typeface mid-word and nothing errors.
 *
 * This opens the real WOFF2 binaries and checks the cmap, rather than
 * trusting a filename or a unicode-range declaration.
 *
 * Run: node scripts/verify-fonts.mjs
 */
import { openSync } from 'fontkit';
import { existsSync } from 'node:fs';

// Serbian Latin (gajica) adds exactly these five letters to the base alphabet.
const SERBIAN = [
  ['č', 'ć', 'đ', 'š', 'ž'],
  ['Č', 'Ć', 'Đ', 'Š', 'Ž'],
].flat();

const FONTS = [
  {
    label: 'Inter Variable (latin-ext)',
    path: 'node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2',
  },
  {
    label: 'JetBrains Mono Variable (latin-ext)',
    path: 'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2',
  },
];

const fail = [];

for (const { label, path } of FONTS) {
  if (!existsSync(path)) {
    fail.push(
      `${label}: file not found at ${path} — did the fontsource package change its layout?`,
    );
    continue;
  }

  let font;
  try {
    font = openSync(path);
  } catch (err) {
    fail.push(`${label}: could not parse WOFF2 — ${err.message}`);
    continue;
  }

  const missing = SERBIAN.filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)));
  if (missing.length) {
    const detail = missing
      .map((ch) => `${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`)
      .join(', ');
    fail.push(`${label}: missing glyphs — ${detail}`);
  } else {
    console.log(`  ✓ ${label} — all ${SERBIAN.length} Serbian glyphs present`);
  }
}

if (fail.length) {
  console.error(`\n✗ Font verification failed (${fail.length}):\n`);
  for (const f of fail) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}
console.log('✓ Fonts verified: Serbian Latin coverage in both families.');
