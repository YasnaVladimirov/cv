/**
 * The floating contact button (Design System §7.17, App Flow §2.2).
 *
 * Visible only in the stretch of the page where it is useful: past the hero,
 * before the contact section. Both ends are IntersectionObserver rather than a
 * scroll listener — a scroll handler would run on every frame to answer a
 * question the browser can answer for free, and would need re-measuring on
 * every resize and content change.
 *
 * The third rule is the one that is easy to leave out and the most annoying to
 * hit: on a phone, a 48px button pinned 16px from the bottom sits exactly where
 * the keyboard pushes the focused field. So it also hides while any text entry
 * has focus.
 */
import { useEffect, useState } from 'react';
import { MessageCircle } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';

interface Props {
  /** Anchor the button points at. */
  href?: string;
  /** Elements whose visibility hides the button. */
  hideWhileVisible?: string[];
}

const TEXT_ENTRY = 'input, textarea, [contenteditable]';

export default function StickyFAB({
  href = '#contact',
  hideWhileVisible = ['#hero', '#contact'],
}: Props) {
  const { t } = useI18n();
  const [blockingVisible, setBlockingVisible] = useState(true);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const targets = hideWhileVisible
      .map((selector) => document.querySelector(selector))
      .filter((el): el is Element => el !== null);

    // Nothing to observe means nothing to hide behind: on a page without a
    // hero or a contact section the button would otherwise never appear.
    if (targets.length === 0) {
      setBlockingVisible(false);
      return;
    }

    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setBlockingVisible(visible.size > 0);
    });

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [hideWhileVisible.join(',')]);

  useEffect(() => {
    // focusin/focusout rather than focus/blur: those do not bubble, so a
    // listener on document would never see them.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      setTyping(Boolean(target?.matches?.(TEXT_ENTRY)));
    };
    const onFocusOut = () => setTyping(false);

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const hidden = blockingVisible || typing;

  return (
    <a
      href={href}
      // Hidden means hidden: without this it stays in the tab order as an
      // invisible stop, and a keyboard user lands on a control they cannot see.
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      className={[
        'z-sticky fixed right-4 bottom-4 md:right-6 md:bottom-6',
        'inline-flex h-[48px] items-center gap-2 rounded-full px-6',
        'bg-accent text-base font-medium text-text-inverse no-underline',
        'transition-opacity duration-base ease-out',
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
      style={{ boxShadow: 'var(--shadow-glass-hover)' }}
    >
      <MessageCircle size={20} aria-hidden="true" />
      {t('nav.contact')}
    </a>
  );
}
