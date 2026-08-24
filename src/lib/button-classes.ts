/**
 * The Button recipe (Design System §7.1–7.4), as data rather than markup.
 *
 * Buttons are needed in two runtimes: `.astro` for everything static, and
 * React for the contact form, where the label swaps to "Sending…" mid-submit.
 * An Astro component cannot render inside a React island, so there have to be
 * two components — but there must not be two recipes. Both import this.
 *
 * Two Tailwind details this leans on:
 *
 *  - `enabled:` on every hover and active rule. Plain `hover:` still applies
 *    to a disabled button, so a disabled primary would light up on hover.
 *  - Heights are arbitrary values. §3.3 declares eleven spacing steps and none
 *    of them is 44, 36 or 32; `h-11` would emit no rule at all, silently
 *    (see scripts/verify-no-raw-values.mjs).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type ButtonSize = 'default' | 'small';

/**
 * Shared by all four variants. The focus ring is deliberately absent: the base
 * stylesheet establishes it on `:focus-visible` globally, and §10.6 forbids
 * overriding it per component.
 */
const BASE = [
  'inline-flex items-center justify-center gap-2',
  'rounded-md whitespace-nowrap',
  'transition-colors duration-fast ease-out',
  'disabled:cursor-not-allowed',
].join(' ');

const VARIANT: Record<ButtonVariant, string> = {
  // §7.1. translateY on press is primary-only; the spec lists it nowhere else.
  primary: [
    'bg-accent text-text-inverse shadow-flat',
    'enabled:hover:bg-accent-hover',
    'enabled:active:bg-accent-active enabled:active:translate-y-[1px]',
    'disabled:bg-accent/40',
  ].join(' '),

  // §7.2. Border colour carries the hover, so the button must not shift by a
  // pixel between states — border-width is constant, only its colour changes.
  secondary: [
    'border border-border bg-transparent text-text-primary',
    'enabled:hover:bg-bg-elevated enabled:hover:border-text-primary',
    'enabled:active:bg-bg-elevated enabled:active:border-text-primary',
    'disabled:text-text-tertiary disabled:border-border-subtle',
  ].join(' '),

  // §7.3
  ghost: [
    'bg-transparent text-text-secondary',
    'enabled:hover:bg-bg-elevated enabled:hover:text-text-primary',
    'enabled:active:bg-bg-elevated enabled:active:text-text-primary',
    'focus-visible:text-text-primary',
    'disabled:text-text-tertiary disabled:opacity-50',
  ].join(' '),

  // §7.4. Ghost's colours, but a filled hover background — the only difference
  // the spec draws between them.
  icon: [
    'bg-transparent text-text-secondary',
    'enabled:hover:bg-bg-elevated enabled:hover:text-text-primary',
    'enabled:active:bg-bg-elevated enabled:active:text-text-primary',
    'disabled:text-text-tertiary disabled:opacity-50',
  ].join(' '),
};

/**
 * `font-medium` is stated even where the type token already carries weight
 * 500: §7.1 specifies the weight on the button, and a later change to
 * `--text-base--font-weight` must not silently restyle every button.
 */
const SIZE: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: {
    default: 'h-[44px] px-6 text-base font-medium',
    small: 'h-[36px] px-4 text-sm font-medium',
  },
  secondary: {
    default: 'h-[44px] px-6 text-base font-medium',
    small: 'h-[36px] px-4 text-sm font-medium',
  },
  // §7.3 gives ghost one size only; `small` maps to the same box.
  ghost: {
    default: 'h-[36px] px-4 text-sm font-medium',
    small: 'h-[36px] px-4 text-sm font-medium',
  },
  // §7.4 gives icon one size: a 32px square holding a 16px glyph.
  icon: {
    default: 'h-[32px] w-[32px] shrink-0',
    small: 'h-[32px] w-[32px] shrink-0',
  },
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'default',
): string {
  return `${BASE} ${VARIANT[variant]} ${SIZE[variant][size]}`;
}

/** Icon glyph size in px, per variant (§7.1 trailing 16, §7.4 centred 16). */
export const ICON_SIZE = 16;
