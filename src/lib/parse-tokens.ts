/**
 * Reads the design tokens straight out of src/styles/base.css at build time.
 *
 * The tokens showcase page renders from this rather than from a hand-kept
 * list, so the page cannot drift from the stylesheet it documents. A token
 * added to the spec appears on the page automatically; one removed disappears.
 *
 * Build-time only — never import this into a client island.
 */
import { readFileSync } from 'node:fs';

export interface Token {
  name: string;
  value: string;
}

function block(css: string, opener: RegExp): string {
  const m = opener.exec(css);
  if (!m) return '';
  const start = css.indexOf('{', m.index) + 1;
  let depth = 1;
  let i = start;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(start, i - 1);
}

/** Strips comment bodies so token names mentioned in prose are not parsed. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

export function readTokens(cssPath = 'src/styles/base.css'): Token[] {
  const css = readFileSync(cssPath, 'utf8');
  const source =
    stripComments(block(css, /@theme\s+static\s*\{/)) +
    '\n' +
    stripComments(block(css, /^:root\s*\{/m));

  const tokens: Token[] = [];
  for (const line of source.split('\n')) {
    const m = /^\s*(--[a-z0-9-]+):\s*(.+?);\s*$/i.exec(line);
    if (!m) continue;
    const [, name, value] = m;
    // `--x-*: initial` lines wipe a namespace; they are not tokens.
    if (name.endsWith('-*') || value.trim() === 'initial') continue;
    tokens.push({ name, value: value.trim() });
  }
  return tokens;
}

/** Tokens whose name starts with the prefix, minus any --sub--modifier keys. */
export function group(tokens: Token[], prefix: string, exclude: RegExp[] = []): Token[] {
  return tokens.filter(
    (t) =>
      t.name.startsWith(prefix) &&
      !t.name.includes('--', 2) &&
      !exclude.some((re) => re.test(t.name)),
  );
}

/** Modifier lookup for the type scale: --text-base--line-height etc. */
export function modifier(tokens: Token[], base: string, mod: string): string | undefined {
  return tokens.find((t) => t.name === `${base}--${mod}`)?.value;
}
