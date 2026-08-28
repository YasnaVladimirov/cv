/**
 * The active-skill-filter indicator (Design System §7.21, App Flow §4.5).
 *
 * Presentational only. §7.21 makes the pill sticky within `#work`, but the
 * stickiness lives on a full-width strip in SkillFilter rather than on the
 * pill itself: a bare sticky pill is 282px of opaque background travelling
 * over a 1100px column, and it came to rest on top of an entry's "Read case
 * study" link — hiding half the words and taking the clicks. Found in the
 * Phase 5 visual pass. The pill draws itself; the caller positions it.
 *
 * §7.21 gives three ways to clear a filter: this close button, Escape while
 * focus is inside `#work`, and clicking the active skill again. The other two
 * are wired in Phase 5; this component owns only the button.
 *
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
