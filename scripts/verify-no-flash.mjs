/**
 * Guards the one thing plan §5.4 calls an outright failure: a returning
 * Serbian visitor seeing a frame of English.
 *
 * The whole defence is ordering. `apply-language.js` runs inline in <head> and
 * sets <html lang> before the browser has any stylesheet to paint with, so the
 * rules that show one language and hide the other are already correct at first
 * paint. That regression produces no error and no failing build — it is
 * visible only as a flicker, only in Serbian, and only on a return visit.
 *
 * What this catches, verified by breaking each on purpose:
 *   - the script deleted, or moved out of <head> into <body>  → caught
 *   - the script made `defer`/`async`/`type=module`           → caught
 *   - a stylesheet hand-written into <head> above it          → caught
 *
 * What it cannot catch: reordering the script below Astro's own bundled
 * stylesheet, because Astro always emits that after the template's head
 * content — moving the tag within <head> does not change their relative order.
 * Checked rather than assumed.
 *
 * Run: node scripts/verify-no-flash.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
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

const pages = htmlFiles(DIST);
if (pages.length === 0) fail.push(`No built pages in ${DIST}/ — run \`pnpm build\` first.`);

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));

  // The script is inlined verbatim, so its distinctive line is the marker.
  const scriptAt = head.indexOf("localStorage.getItem('lang')");
  if (scriptAt === -1) {
    fail.push(`${page}: the pre-paint language script is missing from <head>.`);
    continue;
  }

  // Anything that paints: a linked stylesheet or an inline <style>.
  const styleAt = [head.indexOf('<link rel="stylesheet"'), head.indexOf('<style')]
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)[0];

  if (styleAt !== undefined && styleAt < scriptAt) {
    fail.push(
      `${page}: a stylesheet appears BEFORE the language script in <head>.\n` +
        `      A returning Serbian visitor gets a frame of English on every navigation.`,
    );
  }

  // A deferred or async script has already lost the race it exists to win.
  const tagStart = head.lastIndexOf('<script', scriptAt);
  const tag = head.slice(tagStart, head.indexOf('>', tagStart) + 1);
  if (/\b(defer|async|type=["']module["'])/.test(tag)) {
    fail.push(`${page}: the language script is not blocking — found \`${tag.trim()}\`.`);
  }
}

if (fail.length) {
  console.error('✗ Pre-paint language script check failed:\n');
  for (const message of fail) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(
  `✓ No-flash verified: the language script precedes all styles on ${pages.length} pages.`,
);
