/**
 * The active-skill-filter indicator (Design System §7.21, App Flow §4.5).
 *
 * Sticky within `#work` only, not to the viewport. The pill answers "why am I
 * seeing a subset?", so it needs to be visible for exactly as long as the
 * filtered list is — and no longer. A viewport-fixed pill would follow the
 * reader into the contact form still announcing a filter they left behind.
 *
 * §7.21 gives three ways to clear a filter: this close button, Escape while
 * focus is inside `#work`, and clicking the active skill again. The other two
 * are wired in Phase 5; this component owns only the button.
 *
 * `top` is the header height plus 16px, per §5.5 — 80px mobile, 88px desktop.
 */
import { Funnel, X } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';

interface Props {
  /** The active skill, or null when no filter is applied. */
  skill: string | null;
  onClear: () => void;
  className?: string;
}

export default function FilterPill({ skill, onClear, className }: Props) {
  const { t } = useI18n();
  if (!skill) return null;

  return (
    <div
      className={[
        'sticky top-[80px] md:top-[88px]',
        'inline-flex h-[32px] items-center gap-2 rounded-sm px-3 py-1',
        'border border-accent bg-accent-subtle-bg text-sm font-medium text-accent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Funnel size={14} aria-hidden="true" className="shrink-0" />
      <span>{t('timeline.filter.showing', { skill })}</span>
      <button
        type="button"
        onClick={onClear}
        // Names the skill, not just "clear": read out of context, "Clear
        // filter" leaves a screen reader user to remember which one.
        aria-label={t('timeline.filter.clearAria', { skill })}
        className="inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-md bg-transparent text-accent transition-colors duration-fast ease-out hover:bg-bg-elevated"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
