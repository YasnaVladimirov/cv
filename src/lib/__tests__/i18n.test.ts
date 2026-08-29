/**
 * Pure dictionary logic only — no DOM, per plan §8.2. The store's setters
 * touch `document` and `localStorage` and are covered by the manual QA walk
 * (Journey 4) rather than simulated here.
 */
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LANG, flag, getDictionary, hasText, LANGS, normalize, t } from '../i18n';

describe('normalize', () => {
  it('accepts every casing and region form of Serbian', () => {
    for (const value of ['sr', 'sr-Latn', 'SR-latn', 'sr-Latn-RS']) {
      expect(normalize(value)).toBe('sr');
    }
  });

  // Anything unrecognised must land on English rather than throw: this reads
  // a value out of localStorage, which any extension can have written to.
  it.each([['en'], ['de'], ['xx-YY'], ['']])('falls back to English for %j', (value) => {
    expect(normalize(value)).toBe('en');
  });

  it('falls back to English for a missing value', () => {
    expect(normalize(null)).toBe('en');
    expect(normalize(undefined)).toBe('en');
  });
});

describe('t', () => {
  it('resolves a dot path in both languages', () => {
    expect(t('nav.work', 'en')).toBe('Work');
    expect(t('nav.work', 'sr')).toBe('Iskustvo');
  });

  it('interpolates named variables', () => {
    expect(t('timeline.filter.showing', 'en', { skill: 'React' })).toBe('Showing: React');
  });

  it('leaves an unknown placeholder untouched rather than printing undefined', () => {
    expect(t('timeline.filter.showing', 'en', { other: 'x' })).toBe('Showing: {skill}');
  });

  /*
   * A miss returns the key itself, deliberately: a raw dot-path on screen is
   * loud during development, and §9.5 forbids a silent English fallback in
   * production because it hides a missing translation from everyone.
   */
  it('returns the key on a miss, and warns only in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('nope.not.here', 'en')).toBe('nope.not.here');
    expect(t('nav', 'en')).toBe('nav'); // resolves to an object, not a string
    warn.mockRestore();
  });
});

describe('hasText', () => {
  it('is true only when every language has a non-empty string', () => {
    expect(hasText('sections.skills.subhead')).toBe(true);
    // Optional content is an empty string rather than a missing key, so parity
    // holds; components must skip the element entirely.
    expect(hasText('sections.work.subhead')).toBe(false);
    expect(hasText('nope.not.here')).toBe(false);
  });
});

describe('flag', () => {
  it('reads a boolean, and is false for anything that is not literally true', () => {
    expect(flag('hero.availability.enabled')).toBe(false);
    expect(flag('proof.enabled')).toBe(false);
    expect(flag('nav.work')).toBe(false);
    expect(flag('nope.not.here')).toBe(false);
  });
});

describe('dictionaries', () => {
  it('exposes exactly the two locked languages', () => {
    expect(LANGS).toEqual(['en', 'sr']);
  });

  it('falls back to the default dictionary for an unknown language', () => {
    // @ts-expect-error deliberately outside the union — this is the guard.
    expect(getDictionary('de')).toBe(getDictionary(DEFAULT_LANG));
  });
});
