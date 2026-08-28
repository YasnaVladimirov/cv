/**
 * The Calendly slot (Design System §7.23, App Flow §4.8).
 *
 * Three states, and the failure one is not exceptional: the widget is the
 * single most likely thing on this page to never load. Content blockers
 * routinely kill assets.calendly.com, and a booking surface that fails to a
 * blank rectangle loses the conversion the whole section exists for. So the
 * direct link is always reachable, and the widget is an upgrade on top of it.
 *
 * The placeholder is full-size rather than a spinner because it reserves the
 * embed's eventual dimensions. Anything smaller means the page reflows when
 * the widget arrives — a CLS hit on the tallest element of the page. It is
 * also the only skeleton the design system permits (§2).
 *
 * "Loaded" means an iframe actually appeared. `script.onload` only says the
 * file arrived; a widget that then fails to mount would leave the placeholder
 * up forever with nothing to click.
 */
import { useEffect, useRef, useState } from 'react';
import { Calendar, ExternalLink, ArrowUpRight } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';
import { buildEmbedUrl, isCalendlyConfigured, loadCalendlyScript } from '../../lib/calendly';

/** §4.8. Long enough for a slow connection, short enough to still be a fallback. */
const TIMEOUT_MS = 4000;

interface Props {
  /** Where "open it directly" goes. Falls back to the configured URL. */
  directUrl?: string;
  /** Showcase and dev override, so both states stay reviewable. */
  forceState?: 'loading' | 'failed';
}

type State = 'loading' | 'ready' | 'failed';

export default function CalendlyEmbed({ directUrl, forceState }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<State>(forceState === 'failed' ? 'failed' : 'loading');
  const host = useRef<HTMLDivElement>(null);

  const embedUrl = buildEmbedUrl();
  const target = directUrl || embedUrl || '#';

  useEffect(() => {
    if (forceState) return;

    // Nothing configured is not a failure to report to the visitor — but it is
    // also not something to keep spinning about, so it settles immediately.
    if (!isCalendlyConfigured()) {
      setState('failed');
      return;
    }

    let cancelled = false;
    // The one deadline that matters: whatever else happens, the visitor is
    // given something to click within four seconds.
    const timer = setTimeout(() => {
      if (!cancelled) setState((current) => (current === 'ready' ? current : 'failed'));
    }, TIMEOUT_MS);

    loadCalendlyScript()
      .then(() => {
        if (cancelled || !host.current || !window.Calendly) return;
        window.Calendly.initInlineWidget({ url: embedUrl, parentElement: host.current });

        // The widget mounts asynchronously after init, so readiness is the
        // iframe appearing rather than the call returning.
        const observer = new MutationObserver(() => {
          if (host.current?.querySelector('iframe')) {
            observer.disconnect();
            if (!cancelled) setState('ready');
          }
        });
        observer.observe(host.current, { childList: true, subtree: true });
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [embedUrl, forceState]);

  return (
    <div
      // Not aria-live: this is a region the user navigates to, and announcing
      // a timeout they did not trigger would interrupt whatever they are
      // reading elsewhere on the page.
      role="region"
      aria-label={t('sections.contact.heading')}
      className="w-full"
    >
      {/*
        The widget's host stays mounted in every state so React never removes a
        node Calendly is holding a reference to. It is only given height once
        the iframe is in, which is what lets the placeholder occupy the space
        until then without the two ever being visible at once.
      */}
      <div
        ref={host}
        aria-hidden={state !== 'ready'}
        className={
          state === 'ready' ? 'min-h-[540px] w-full md:min-h-[640px]' : 'h-0 overflow-hidden'
        }
      />

      {state !== 'ready' && (
        <div className="glass-strong flex min-h-[540px] w-full flex-col items-center justify-center gap-3 p-8 text-center md:min-h-[640px]">
          {state === 'failed' ? (
            <>
              <ExternalLink size={32} aria-hidden="true" className="text-text-secondary" />
              <p className="text-sm text-text-secondary">{t('contact.calendar.blocked')}</p>
              <a
                href={target}
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
      )}
    </div>
  );
}
