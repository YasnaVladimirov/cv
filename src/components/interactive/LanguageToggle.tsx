/**
 * EN / SR switch (Design System §7.16).
 *
 * One button, not a select and not a dropdown. With exactly two languages a
 * menu adds a step to a one-step action, and both labels stay visible so the
 * alternative is discoverable without opening anything.
 *
 * `aria-label` names the ACTION, not the state — "Switch to Serbian" while
 * English is active. A screen reader already announces `aria-pressed`; a label
 * that also described the state would say the same thing twice, and in the
 * opposite direction.
 *
 * All the real work is in the store: setLanguage writes <html lang>, persists
 * to localStorage, swaps translated attributes and fires the analytics event
 * (src/lib/i18n.ts). This component decides nothing.
 */
import { toggleLanguage } from '../../lib/i18n';
import { useI18n } from '../../lib/i18n-react';

interface Props {
  className?: string;
}

export default function LanguageToggle({ className }: Props) {
  const { lang, t } = useI18n();
  const isSerbian = lang === 'sr';

  const label = (forLang: 'en' | 'sr') =>
    lang === forLang ? 'font-semibold text-text-primary' : 'font-medium text-text-tertiary';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-pressed={isSerbian}
      aria-label={t(isSerbian ? 'language.switchToEnglish' : 'language.switchToSerbian')}
      className={[
        'group inline-flex h-[32px] items-center gap-1 rounded-full',
        'border border-border-subtle bg-bg-elevated px-2 font-mono text-mono-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/*
        Both labels are always rendered, so the control never changes width on
        toggle — a button that resizes under the pointer invites a mis-click on
        whatever moves into its place.
      */}
      <span className={`transition-colors duration-fast ease-out ${label('en')}`}>
        {t('language.en')}
      </span>
      <span aria-hidden="true" className="text-text-tertiary">
        /
      </span>
      <span className={`transition-colors duration-fast ease-out ${label('sr')}`}>
        {t('language.sr')}
      </span>
    </button>
  );
}
