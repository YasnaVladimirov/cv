/**
 * Analytics dispatch.
 *
 * One entry point for every named event in PRD FR-7. The provider is Umami:
 * cookieless, which is what lets the site ship with no consent banner (PRD §6,
 * and §2 forbids cookies outright). Whenever the site id is absent, or the
 * script is blocked — which happens for roughly a third of a technical
 * audience — every call here no-ops.
 *
 * Analytics failure must never affect page function (PRD FR-7 edge case), so
 * every call is wrapped: a broken provider cannot take a CTA down with it.
 */

/** Every event this site fires. Typed so a typo is a build error, not silence. */
export type AnalyticsEvent =
  | 'cta_hero_resume'
  | 'cta_hero_book'
  | 'resume_download'
  | 'form_submit_success'
  | 'form_submit_error'
  | 'calendly_open'
  | 'calendly_booked'
  | 'lang_switch'
  | 'case_study_open'
  | 'scroll_depth'
  | 'outbound_click';

export type EventProps = Record<string, string | number | boolean>;

/** Provider shape, assigned in Phase 6.3. */
type Provider = (name: AnalyticsEvent, props?: EventProps) => void;

let provider: Provider | null = null;

/**
 * Events fired before the provider script finishes loading.
 *
 * `resume_download` is a P0 metric and can fire within a second of arrival —
 * well inside the window where a deferred third-party script has not run.
 * Without a buffer those are exactly the conversions that go uncounted.
 * Capped, because an unbounded queue on a page whose analytics never load is
 * a leak that grows for as long as the tab is open.
 */
const MAX_PENDING = 20;
const pending: Array<[AnalyticsEvent, EventProps | undefined]> = [];

export function registerProvider(fn: Provider): void {
  provider = fn;
  const queued = pending.splice(0, pending.length);
  for (const [name, props] of queued) dispatch(name, props);
}

function dispatch(name: AnalyticsEvent, props?: EventProps): void {
  if (!provider) return;
  try {
    provider(name, props);
  } catch {
    /* never let a provider failure surface to the user */
  }
}

export function trackEvent(name: AnalyticsEvent, props?: EventProps): void {
  // No PII ever reaches analytics — event names and non-personal props only.
  if (import.meta.env.DEV) console.debug('[analytics]', name, props ?? {});
  if (provider) return dispatch(name, props);
  if (pending.length < MAX_PENDING) pending.push([name, props]);
}

/* ------------------------------------------------------------------ *
 * Umami. Swapping provider is this block and nothing else: Plausible  *
 * is `window.plausible(name, { props })` behind its own script tag.   *
 * ------------------------------------------------------------------ */

export const ANALYTICS_SITE_ID = import.meta.env.PUBLIC_ANALYTICS_SITE_ID ?? '';
export const ANALYTICS_HOST = import.meta.env.PUBLIC_ANALYTICS_HOST ?? 'https://cloud.umami.is';

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventProps) => void };
  }
}

export function isAnalyticsConfigured(): boolean {
  return ANALYTICS_SITE_ID !== '';
}

/**
 * Injects the provider script and registers the adapter once it is available.
 *
 * The adapter is registered on `load`, not immediately: registering first
 * would drain the buffer into a `window.umami` that does not exist yet, and
 * those events would be lost in the one window the buffer exists to cover.
 */
export function initAnalytics(): void {
  if (typeof document === 'undefined') return;
  if (!isAnalyticsConfigured()) return;
  if (document.querySelector('script[data-website-id]')) return;

  const script = document.createElement('script');
  script.src = `${ANALYTICS_HOST}/script.js`;
  script.defer = true;
  script.dataset.websiteId = ANALYTICS_SITE_ID;
  script.addEventListener('load', () => {
    registerProvider((name, props) => window.umami?.track(name, props));
  });
  // A blocked script is the expected case, not an error worth surfacing. The
  // buffer is simply never drained and the page is unaffected (FR-7 edge case).
  document.head.append(script);
}
