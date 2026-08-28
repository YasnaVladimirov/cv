/**
 * In-page scrolling, shared by the header nav, the skill filter and the toast.
 *
 * JS-driven rather than CSS `scroll-behavior: smooth`, which Design System
 * §3.7 rules out explicitly: browsers apply it inconsistently under reduced
 * motion, and the reduced path here has to be a genuine instant jump rather
 * than a faster glide (§3.7, App Flow §7.1).
 *
 * Stateless on purpose. Everything else in Phase 5 is a module-scope store
 * that must exist exactly once; these are pure functions, so it does not
 * matter how many bundles end up with a copy.
 */

/** Read per call, not cached: the preference can change mid-session. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

/**
 * Moves focus to what the section is labelled by — its H2 — rather than to
 * the section box (App Flow §7.2). A sighted user gets the scroll; a screen
 * reader user gets read the heading of where they just arrived, which is the
 * same information.
 *
 * `preventScroll` because the smooth scroll is already running: focusing
 * without it teleports to the target and the animation never plays.
 */
export function focusSectionHeading(section: Element): void {
  const labelledBy = section.getAttribute('aria-labelledby');
  const heading = labelledBy ? document.getElementById(labelledBy) : null;
  const target = (heading ?? section) as HTMLElement;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/** Returns false when the id is not on the page, so callers can fall back to a real navigation. */
export function scrollToSection(id: string, options: { focus?: boolean } = {}): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  // scroll-margin-top on the section is what keeps the heading clear of the
  // sticky header (§5.5); scrollIntoView honours it, window.scrollTo does not.
  target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  if (options.focus !== false) focusSectionHeading(target);
  return true;
}

/** True when the element's top edge is outside the viewport below the header. */
export function isOffScreen(element: Element, headerHeight: number): boolean {
  const { top, bottom } = element.getBoundingClientRect();
  return top < headerHeight || bottom < headerHeight || top > window.innerHeight;
}

/** The sticky header's measured height, or the §5.5 default if it is absent. */
export function headerHeight(): number {
  const header = document.querySelector('header');
  return header instanceof HTMLElement ? header.offsetHeight : 72;
}
