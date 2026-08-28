import { describe, expect, it } from 'vitest';
import { isSpam, MIN_SUBMIT_MS } from '../form';

describe('isSpam', () => {
  it('accepts a message written at human speed with an untouched honeypot', () => {
    expect(isSpam({ honeypot: '', elapsedMs: 45_000 })).toBe(false);
  });

  it('rejects a filled honeypot however long it took', () => {
    expect(isSpam({ honeypot: 'https://example.com', elapsedMs: 600_000 })).toBe(true);
  });

  // Whitespace is what an over-eager autofill leaves behind, and treating it
  // as a hit would discard a real message from a real person.
  it('treats a whitespace-only honeypot as untouched', () => {
    expect(isSpam({ honeypot: '   ', elapsedMs: 45_000 })).toBe(false);
  });

  it('rejects a submission faster than a person can type', () => {
    expect(isSpam({ honeypot: '', elapsedMs: 400 })).toBe(true);
  });

  // The boundary in both directions: at the threshold a submission is spam,
  // one millisecond later it is not.
  it('puts the boundary exactly at MIN_SUBMIT_MS', () => {
    expect(isSpam({ honeypot: '', elapsedMs: MIN_SUBMIT_MS - 1 })).toBe(true);
    expect(isSpam({ honeypot: '', elapsedMs: MIN_SUBMIT_MS })).toBe(false);
  });
});
