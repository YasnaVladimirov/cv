import { describe, expect, it } from 'vitest';
import { articleExcerpt, jsonLd, pageTitle, realUrls, TITLE_MAX } from '../meta';

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

describe('realUrls', () => {
  it('keeps absolute http(s) URLs', () => {
    expect(realUrls(['https://github.com/x', 'http://example.test'])).toEqual([
      'https://github.com/x',
      'http://example.test',
    ]);
  });

  // The exact shape sitting in the dictionary until Phase 9.
  it('drops TODO(human) placeholders that merely contain a URL', () => {
    expect(realUrls(['TODO(human): https://github.com/username'])).toEqual([]);
  });

  it('drops empty, undefined and relative values', () => {
    expect(realUrls([undefined, '', '/work/x', 'github.com/x'])).toEqual([]);
  });
});

describe('articleExcerpt', () => {
  const body = [
    '<div data-lang="en">',
    '',
    '## Context',
    '',
    'The English paragraph, with a [link](https://example.test) and `code`.',
    '',
    '</div>',
    '<div data-lang="sr">',
    '',
    '## Kontekst',
    '',
    'Srpski pasus koji se ne sme pojaviti.',
    '',
    '</div>',
  ].join('\n');

  it('takes the first paragraph of the English block only', () => {
    expect(articleExcerpt(body)).toBe('The English paragraph, with a link and code.');
  });

  it('never leaks the Serbian block, which is not the indexed language', () => {
    expect(articleExcerpt(body)).not.toContain('Srpski');
  });

  it('truncates on a word boundary', () => {
    const long = `<div data-lang="en">\n\n${'word '.repeat(80)}\n\n</div>`;
    const result = articleExcerpt(long, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/wor…$/);
  });

  it('returns empty for a body with no prose', () => {
    expect(articleExcerpt('<div data-lang="en">\n\n## Only a heading\n\n</div>')).toBe('');
  });
});

describe('jsonLd', () => {
  it('escapes < so a closing script tag cannot break out of the block', () => {
    const serialised = jsonLd({ headline: 'A </script> in a title' });
    expect(serialised).not.toContain('</script>');
    expect(serialised).toContain('\\u003c');
  });

  it('still parses back to the original value', () => {
    const data = { headline: 'A </script> in a title', '@type': 'Article' };
    expect(JSON.parse(jsonLd(data))).toEqual(data);
  });
});
