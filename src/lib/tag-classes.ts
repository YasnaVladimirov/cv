/**
 * Tag class recipe (Design System §7.12), shared by the component and the
 * skill filter — the same arrangement `button-classes.ts` already uses.
 *
 * The filter upgrades a server-rendered skill from a plain <span> to a
 * <button> in the browser, so the interactive and active appearances have to
 * exist in JavaScript as well as in the `.astro` template. Written twice they
 * would be free to drift, and the drift would show only in the one state
 * nobody re-checks: a skill that is currently the applied filter.
 */
export interface TagVariant {
  /** A skill in the matrix with at least one timeline match. */
  interactive?: boolean;
  /** This skill is the filter currently applied. */
  active?: boolean;
}

const BASE = 'inline-flex h-[24px] items-center rounded-sm px-2 font-mono text-mono-sm';

/** Stack tags, and skills with no matches — §7.12's non-interactive row. */
const STATIC = 'border border-border-subtle bg-bg-elevated text-text-secondary';

const INTERACTIVE_BASE = 'border transition-colors duration-fast ease-out';
const INTERACTIVE_REST =
  'border-border bg-bg-elevated text-text-primary hover:border-accent hover:bg-accent-subtle-bg hover:text-accent';
const INTERACTIVE_ACTIVE = 'border-accent bg-accent text-text-inverse';

export function tagClasses({ interactive = false, active = false }: TagVariant = {}): string {
  if (!interactive) return `${BASE} ${STATIC}`;
  return `${BASE} ${INTERACTIVE_BASE} ${active ? INTERACTIVE_ACTIVE : INTERACTIVE_REST}`;
}
