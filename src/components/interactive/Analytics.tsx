/**
 * Event instrumentation (plan §6.3, PRD FR-7, App Flow §5).
 *
 * Renders nothing. One island that loads the provider and attaches the
 * delegated listeners, for the same reason ResumeToast is one: the provider
 * lives in a module-scope variable, and events fired from other islands only
 * reach it if they share the instance. Islands share a bundle graph; an Astro
 * <script> would not.
 *
 * Every listener is delegated from `document`, so nothing here depends on
 * markup that Phase 9's real content might rearrange — a card, a footer link
 * and a case-study link are recognised by where they point, not by a class.
 *
 * No PII, ever. Event names and non-personal props only: a hostname, a slug,
 * a percentage. Never a form value, never an email address.
 */
import { useEffect } from 'react';
import { initAnalytics, trackEvent } from '../../lib/analytics';

/** PRD FR-7 asks for quartiles. */
const DEPTHS = [25, 50, 75, 100] as const;

/** Calendly's own origin, the only one whose postMessage is trusted. */
const CALENDLY_ORIGIN = 'https://calendly.com';

function calendlySource(link: Element): string {
  if (link.closest('header')) return 'header';
  if (link.closest('article')) return 'case_study';
  if (link.closest('[role="region"]')) return 'embed_fallback';
  return 'other';
}

export default function Analytics() {
  useEffect(() => {
    initAnalytics();

    // A case study opened directly counts the same as one reached from a card.
    const slug = location.pathname.match(/^\/work\/([^/]+)\/?$/)?.[1];
    if (slug) trackEvent('case_study_open', { slug, from: 'direct' });

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const link = (event.target as Element | null)?.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;

      if (link.id === 'hero-book') trackEvent('cta_hero_book');

      const internalStudy = link.getAttribute('href')?.startsWith('/work/');
      if (internalStudy) {
        trackEvent('case_study_open', {
          slug: link.getAttribute('href')!.replace('/work/', ''),
          from: 'link',
        });
        return;
      }

      // Same-document anchors and relative paths are not outbound.
      let host: string;
      try {
        host = new URL(link.href, location.href).host;
      } catch {
        return;
      }
      if (host === '' || host === location.host) return;

      // Calendly is a destination in its own right, counted separately from
      // ordinary outbound links so booking intent stays legible.
      if (host.endsWith('calendly.com')) {
        trackEvent('calendly_open', { from: calendlySource(link) });
        return;
      }

      trackEvent('outbound_click', { host });
    };

    // Calendly reports a completed booking by postMessage from its iframe.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== CALENDLY_ORIGIN) return;
      const data = event.data as { event?: string } | null;
      if (data?.event === 'calendly.event_scheduled') trackEvent('calendly_booked');
    };

    document.addEventListener('click', onClick);
    window.addEventListener('message', onMessage);

    // --- scroll depth ----------------------------------------------------
    // Markers rather than a scroll handler: the browser answers "is this in
    // view?" for free, and a percentage of <main>'s height tracks the document
    // as lazy images and islands change it. A scroll listener would have to
    // re-measure on every frame to learn the same thing.
    const main = document.querySelector('main');
    let observer: IntersectionObserver | null = null;
    const markers: HTMLElement[] = [];

    if (main) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const depth = Number((entry.target as HTMLElement).dataset.depth);
          trackEvent('scroll_depth', { depth });
          // Each quartile is reported once per page view, not once per pass.
          observer?.unobserve(entry.target);
        }
      });

      for (const depth of DEPTHS) {
        const marker = document.createElement('span');
        marker.dataset.depth = String(depth);
        marker.setAttribute('aria-hidden', 'true');
        marker.style.cssText = `position:absolute;left:0;width:1px;height:1px;pointer-events:none;top:${depth}%`;
        main.append(marker);
        markers.push(marker);
        observer.observe(marker);
      }
    }

    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('message', onMessage);
      observer?.disconnect();
      for (const marker of markers) marker.remove();
    };
  }, []);

  return null;
}
