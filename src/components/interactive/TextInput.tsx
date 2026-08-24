/**
 * A single-line form control (Design System §7.7).
 *
 * Only ever used inside a FormField, which supplies the label and the aria
 * wiring. The placeholder is a hint, never a label substitute (§7.7) — every
 * field here has a real one.
 */
import type { InputHTMLAttributes } from 'react';
import { useI18n } from '../../lib/i18n-react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  /** Dictionary key. Placeholders are content, not decoration. */
  placeholderKey?: string;
  invalid?: boolean;
}

/**
 * Shared with Textarea so the two controls cannot drift. The focus ring comes
 * from the base stylesheet (§10.6); only the 1px border colour changes here.
 */
export const CONTROL_CLASSES = [
  'w-full rounded-sm border bg-bg-elevated text-base text-text-primary',
  'placeholder:text-text-tertiary',
  'transition-colors duration-fast ease-out',
  'disabled:bg-bg disabled:text-text-tertiary disabled:border-border-subtle',
].join(' ');

export default function TextInput({ placeholderKey, invalid, className, ...rest }: Props) {
  const { t } = useI18n();
  return (
    <input
      {...rest}
      placeholder={placeholderKey ? t(placeholderKey) : undefined}
      className={[
        CONTROL_CLASSES,
        'h-[44px] px-3',
        invalid ? 'border-error' : 'border-border focus:border-accent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
