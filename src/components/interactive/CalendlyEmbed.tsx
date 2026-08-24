/**
 * The Calendly slot (Design System §7.23, App Flow §4.8).
 *
 * Phase 3 builds the two states that exist when Calendly is NOT there: the
 * placeholder and the failure. That ordering is deliberate — the widget is the
 * single most likely thing on this page to never load. Content blockers
 * routinely kill it, and a booking surface that fails to a blank rectangle
 * loses the conversion the whole section exists for.
 *
 * The placeholder is full-size rather than a spinner because it reserves the
 * embed's eventual dimensions. Anything smaller means the page reflows when
 * the widget arrives, which is a CLS hit on the tallest element of the page.
 * It is also the only skeleton the design system permits (§2).
 *
 * Real script loading arrives in Phase 6; the 4s timeout and both states are
 * already here so they can be reviewed before there is a third party to blame.
 */
import { useEffect, useState } from 'react';
import { Calendar, ExternalLink, ArrowUpRight } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';

/** §4.8. Long enough for a slow connection, short enough to still be a fallback. */
const TIMEOUT_MS = 4000;

interface Props {
  /** Where "open it directly" goes. [HUMAN] supplies the real URL in Phase 6. */
  directUrl?: string;
  /** Showcase and dev override; Phase 6 replaces this with the real load. */
  forceState?: 'loading' | 'failed';
}

export default function CalendlyEmbed({ directUrl = '#', forceState }: Props) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(forceState === 'failed');

  useEffect(() => {
    if (forceState) return;
    const timer = setTimeout(() => setFailed(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [forceState]);

  return (
    <div
      className="glass-strong flex min-h-[540px] w-full flex-col items-center justify-center gap-3 p-8 text-center md:min-h-[640px]"
      // Not aria-live: this is a region the user navigates to, and announcing
      // a timeout they did not trigger would interrupt whatever they are
      // reading elsewhere on the page.
      role="region"
      aria-label={t('sections.contact.heading')}
    >
      {failed ? (
        <>
          <ExternalLink size={32} aria-hidden="true" className="text-text-secondary" />
          <p className="text-sm text-text-secondary">{t('contact.calendar.blocked')}</p>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent no-underline hover:underline"
          >
            {t('contact.calendar.openDirect')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </>
      ) : (
        <>
          <Calendar size={32} aria-hidden="true" className="text-text-secondary" />
          <p className="text-sm text-text-secondary">{t('contact.calendar.loading')}</p>
        </>
      )}
    </div>
  );
}
