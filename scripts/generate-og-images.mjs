/**
 * Generates the Open Graph share images (plan §8.8).
 *
 * A generator rather than a hand-drawn file, because the name it prints is
 * still `TODO(human):` until Phase 9 — a static PNG made today would be wrong
 * the moment real content lands. Re-run it then and every card updates.
 *
 * Text is drawn as GLYPH PATHS, not as SVG <text>. The rasteriser resolves
 * <text> through system fontconfig, which has never heard of the Inter in
 * node_modules, so a text element would silently render in something else —
 * on the one asset whose whole job is to look like the site. Paths carry no
 * font dependency at all.
 *
 * Colours and radii are read out of src/styles/base.css rather than repeated
 * here, so the card cannot drift from the theme (§4.2 owns the values).
 *
 * Run: pnpm og
 */
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

const INTER = 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2';
const MONO =
  'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2';

/** Pulls a token's value straight from the stylesheet that defines it. */
const CSS = readFileSync('src/styles/base.css', 'utf8');
const token = (name) => {
  const match = CSS.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'));
  if (!match) throw new Error(`Token --${name} not found in base.css`);
  return match[1].trim();
};

const COLOR = {
  bg: token('color-bg'),
  surface: token('color-bg-elevated'),
  border: token('color-border'),
  primary: token('color-text-primary'),
  secondary: token('color-text-secondary'),
  accent: token('color-accent'),
  backdrop: token('color-accent-backdrop'),
};
const RADIUS_XL = parseInt(token('radius-xl'), 10);

const inter = fontkit.openSync(INTER);
const mono = fontkit.openSync(MONO);

/**
 * Lays out a string and returns its glyph outlines as one SVG path.
 *
 * `strokeWidth` is faux-bold: fontkit cannot instance the weight axis of this
 * woff2 (getVariation throws on it), so the display weight is approximated by
 * stroking the outline in the same colour. At these sizes it is
 * indistinguishable from a real 600–700 and it keeps the real Inter shapes,
 * which a system-font substitute would not.
 */
function textPath(font, string, { size, x, y, fill, weight = 0 }) {
  const scale = size / font.unitsPerEm;
  const run = font.layout(string);
  let cursor = 0;
  const parts = [];

  for (const glyph of run.glyphs) {
    const d = glyph.path.toSVG();
    if (d) {
      // The glyph path is y-up; the canvas is y-down, hence the negative scale.
      parts.push(
        `<path d="${d}" transform="translate(${(x + cursor * scale).toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" fill="${fill}"` +
          (weight
            ? ` stroke="${fill}" stroke-width="${(weight / scale).toFixed(1)}" stroke-linejoin="round"`
            : '') +
          ' />',
      );
    }
    cursor += glyph.advanceWidth;
  }
  return { svg: parts.join(''), width: cursor * scale };
}

function measure(font, string, size) {
  const run = font.layout(string);
  return run.glyphs.reduce((sum, g) => sum + g.advanceWidth, 0) * (size / font.unitsPerEm);
}

/** Greedy wrap; the card has room for two display lines and no more. */
function wrap(font, string, size, maxWidth, maxLines) {
  const words = string.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(font, candidate, size) <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  // An ellipsis is honest about the cut; a hard truncation looks like a bug.
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function card({ eyebrow, title, subtitle }) {
  const PAD = 80;
  const PANEL = { x: 56, y: 56, w: WIDTH - 112, h: HEIGHT - 112 };
  const parts = [];

  // §6.2's backdrop shapes: solid accent blobs, blurred, never gradients.
  parts.push(`<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="80" /></filter></defs>`);
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="${COLOR.bg}" />`);
  parts.push(`<circle cx="120" cy="90" r="240" fill="${COLOR.backdrop}" filter="url(#b)" />`);
  parts.push(`<circle cx="1080" cy="560" r="200" fill="${COLOR.backdrop}" filter="url(#b)" />`);

  // The glass panel, in its opaque fallback form — §10.4's own answer for
  // anywhere backdrop-filter cannot run, and a PNG is exactly that.
  parts.push(
    `<rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="${RADIUS_XL}" fill="${COLOR.surface}" stroke="${COLOR.border}" stroke-width="1" />`,
  );

  // Lay the block out first, then centre it: the title wraps to one line or
  // two depending on content, and a fixed top edge leaves the card visibly
  // bottom-heavy in the short case.
  const titleLines = wrap(inter, title, 76, PANEL.w - PAD * 2, 2);
  const subtitleLines = wrap(inter, subtitle, 32, PANEL.w - PAD * 2, 2);
  const blockHeight = 34 + 58 + titleLines.length * 90 + 12 + subtitleLines.length * 44;

  let y = PANEL.y + (PANEL.h - blockHeight) / 2 + 26;
  parts.push(textPath(mono, eyebrow, { size: 26, x: PANEL.x + PAD, y, fill: COLOR.accent }).svg);

  y += 58 + 34;
  for (const line of titleLines) {
    parts.push(
      textPath(inter, line, { size: 76, x: PANEL.x + PAD, y, fill: COLOR.primary, weight: 1.6 })
        .svg,
    );
    y += 90;
  }

  y += 12;
  for (const line of subtitleLines) {
    parts.push(textPath(inter, line, { size: 32, x: PANEL.x + PAD, y, fill: COLOR.secondary }).svg);
    y += 44;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`;
}

async function render(svg, outPath) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
}

/* ------------------------------------------------------------------ */

const dictionary = JSON.parse(readFileSync('src/content/i18n/en.json', 'utf8'));
// Metadata is English-only (PRD §5.3), so the cards are too.
const strip = (s) => s.replace(/^TODO\(human\):\s*/, '');

const name = strip(dictionary.hero.name);
const role = strip(dictionary.hero.title);

await render(
  card({ eyebrow: '--frontend-engineer', title: name, subtitle: role }),
  'public/og-default.png',
);
console.log('✓ public/og-default.png');

mkdirSync('public/og', { recursive: true });
const dir = 'src/content/case-studies';
let count = 0;

for (const file of readdirSync(dir).filter((f) => ['.md', '.mdx'].includes(extname(f)))) {
  const raw = readFileSync(join(dir, file), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const field = (key) =>
    front
      .match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, '') ?? '';

  if (field('published') !== 'true') continue;

  const slug = basename(file, extname(file));
  await render(
    card({
      eyebrow: '--case-study',
      title: strip(field('title_en')),
      subtitle: strip(field('outcome_en')),
    }),
    `public/og/${slug}.png`,
  );
  count += 1;
}

console.log(`✓ public/og/ — ${count} case study cards`);
