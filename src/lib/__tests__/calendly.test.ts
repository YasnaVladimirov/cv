import { describe, expect, it } from 'vitest';
import { normalizeCalendlyUrl } from '../calendly';

describe('normalizeCalendlyUrl', () => {
  it('leaves a full https URL alone', () => {
    expect(normalizeCalendlyUrl('https://calendly.com/someone/intro')).toBe(
      'https://calendly.com/someone/intro',
    );
  });

  // The shape actually supplied in this project's .env. Without a scheme an
  // href is a relative path, so the link 404s from any nested route.
  it('adds https:// when the scheme is missing', () => {
    expect(normalizeCalendlyUrl('calendly.com/someone')).toBe('https://calendly.com/someone');
  });

  it('trims surrounding whitespace before deciding', () => {
    expect(normalizeCalendlyUrl('  calendly.com/someone  ')).toBe('https://calendly.com/someone');
  });

  it('does not double up the scheme on a leading slash', () => {
    expect(normalizeCalendlyUrl('//calendly.com/someone')).toBe('https://calendly.com/someone');
  });

  it('keeps http:// rather than silently upgrading it', () => {
    expect(normalizeCalendlyUrl('http://example.test/x')).toBe('http://example.test/x');
  });

  it('returns empty for an unset variable, which is what gates the embed', () => {
    expect(normalizeCalendlyUrl(undefined)).toBe('');
    expect(normalizeCalendlyUrl('   ')).toBe('');
  });
});
