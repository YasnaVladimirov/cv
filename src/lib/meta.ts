/**
 * Page metadata rules (PRD §5.3, plan §7.2).
 *
 * Pure, because the two limits below are the kind of thing that is easy to
 * assert in a test and easy to forget in a template — and a title that
 * overruns is invisible locally and only shows up truncated in a search
 * result, months later.
 */

/** Google truncates around here; the plan states it outright. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/**
 * Appends the site name for branded search — the primary SEO objective is
 * "[Name]" and "[Name] frontend developer" (PRD §5.3), so the name belongs in
 * as many titles as it fits in.
 *
 * "As it fits in" is the rule: a suffix that pushes the title past the limit
 * costs more than it buys, because the part that gets truncated is the end —
 * which is exactly the name it was added for. So it is appended only when the
 * result still fits, and dropped silently otherwise.
 */
export function pageTitle(title: string, siteName: string): string {
  const trimmed = title.trim();
  const name = siteName.trim();
  if (name === '' || trimmed === name) return trimmed;

  const suffixed = `${trimmed} — ${name}`;
  return suffixed.length <= TITLE_MAX ? suffixed : trimmed;
}

/**
 * Keeps only values that are real absolute URLs.
 *
 * `social.githubUrl` and friends still hold `TODO(human): https://…` strings
 * until Phase 9. A title carrying that placeholder is merely embarrassing; the
 * same string inside JSON-LD `sameAs` is a validation error, and a structured
 * data block that fails validation is worth less than none. So placeholders
 * are dropped and the property disappears rather than shipping broken.
 */
export function realUrls(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => {
    if (!value) return false;
    try {
      const { protocol } = new URL(value);
      return protocol === 'https:' || protocol === 'http:';
    } catch {
      return false;
    }
  });
}

/**
 * First real paragraph of a case study's English block, for JSON-LD
 * `articleBody`.
 *
 * The MDX carries both languages; only the English one is ever indexed
 * (PRD §5.3), so the Serbian block is skipped rather than concatenated.
 * Markdown syntax is stripped because this is read by a crawler, not rendered.
 */
export function articleExcerpt(body: string, max = 200): string {
  const english = body.match(/<div\s+data-lang=["']en["']\s*>([\s\S]*?)<\/div>/)?.[1] ?? body;

  const paragraph =
    english
      .replace(/^#{1,6}\s+.*$/gm, '') // headings carry no prose
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images to their text
      .replace(/[*_>]/g, '')
      .split(/\n\s*\n/)
      .map((block) => block.trim().replace(/\s+/g, ' '))
      .find((block) => block.length > 0) ?? '';

  if (paragraph.length <= max) return paragraph;
  // Cut on a word boundary; a truncated word reads as a bug in a search result.
  return `${paragraph.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/**
 * Serialises JSON-LD for embedding in a `<script>` block.
 *
 * `JSON.stringify` escapes quotes but not `<`, so a case-study title
 * containing `</script>` would close the block and put the rest of the JSON
 * into the document as markup. The content is authored by the site owner
 * rather than a stranger, which makes this unlikely — not impossible, and the
 * fix is one replace. `<` is valid JSON and parses back to `<`.
 */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
