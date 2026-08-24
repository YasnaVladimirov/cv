/**
 * A multi-line form control (Design System §7.8).
 *
 * Identical to TextInput apart from its box: the min/max height pair and
 * `resize: vertical`. Horizontal resize is off because dragging it wider
 * breaks the form's grid, and the browser's default `both` allows exactly
 * that.
 */
import type { TextareaHTMLAttributes } from 'react';
import { useI18n } from '../../lib/i18n-react';
import { CONTROL_CLASSES } from './TextInput';

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  placeholderKey?: string;
  invalid?: boolean;
}

export default function Textarea({ placeholderKey, invalid, className, ...rest }: Props) {
  const { t } = useI18n();
  return (
    <textarea
      {...rest}
      placeholder={placeholderKey ? t(placeholderKey) : undefined}
      className={[
        CONTROL_CLASSES,
        'min-h-[120px] max-h-[320px] resize-y p-3 leading-[26px]',
        invalid ? 'border-error' : 'border-border focus:border-accent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
