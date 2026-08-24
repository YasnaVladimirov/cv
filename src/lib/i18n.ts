/**
 * The language system.
 *
 * The site serves ONE set of URLs and swaps every string in place (PRD FR-6).
 * That constraint drives three different mechanisms, and picking the right one
 * per case is the whole design:
 *
 *  1. STATIC TEXT (.astro) — both languages are rendered into the HTML and one
 *     is shown by CSS keyed on `html[lang]`. No JS, no re-render, no flash, and
 *     it survives JS being disabled (in English). Use the <T> component.
 *
 *  2. ATTRIBUTES (href, alt, aria-label, title) — CSS cannot swap these, so
 *     they carry `data-i18n-<attr>-en` / `-sr` pairs and are updated by
 *     `applyAttributeTranslations` on every language change.
 *
 *  3. REACT ISLANDS (form errors, toast) — strings appear conditionally at
 *     runtime, so dual-rendering them is not possible. They read the store via
 *     `useI18n()` and re-render.
 *
 * Doubling the static text in the HTML is the accepted cost. It is text, it
 * gzips well, and it buys an instant switch with no hydration dependency.
 */
import en from '../content/i18n/en.json';
import sr from '../content/i18n/sr.json';

/** Internal short code. The dictionaries are keyed by this. */
export type Lang = 'en' | 'sr';

/**
 * Value written to `<html lang>` and to localStorage. Serbian is explicitly
 * Latin script so screen readers pick the right pronunciation and the browser
 * offers correct spellcheck (Design System 9.4). Latin, not Cyrillic, is a
 * locked product decision.
 */
export const HTML_LANG: Record<Lang, string> = {
  en: 'en',
  sr: 'sr-Latn',
};

/** BCP-47 locale for Intl formatting (Design System 9.3). Never hand-format. */
export const LOCALE: Record<Lang, string> = {
  en: 'en-US',
  sr: 'sr-Latn-RS',
};

export const LANGS: Lang[] = ['en', 'sr'];
export const DEFAULT_LANG: Lang = 'en';

/** Key used in localStorage. Must match src/scripts/apply-language.js. */
export const STORAGE_KEY = 'lang';

type Dictionary = typeof en;
const DICTIONARIES: Record<Lang, Dictionary> = { en, sr: sr as Dictionary };

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];
}

/** Accepts 'sr', 'sr-Latn', 'SR-latn' … and anything else falls back to en. */
export function normalize(value: string | null | undefined): Lang {
  if (!value) return DEFAULT_LANG;
  return value.toLowerCase().startsWith('sr') ? 'sr' : 'en';
}

/**
 * Dot-path lookup. Returns the key itself on a miss, which is deliberately
 * ugly: a raw key on screen is loud during development, and the parity check
 * plus this loudness together make a silent English fallback unnecessary
 * (Design System 9.5 forbids one in production).
 */
export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const parts = key.split('.');
  let node: unknown = getDictionary(lang);

  for (const part of parts) {
    if (node === null || typeof node !== 'object' || !(part in node)) {
      if (import.meta.env.DEV) console.warn(`[i18n] missing key "${key}" for "${lang}"`);
      return key;
    }
    node = (node as Record<string, unknown>)[part];
  }

  if (typeof node !== 'string') {
    if (import.meta.env.DEV) console.warn(`[i18n] key "${key}" is not a string for "${lang}"`);
    return key;
  }

  return vars
    ? node.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
    : node;
}

/**
 * True when a key resolves to a real, non-empty string in EVERY language.
 *
 * Optional content — a section subhead, the availability line — is expressed
 * as an empty string in the dictionary rather than a missing key, so parity
 * holds. Components need to skip the whole element in that case: an empty
 * <p> still contributes its margin and a line box.
 *
 * All languages are checked because the dual-render model puts both in the
 * HTML, so a string present in one and empty in the other would render as a
 * gap that appears and disappears with the toggle. verify-i18n-parity.mjs
 * already fails the build on that, and this is the runtime half of the pair.
 */
export function hasText(key: string): boolean {
  return LANGS.every((lang) => {
    const value = t(key, lang);
    return value !== '' && value !== key;
  });
}

/** Non-string dictionary values — feature flags such as hero.availability.enabled. */
export function flag(key: string, lang: Lang = DEFAULT_LANG): boolean {
  const parts = key.split('.');
  let node: unknown = getDictionary(lang);
  for (const part of parts) {
    if (node === null || typeof node !== 'object' || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return node === true;
}

/* ------------------------------------------------------------------ *
 * Client store. Module-scope subject; no state library needed for one *
 * value with a handful of subscribers.                                *
 * ------------------------------------------------------------------ */

type Listener = (lang: Lang) => void;
const listeners = new Set<Listener>();

/**
 * Seeded from `<html lang>` rather than from localStorage, because
 * apply-language.js has already resolved that before first paint. Reading the
 * DOM keeps one source of truth and avoids a second, possibly disagreeing,
 * storage read.
 */
let current: Lang =
  typeof document !== 'undefined' ? normalize(document.documentElement.lang) : DEFAULT_LANG;

export function getLanguage(): Lang {
  return current;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLanguage(lang: Lang): void {
  if (lang === current || typeof document === 'undefined') return;
  current = lang;

  document.documentElement.lang = HTML_LANG[lang];

  // Private browsing and some hardened configurations throw on write. The
  // toggle must still work for the session; only persistence is lost
  // (App Flow 2.3).
  try {
    localStorage.setItem(STORAGE_KEY, HTML_LANG[lang]);
  } catch {
    /* preference not persisted — acceptable, documented trade-off */
  }

  applyAttributeTranslations(lang);
  for (const listener of listeners) listener(lang);

  void import('./analytics').then(({ trackEvent }) => trackEvent('lang_switch', { lang }));
}

export function toggleLanguage(): void {
  setLanguage(current === 'en' ? 'sr' : 'en');
}

/**
 * Swaps translated ATTRIBUTES, which CSS cannot reach.
 *
 * Markup opts in per attribute:
 *   <a data-i18n-href-en="/cv.pdf" data-i18n-href-sr="/cv-sr.pdf" href="/cv.pdf">
 *   <img data-i18n-alt-en="…" data-i18n-alt-sr="…" alt="…">
 *
 * Runs on every switch and once on load, so server-rendered English markup is
 * corrected for a returning Serbian visitor.
 */
const TRANSLATED_ATTRS = ['href', 'alt', 'aria-label', 'title', 'placeholder'] as const;

export function applyAttributeTranslations(lang: Lang = current): void {
  if (typeof document === 'undefined') return;
  for (const attr of TRANSLATED_ATTRS) {
    const selector = `[data-i18n-${attr}-${lang}]`;
    for (const el of document.querySelectorAll(selector)) {
      const value = el.getAttribute(`data-i18n-${attr}-${lang}`);
      if (value !== null) el.setAttribute(attr, value);
    }
  }
}
