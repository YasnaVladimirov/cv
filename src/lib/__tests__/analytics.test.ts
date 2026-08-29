/**
 * PRD FR-7's edge case is the important one here: "never let analytics
 * failures affect page function". Roughly a third of a technical audience
 * blocks the provider script, so the unconfigured and broken paths are the
 * normal ones, not the exceptional ones.
 *
 * Each test re-imports the module because the provider and the pending buffer
 * are module-scope state, which is exactly what is under test.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshAnalytics() {
  vi.resetModules();
  return import('../analytics');
}

beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

describe('trackEvent', () => {
  it('does not throw when no provider is registered', async () => {
    const { trackEvent } = await freshAnalytics();
    expect(() => trackEvent('resume_download')).not.toThrow();
  });

  it('passes the event name and props through once a provider exists', async () => {
    const { registerProvider, trackEvent } = await freshAnalytics();
    const provider = vi.fn();
    registerProvider(provider);

    trackEvent('resume_download', { lang: 'sr' });

    expect(provider).toHaveBeenCalledWith('resume_download', { lang: 'sr' });
  });

  /*
   * The buffer exists because `resume_download` is a P0 metric that can fire
   * within a second of arrival — well inside the window where a deferred
   * third-party script has not run yet.
   */
  it('replays events fired before the provider loaded, in order', async () => {
    const { registerProvider, trackEvent } = await freshAnalytics();
    trackEvent('cta_hero_resume');
    trackEvent('resume_download', { lang: 'en' });

    const provider = vi.fn();
    registerProvider(provider);

    expect(provider.mock.calls).toEqual([
      ['cta_hero_resume', undefined],
      ['resume_download', { lang: 'en' }],
    ]);
  });

  it('drains the buffer exactly once', async () => {
    const { registerProvider, trackEvent } = await freshAnalytics();
    trackEvent('lang_switch', { lang: 'sr' });

    registerProvider(vi.fn());
    const second = vi.fn();
    registerProvider(second);

    expect(second).not.toHaveBeenCalled();
  });

  // An unbounded queue on a page whose analytics never load grows for as long
  // as the tab is open.
  it('caps the buffer rather than growing without limit', async () => {
    const { registerProvider, trackEvent } = await freshAnalytics();
    for (let i = 0; i < 100; i += 1) trackEvent('scroll_depth', { depth: i });

    const provider = vi.fn();
    registerProvider(provider);

    expect(provider.mock.calls.length).toBeLessThanOrEqual(20);
  });

  it('swallows a provider that throws, so a CTA cannot be taken down with it', async () => {
    const { registerProvider, trackEvent } = await freshAnalytics();
    registerProvider(() => {
      throw new Error('provider exploded');
    });

    expect(() => trackEvent('form_submit_success')).not.toThrow();
  });
});

describe('isAnalyticsConfigured', () => {
  // PUBLIC_ANALYTICS_SITE_ID is unset in this project's .env, which is the
  // state the site ships in until the human provisions Umami.
  it('is false without a site id, and initAnalytics then does nothing', async () => {
    const { isAnalyticsConfigured, initAnalytics } = await freshAnalytics();
    expect(isAnalyticsConfigured()).toBe(false);
    expect(() => initAnalytics()).not.toThrow();
  });
});
