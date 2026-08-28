/**
 * Calendly configuration and script loading (plan §6.2, App Flow §4.8).
 *
 * The embed is the primary contact channel and the one most likely to be
 * missing: tracker blockers kill assets.calendly.com routinely, and a
 * meaningful share of a technical audience runs one. Everything here is built
 * so that failure is a normal path rather than an exception — the direct link
 * is always rendered, and the widget is an upgrade on top of it.
 */

/**
 * Accepts what a person actually pastes.
 *
 * `calendly.com/name` without a scheme is a relative path in an href, so the
 * link would resolve to `/work/calendly.com/name` from a case study and 404.
 * The .env supplied for this build was exactly that, so the normalisation is
 * not hypothetical.
 */
export function normalizeCalendlyUrl(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export const CALENDLY_URL = normalizeCalendlyUrl(import.meta.env.PUBLIC_CALENDLY_URL);

export function isCalendlyConfigured(): boolean {
  return CALENDLY_URL !== '';
}

const WIDGET_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';

interface CalendlyGlobal {
  initInlineWidget(options: { url: string; parentElement: HTMLElement }): void;
}

declare global {
  interface Window {
    Calendly?: CalendlyGlobal;
  }
}

/**
 * Themes the widget from the design tokens by reading them back out of the
 * cascade rather than repeating the hex here. §4.2 owns the value; this asks
 * the stylesheet what it is, so the two cannot disagree and no raw colour
 * enters the codebase.
 */
function themeParams(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const styles = getComputedStyle(document.documentElement);
  const hex = (token: string) => styles.getPropertyValue(token).trim().replace(/^#/, '');
  const primary = hex('--color-accent');
  return primary ? { primary_color: primary } : {};
}

/**
 * Note: no locale parameter. Plan §6.2 asks for one "if Calendly supports a
 * locale hint" — its inline widget does not expose a documented one, so the
 * booking UI stays in the visitor's browser language while the page around it
 * follows the toggle. App Flow §6 already anticipates this and requires the
 * mismatch to be labelled rather than hidden.
 */
export function buildEmbedUrl(): string {
  if (!isCalendlyConfigured()) return '';
  const url = new URL(CALENDLY_URL);
  for (const [key, value] of Object.entries(themeParams())) url.searchParams.set(key, value);
  return url.toString();
}

let loader: Promise<void> | null = null;

/** Idempotent: several embeds on one page share the one script load. */
export function loadCalendlyScript(): Promise<void> {
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    if (window.Calendly) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SCRIPT}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    // A blocked request fires `error`, which is the common case rather than
    // the exceptional one — it must settle the promise, not leave it pending.
    script.addEventListener('error', () => reject(new Error('Calendly script blocked')));

    if (!existing) {
      script.src = WIDGET_SCRIPT;
      script.async = true;
      document.head.append(script);
    }
  });

  return loader;
}
