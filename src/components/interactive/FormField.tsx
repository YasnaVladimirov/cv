/**
 * The complete labelled field unit (Design System §7.9).
 *
 * Every input and textarea on the site appears inside one of these. That is
 * not a style preference: the wrapper is what owns the `for`/`id` pairing, the
 * `aria-describedby` wiring to the helper and error text, and `aria-invalid`.
 * Left to each call site, one of those goes missing eventually, and the field
 * that loses it is the one a screen reader user cannot recover from.
 *
 * Children are a render prop rather than plain nodes so the control receives
 * the ids the wrapper generated. Cloning children to inject props would do the
 * same thing invisibly, and invisible is how this wiring breaks.
 *
 * A consequence worth knowing: this cannot be mounted directly from a .astro
 * file. Children crossing the Astro-to-island boundary arrive as slot content,
 * not as a function, and the island throws. That is the right shape — this
 * component and the two controls it wraps are only ever used inside
 * ContactForm, which is itself the island. See src/components/dev/FormFieldDemo.tsx.
 */
import type { ReactNode } from 'react';
import { CircleAlert } from '../../lib/icons-react';
import { useI18n } from '../../lib/i18n-react';

export interface FieldA11y {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
}

interface Props {
  id: string;
  labelKey: string;
  /** Brief instructions, rendered above the control (§7.9). */
  helperKey?: string;
  /** Dictionary key for the current validation error, or null when valid. */
  errorKey?: string | null;
  children: (a11y: FieldA11y) => ReactNode;
}

export default function FormField({ id, labelKey, helperKey, errorKey, children }: Props) {
  const { t } = useI18n();

  const helperId = helperKey ? `${id}-helper` : undefined;
  const errorId = errorKey ? `${id}-error` : undefined;
  // Both, in reading order. A field can carry instructions and an error at
  // once, and dropping the helper the moment an error appears takes the
  // instructions away exactly when they are most needed.
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-[6px] text-sm font-medium text-text-primary">
        {t(labelKey)}
      </label>

      {helperKey && (
        <p id={helperId} className="mb-[6px] text-sm text-text-secondary">
          {t(helperKey)}
        </p>
      )}

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': errorKey ? true : undefined,
      })}

      {errorKey && (
        <p id={errorId} className="mt-[6px] flex items-center gap-1 text-sm text-error">
          <CircleAlert size={14} aria-hidden="true" className="shrink-0" />
          {t(errorKey)}
        </p>
      )}
    </div>
  );
}
