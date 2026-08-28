/**
 * Ephemeral confirmation (Design System §7.6). The only toast in V1 is the
 * resume-download acknowledgement.
 *
 * Mounted once per page. It renders nothing until something calls showToast(),
 * so the cost of having it present is one subscription.
 *
 * Three behaviours that are easy to get subtly wrong, and what they are for:
 *
 *  - The dismiss timer pauses on hover AND on focus. Hover alone covers a
 *    mouse user re-reading the message and misses a keyboard user who has just
 *    tabbed to the close button — the toast would vanish under their hands.
 *  - `role="status"` with `aria-live="polite"`, not `alert`. This is a
 *    confirmation of something the user just did, not an interruption.
 *  - Exit is 150ms while entry is 400ms (§3.7). A toast should arrive gently
 *    and leave promptly; matching them makes dismissal feel unresponsive.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';
import { dismissToast, subscribeToast, TOAST_DURATION_MS, type Toast } from '../../lib/toast';
import { scrollToSection } from '../../lib/scroll';

export default function ToastHost() {
  const { t } = useI18n();
  const [toast, setToast] = useState<Toast | null>(null);
  const [entered, setEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => subscribeToast(setToast), []);

  // Two frames: mount at the off state, then flip. One frame is not reliably
  // enough — the browser can batch the style change into the same paint and
  // the transition never runs.
  useEffect(() => {
    if (!toast) {
      setEntered(false);
      return;
    }
    setEntered(false);
    setPaused(false);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, [toast?.key]);

  // Restarting on `paused` is what makes the pause a real pause: leaving the
  // toast gives the reader the full duration again rather than the remainder.
  useEffect(() => {
    if (!toast || paused) return;
    timer.current = setTimeout(dismissToast, TOAST_DURATION_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast?.key, paused]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') dismissToast();
  }, []);

  useEffect(() => {
    if (!toast) return;
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toast, onKeyDown]);

  if (!toast) return null;

  return (
    <div
      key={toast.key}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={[
        'glass-strong z-toast fixed bottom-4 left-4 right-4 mx-auto',
        'flex min-w-[280px] max-w-[400px] items-start gap-2 p-4',
        'rounded-md text-sm text-text-primary',
        'sm:left-auto sm:mx-0',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-[8px] opacity-0',
      ].join(' ')}
      style={{
        boxShadow: 'var(--shadow-toast)',
        transition: `opacity var(--duration-${entered ? 'slow' : 'fast'}) var(--ease-out), transform var(--duration-${entered ? 'slow' : 'fast'}) var(--ease-out)`,
      }}
    >
      <Check size={16} aria-hidden="true" className="mt-1 shrink-0 text-accent" />

      <p className="min-w-0 flex-1">
        {t(toast.messageKey)}
        {toast.linkKey && toast.linkHref && (
          <>
            {' '}
            <a
              href={toast.linkHref}
              // Dismiss first, then scroll. Leaving the toast up while the page
              // travels to the section it pointed at reads as an acknowledgement
              // that outlived what it was acknowledging. A cross-page href — the
              // 404's `/#contact` — is left to the browser.
              onClick={(event) => {
                dismissToast();
                const href = toast.linkHref ?? '';
                if (href.startsWith('#') && scrollToSection(href.slice(1))) {
                  event.preventDefault();
                }
              }}
              className="font-medium text-accent no-underline hover:underline"
            >
              {t(toast.linkKey)}
            </a>
          </>
        )}
      </p>

      <button
        type="button"
        onClick={dismissToast}
        aria-label={t('toast.resumeDownload.dismiss')}
        className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md bg-transparent text-text-secondary transition-colors duration-fast ease-out hover:bg-bg-elevated hover:text-text-primary"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
