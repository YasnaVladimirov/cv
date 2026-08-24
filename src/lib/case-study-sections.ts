/**
 * Maps a case-study body heading to its eyebrow key.
 *
 * Design System §6.3 requires a mono eyebrow above every S2 body section, but
 * the body is authored as plain MDX headings — there is nowhere in `## Context`
 * to put a dictionary key. This table is that missing link, and it is keyed by
 * the heading text in both languages because the MDX carries both.
 *
 * A heading that is not in this table is a build error, not a silently
 * missing eyebrow. The alternative — rendering the section without one — is
 * invisible in review and would quietly erode the one signature §6.3 defines.
 * Adding a genuinely new section means adding its key to both dictionaries and
 * its two headings here, which is the intended amount of friction.
 */
export const SECTION_EYEBROW: Record<string, string> = {
  // en
  Context: 'caseStudy.eyebrow.context',
  Problem: 'caseStudy.eyebrow.problem',
  'My role': 'caseStudy.eyebrow.role',
  Approach: 'caseStudy.eyebrow.approach',
  Outcome: 'caseStudy.eyebrow.outcome',
  Stack: 'caseStudy.eyebrow.stack',
  'What I would do differently': 'caseStudy.eyebrow.reflection',
  // sr — "Problem" is spelled the same in both languages and is listed once.
  Kontekst: 'caseStudy.eyebrow.context',
  'Moja uloga': 'caseStudy.eyebrow.role',
  Pristup: 'caseStudy.eyebrow.approach',
  Rezultat: 'caseStudy.eyebrow.outcome',
  Tehnologije: 'caseStudy.eyebrow.stack',
  'Šta bih uradio drugačije': 'caseStudy.eyebrow.reflection',
};

/** Throws with the full list of known headings, which is what makes the failure useful. */
export function eyebrowKeyFor(heading: string): string {
  const key = SECTION_EYEBROW[heading];
  if (!key) {
    throw new Error(
      `Case study body: no eyebrow key for heading "${heading}". ` +
        `Design System §6.3 requires one above every S2 section. ` +
        `Known headings: ${Object.keys(SECTION_EYEBROW).join(', ')}.`,
    );
  }
  return key;
}
