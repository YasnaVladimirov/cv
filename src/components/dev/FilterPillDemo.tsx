/**
 * Showcase harness for FilterPill (plan §3.14). DEV-ONLY, deleted in Phase 10.3.
 *
 * FilterPill takes an `onClear` callback, and a callback cannot cross the
 * Astro-to-island boundary. Phase 5 owns the real state.
 */
import { useState } from 'react';
import FilterPill from '../interactive/FilterPill';
import { buttonClasses } from '../../lib/button-classes';

export default function FilterPillDemo() {
  const [skill, setSkill] = useState<string | null>('FIXTURE-React');
  return (
    <div className="flex flex-wrap items-center gap-4">
      <FilterPill skill={skill} onClear={() => setSkill(null)} />
      {skill === null && (
        <button
          type="button"
          className={buttonClasses('ghost')}
          onClick={() => setSkill('FIXTURE-React')}
        >
          Re-apply filter
        </button>
      )}
    </div>
  );
}
