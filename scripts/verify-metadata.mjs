/**
 * Enforces the Phase 7 verification checklist against the built pages.
 *
 * Every rule here is one that fails silently: an over-long title is only ever
 * seen truncated in a search result, a duplicate description is invisible
 * outside Search Console, and a JSON-LD block with a trailing comma simply
 * does nothing. None of it shows up locally, and all of it shows up months
 * later as "why does this page not rank for my own name".
 *
 * Pages carrying `noindex` are skipped for uniqueness — the dev-only showcase
 * pages legitimately share the default title, and they are deleted in 10.3.
 *
 * Run: node scripts/verify-metadata.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

const fail = [];

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
    else if (name.endsWith('.html')) out.push(path);
  }
  return out;
}

const attr = (html, re) => html.match(re)?.[1];

const pages = htmlFiles(DIST);
if (pages.length === 0) fail.push(`No built pages in ${DIST}/ — run \`pnpm build\` first.`);

const titles = new Map();
const descriptions = new Map();
let indexable = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const noindex = /name="robots"[^>]*content="[^"]*noindex/.test(head);

  const title = attr(head, /<title>([\s\S]*?)<\/title>/)?.trim();
  const description = attr(head, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(head, /<link rel="canonical" href="([^"]*)"/);
  const ogImage = attr(head, /<meta property="og:image" content="([^"]*)"/);

  if (!title) fail.push(`${page}: no <title>.`);
  else if (title.length > TITLE_MAX) {
    fail.push(`${page}: title is ${title.length} chars, over ${TITLE_MAX}.\n      "${title}"`);
  }

  if (!description) fail.push(`${page}: no meta description.`);
  else if (description.length > DESCRIPTION_MAX) {
    fail.push(`${page}: description is ${description.length} chars, over ${DESCRIPTION_MAX}.`);
  }

  if (!canonical) fail.push(`${page}: no canonical link.`);
  else if (!/^https?:\/\//.test(canonical)) {
    fail.push(`${page}: canonical "${canonical}" is not absolute.`);
  }

  // A relative og:image is ignored by every unfurler.
  if (!ogImage) fail.push(`${page}: no og:image.`);
  else if (!/^https?:\/\//.test(ogImage)) {
    fail.push(`${page}: og:image "${ogImage}" is not absolute.`);
  }

  // PRD §5.3: there are no per-language URLs, so an alternate would be a lie.
  if (/rel="alternate"[^>]*hreflang/.test(head)) {
    fail.push(`${page}: emits hreflang, which PRD §5.3 forbids — there is no SR URL.`);
  }

  // Structured data that does not parse is worth less than none.
  for (const [, block] of head.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(block);
    } catch (error) {
      fail.push(`${page}: JSON-LD does not parse — ${error.message}`);
    }
  }

  if (noindex) continue;
  indexable += 1;
  if (title) titles.set(title, [...(titles.get(title) ?? []), page]);
  if (description) descriptions.set(description, [...(descriptions.get(description) ?? []), page]);
}

for (const [value, where] of titles) {
  if (where.length > 1) fail.push(`Duplicate title across ${where.join(', ')}:\n      "${value}"`);
}
for (const where of descriptions.values()) {
  if (where.length > 1) fail.push(`Duplicate description across ${where.join(', ')}.`);
}

// robots.txt has to name the sitemap, and the sitemap has to exist.
const robots = join(DIST, 'robots.txt');
if (!existsSync(robots)) fail.push('dist/robots.txt is missing.');
else {
  const text = readFileSync(robots, 'utf8');
  const sitemap = text.match(/^Sitemap:\s*(\S+)$/m)?.[1];
  if (!sitemap) fail.push('dist/robots.txt does not name a Sitemap.');
  else if (!existsSync(join(DIST, new URL(sitemap).pathname.replace(/^\//, '')))) {
    fail.push(`robots.txt points at ${sitemap}, which was not built.`);
  }
}

if (fail.length) {
  console.error('✗ Metadata check failed:\n');
  for (const message of fail) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(
  `✓ Metadata verified: ${indexable} indexable pages, unique titles and descriptions within limits.`,
);
