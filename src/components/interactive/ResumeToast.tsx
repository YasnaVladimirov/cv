/**
 * Fires the resume-download toast (plan §5.3, App Flow §2.5).
 *
 * Renders nothing. It exists to attach one delegated listener, and it is an
 * island rather than an Astro <script> for one reason: the toast store must be
 * the same module instance the ToastHost island subscribes to. Islands share a
 * bundle graph, so two islands importing `lib/toast` get one store — the same
 * arrangement the language store already relies on across four islands.
 *
 * It targets `a[download]` rather than an id or a marker attribute. Every
 * download on this site is the resume, by design — it is the only downloadable
 * asset in the PRD — so the selector says exactly what the feature is, and the
 * hero CTA and the 404 CTA are both covered without either having to opt in.
 *
 * The click is never prevented. The download is the point; the toast is an
 * acknowledgement of something that already happened, and if this island had
 * failed to load the link would still work (App Flow §2.5's no-JS row).
 */
import { useEffect } from 'react';
import { showToast } from '../../lib/toast';
import { trackEvent } from '../../lib/analytics';

export default function ResumeToast() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey) return;

      const link = (event.target as Element | null)?.closest('a[download]');
      if (!(link instanceof HTMLAnchorElement)) return;

      // The toast's inline action points at the contact section. On S1 that is
      // an in-page anchor; on the 404, which has no contact section, it has to
      // be a real navigation back to the home page.
      const linkHref = document.getElementById('contact') ? '#contact' : '/#contact';

      showToast({
        messageKey: 'toast.resumeDownload.message',
        linkKey: 'toast.resumeDownload.link',
        linkHref,
      });

      trackEvent('resume_download');
      if (link.closest('#hero')) trackEvent('cta_hero_resume');
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
