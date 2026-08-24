/**
 * The React half of Button (Design System §7.1–7.4).
 *
 * Exists because an Astro component cannot render inside a React island, and
 * the contact form needs a button whose label changes mid-submit. It shares
 * `buttonClasses` with Button.astro, so the two cannot drift in appearance —
 * only in what they can do.
 *
 * The loading state lives here and nowhere else. §7.1 puts the announcement on
 * the form container via aria-live, not on the button: a button that renames
 * itself while a screen reader is reading it produces a garbled interruption,
 * and the message a user needs ("sending") belongs to the form.
 */
import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from '../../lib/icons-react';
import {
  buttonClasses,
  ICON_SIZE,
  type ButtonSize,
  type ButtonVariant,
} from '../../lib/button-classes';
import { useI18n } from '../../lib/i18n-react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  labelKey: string;
  /** Swaps the label and disables the button while a submit is in flight. */
  loading?: boolean;
  loadingKey?: string;
}

export default function Button({
  variant = 'primary',
  size = 'default',
  labelKey,
  loading = false,
  loadingKey,
  disabled,
  className,
  ...rest
}: Props) {
  const { t } = useI18n();
  const label = loading && loadingKey ? loadingKey : labelKey;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-disabled={disabled || loading ? true : undefined}
      className={[buttonClasses(variant, size), className].filter(Boolean).join(' ')}
    >
      {loading && (
        <LoaderCircle size={ICON_SIZE} aria-hidden="true" className="animate-spin shrink-0" />
      )}
      {t(label)}
    </button>
  );
}
