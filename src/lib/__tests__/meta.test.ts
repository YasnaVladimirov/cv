import { describe, expect, it } from 'vitest';
import { pageTitle, TITLE_MAX } from '../meta';

describe('pageTitle', () => {
  it('appends the site name when the result fits', () => {
    expect(pageTitle('Page not found', 'Jane Doe')).toBe('Page not found — Jane Doe');
  });

  // The suffix exists for branded search; a truncated one is the worst of both
  // outcomes, since the name is the part that gets cut.
  it('drops the site name rather than overrun the limit', () => {
    const long = 'A case study title that is deliberately quite long indeed';
    const result = pageTitle(long, 'Jane Doe');
    expect(result).toBe(long);
    expect(result.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it('keeps a result that lands exactly on the limit', () => {
    // 53 + ' — Jane' (3 for the separator, 4 for the name) === 60 exactly.
    const title = 'x'.repeat(53);
    expect(pageTitle(title, 'Jane')).toHaveLength(TITLE_MAX);
  });

  it('does not repeat the name when the title already is the name', () => {
    expect(pageTitle('Jane Doe', 'Jane Doe')).toBe('Jane Doe');
  });

  it('handles an unset site name', () => {
    expect(pageTitle('Page not found', '')).toBe('Page not found');
  });
});
