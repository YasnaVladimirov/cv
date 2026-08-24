/**
 * Analytics dispatch.
 *
 * One entry point for every named event in PRD FR-7. The provider is a [HUMAN]
 * choice deferred to Phase 6.3; until then — and whenever the env var is
 * absent, or the script is blocked, which happens for roughly a third of a
 * technical audience — this no-ops.
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

export function registerProvider(fn: Provider): void {
  provider = fn;
}

export function trackEvent(name: AnalyticsEvent, props?: EventProps): void {
  // No PII ever reaches analytics — event names and non-personal props only.
  if (import.meta.env.DEV) console.debug('[analytics]', name, props ?? {});
  if (!provider) return;
  try {
    provider(name, props);
  } catch {
    /* never let a provider failure surface to the user */
  }
}
