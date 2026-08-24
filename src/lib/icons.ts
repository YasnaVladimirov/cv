/**
 * The complete icon set. Every icon this site uses is named here and nowhere
 * else, so "which icons does the site use?" is a file you can read rather than
 * a grep across forty components (Design System §2, prohibition 2).
 *
 * Deep-imported per icon (`@lucide/astro/icons/x`) rather than pulled from the
 * package barrel: the barrel re-exports ~1600 icons, and while the bundler does
 * tree-shake them, it has to parse all 1600 modules first on every build.
 *
 * Two names in the Design System predate Lucide v1's rename:
 *   alert-circle → circle-alert     filter → funnel
 *
 * Sizes are set per use site via the `size` prop, from the value the component
 * spec gives (14 / 16 / 20 / 32). Lucide renders `currentColor`, so icons
 * inherit text colour and never need a colour of their own.
 */
import ArrowRightIcon from '@lucide/astro/icons/arrow-right';
export { default as ArrowRight } from '@lucide/astro/icons/arrow-right';
export { default as ArrowUpRight } from '@lucide/astro/icons/arrow-up-right';
export { default as Calendar } from '@lucide/astro/icons/calendar';
export { default as Check } from '@lucide/astro/icons/check';
export { default as CircleAlert } from '@lucide/astro/icons/circle-alert';
export { default as ExternalLink } from '@lucide/astro/icons/external-link';
export { default as Funnel } from '@lucide/astro/icons/funnel';
export { default as LoaderCircle } from '@lucide/astro/icons/loader-circle';
export { default as MessageCircle } from '@lucide/astro/icons/message-circle';
export { default as X } from '@lucide/astro/icons/x';

/**
 * The type of a Lucide Astro icon, for components that take one as a prop
 * (Button's trailing icon, Link's arrow). Inferred from a real icon rather
 * than hand-written: the package's own `AstroComponent` alias lives outside
 * its `exports` map, so it cannot be imported by path.
 */
export type Icon = typeof ArrowRightIcon;
