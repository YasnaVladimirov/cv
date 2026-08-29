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
