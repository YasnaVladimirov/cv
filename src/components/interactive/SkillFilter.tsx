/**
 * The skill filter (plan §5.2, App Flow §4.5–4.6, Design System §7.21).
 *
 * Progressive enhancement, and the shape of this component is that decision.
 * Phase 4 renders every skill as plain text — PRD FR-3 calls the filter
 * "progressive enhancement only" and App Flow §4.6 puts the no-JS state at
 * plain text for every skill, so a server-rendered <button> that cannot act
 * until an island loads is a promise the page might never keep. This island
 * upgrades the ones with matches to real buttons on mount, and a skill with
 * an empty match list is never upgraded — which is what makes App Flow's
 * zero-result state unreachable rather than merely unlikely.
 *
 * It owns the DOM outside itself, which is unusual for React and is the
 * point: the matrix and the timeline stay static HTML that a crawler and
 * Ctrl+F can both read, and only the behaviour is hydrated. Everything it
 * touches is addressed through data attributes Phase 4 put there on purpose —
 * `data-skill`, `data-timeline-matches`, `data-timeline-entry`.
 *
 * All of it lives in one island rather than a script plus an island because
 * the filter state and the pill must share one module instance; splitting
 * them across an Astro <script> and an island risks two bundles, two copies
 * of the state, and a pill that never updates.
 */
import { useEffect, useRef, useState } from 'react';
import FilterPill from './FilterPill';
import { tagClasses } from '../../lib/tag-classes';
import { headerHeight, isOffScreen, scrollToSection } from '../../lib/scroll';

/** Reads the role ids Phase 4 wrote onto each skill item. */
function matchesOf(item: Element): string[] {
  return (item.getAttribute('data-timeline-matches') ?? '').split(' ').filter(Boolean);
}

export default function SkillFilter() {
  const [active, setActive] = useState<string | null>(null);
  const buttons = useRef<HTMLButtonElement[]>([]);

  // --- mount: upgrade the matching skills, then listen -------------------
  useEffect(() => {
    const upgraded: HTMLButtonElement[] = [];

    for (const item of document.querySelectorAll('li[data-skill]')) {
      const skill = item.getAttribute('data-skill');
      if (!skill || matchesOf(item).length === 0) continue;

      const span = item.querySelector('span');
      if (!span) continue;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = tagClasses({ interactive: true });
      button.setAttribute('aria-pressed', 'false');
      button.dataset.skill = skill;
      // Moving the child nodes rather than copying textContent keeps whatever
      // the span held — today a text node, and a <T> pair if a tag ever needs
      // translating.
      button.append(...span.childNodes);
      span.replaceWith(button);
      upgraded.push(button);
    }

    buttons.current = upgraded;

    // Single-select: the active skill clicked again clears, which is one of
    // §7.21's three clear paths.
    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest('button[data-skill]');
      if (!(button instanceof HTMLButtonElement)) return;
      const skill = button.dataset.skill ?? null;
      setActive((current) => (current === skill ? null : skill));
    };

    // §7.21's second clear path. Scoped to #work because that is where the
    // filtered content is; Escape elsewhere on the page belongs to whatever
    // else is focused, and the toast already claims it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const work = document.getElementById('work');
      if (work && document.activeElement && work.contains(document.activeElement)) {
        setActive(null);
      }
    };

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // --- apply ------------------------------------------------------------
  useEffect(() => {
    for (const button of buttons.current) {
      const isActive = button.dataset.skill === active;
      button.className = tagClasses({ interactive: true, active: isActive });
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    const item = active ? document.querySelector(`li[data-skill="${CSS.escape(active)}"]`) : null;
    const ids = item ? matchesOf(item) : [];

    for (const entry of document.querySelectorAll('[data-timeline-entry]')) {
      if (!active) entry.removeAttribute('data-filter');
      else entry.setAttribute('data-filter', ids.includes(entry.id) ? 'match' : 'out');
    }
  }, [active]);

  // --- bring the result into view ---------------------------------------
  // Separate from the apply pass so clearing the filter never scrolls: the
  // reader is already looking at what they wanted back.
  useEffect(() => {
    if (!active) return;
    const work = document.getElementById('work');
    // focus: false — the click that applied the filter came from the skill
    // matrix, and pulling focus out from under it would strip the ability to
    // press the same skill again to clear.
    if (work && isOffScreen(work, headerHeight())) scrollToSection('work', { focus: false });
  }, [active]);

  if (!active) return null;

  return (
    /*
     * The strip, not the pill, is what is sticky (§7.21, §5.5: header + 16px).
     * It spans the column and carries the page background, so when it comes to
     * rest over an entry it covers that line outright instead of sitting on
     * half of it. Rendered only while a filter is applied — an always-present
     * strip would be an invisible 48px band lying across the timeline.
     */
    <div className="sticky top-[80px] z-content mb-8 bg-bg py-2 md:top-[88px]">
      <FilterPill skill={active} onClear={() => setActive(null)} />
    </div>
  );
}
