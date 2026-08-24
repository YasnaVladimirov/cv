import { describe, expect, it } from 'vitest';
import { formatMonth, formatRange } from '../format';

describe('formatMonth', () => {
  it('formats a yyyy-mm in each language', () => {
    expect(formatMonth('2024-03', 'en')).toBe('Mar 2024');
    // Serbian Latin abbreviates differently; asserting the exact string is the
    // point — it is what proves Intl is doing the work and not a template.
    expect(formatMonth('2024-03', 'sr')).not.toBe('Mar 2024');
    expect(formatMonth('2024-03', 'sr')).toContain('2024');
  });

  it('does not shift the month in a negative-UTC-offset environment', () => {
    // The bug this guards: `new Date('2024-03')` is UTC midnight, which is
    // February 29th in New York. Every January start date would read December.
    for (const month of ['01', '03', '07', '12']) {
      const en = formatMonth(`2024-${month}`, 'en');
      const expected = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2024, Number(month) - 1, 1, 12)));
      expect(en).toBe(expected);
    }
    expect(formatMonth('2024-01', 'en')).toContain('Jan');
    expect(formatMonth('2024-12', 'en')).toContain('Dec');
  });

  it('returns the input unchanged when it is not yyyy-mm', () => {
    // The schema already enforces the shape; this is so a bad value shows up
    // on the page as itself rather than as "Invalid Date".
    expect(formatMonth('not-a-date', 'en')).toBe('not-a-date');
    expect(formatMonth('2024-3', 'en')).toBe('2024-3');
  });
});

describe('formatRange', () => {
  it('joins two months with an en dash', () => {
    expect(formatRange('2021-06', '2024-02', 'en')).toBe('Jun 2021 – Feb 2024');
  });

  it('renders a null end as the translated "present"', () => {
    expect(formatRange('2024-03', null, 'en')).toBe('Mar 2024 – Present');
    const sr = formatRange('2024-03', null, 'sr');
    expect(sr).not.toContain('Present');
    expect(sr).toContain('–');
  });
});
