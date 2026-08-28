/**
 * Anchor navigation and scrollspy for S1 (plan §5.1, App Flow §7.1–7.4).
 *
 * Not a React island, and deliberately. CLAUDE.md enumerates the islands this
 * site is allowed to have and the header nav is not among them; making it one
 * would also mean routing the nav labels through the React store, which would
 * cost the nav its no-JS rendering for nothing. Toggling `aria-current` on
 * three anchors is a job for eight lines of DOM code.
 *
 * The active link's appearance lives in Header.astro's stylesheet, keyed on
 * `aria-current`. This file therefore sets one attribute and never touches a
 * class, so the two cannot drift apart.
 */
import { scrollToSection, headerHeight } from '../lib/scroll';

/** Document order matters: `update()` picks the first of these that is in view. */
const SECTION_IDS = ['work', 'skills', 'contact'] as const;

/** §5.5 — the anchor's resting line is the header plus 16px. */
const HEADER_GAP = 16;

/**
 * How far up the viewport a section must reach before it counts as the one
 * being read. Without a bottom margin every section that is merely peeking in
 * from below would count, and the active link would run ahead of the reader.
 */
const SPY_BOTTOM_MARGIN = '-55%';

let activeId: string | null = null;

/** Toggles the attribute the header stylesheet keys on. Nothing else. */
function applyActive(id: string | null): void {
  if (id === activeId) return;
  activeId = id;

  for (const link of document.querySelectorAll('[data-nav-link]')) {
    if (link.getAttribute('data-nav-link') === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

/**
 * replaceState, not pushState: §7.4 wants Back to leave the site rather than
 * replay every section the reader scrolled through.
 */
function updateHash(id: string | null): void {
  history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
}

function isSpySection(id: string): boolean {
  return (SECTION_IDS as readonly string[]).includes(id);
}

function wireAnchors(): void {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as Element | null)?.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const id = decodeURIComponent(link.hash.slice(1));
    if (!id) return;

    // Only <section> targets are smooth-scrolled. That excludes the skip link,
    // whose target is <main> and which must jump instantly and hand over focus
    // — gliding a keyboard user to the content they asked to skip to is the
    // opposite of the point.
    const target = document.getElementById(id);
    if (!(target instanceof HTMLElement) || target.tagName !== 'SECTION') return;

    event.preventDefault();
    scrollToSection(id);
    updateHash(id);
    if (isSpySection(id)) applyActive(id);
  });
}

function wireSpy(): void {
  const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
    (el): el is HTMLElement => el !== null,
  );
  if (sections.length === 0) return;

  const visible = new Set<Element>();
  let observer: IntersectionObserver | null = null;

  const update = () => {
    const current = sections.find((section) => visible.has(section));
    const id = current ? current.id : null;
    if (id === activeId) return;
    applyActive(id);
    updateHash(id);
  };

  const observe = () => {
    observer?.disconnect();
    visible.clear();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        update();
      },
      { rootMargin: `-${headerHeight() + HEADER_GAP}px 0px ${SPY_BOTTOM_MARGIN} 0px` },
    );
    for (const section of sections) observer.observe(section);
  };

  // The header is 64px on mobile and 72px from md up, and the margin above is
  // baked into the observer at construction — so the observer is rebuilt when
  // that breakpoint is crossed rather than left pointing 8px off.
  const breakpoint = window.matchMedia('(min-width: 768px)');
  breakpoint.addEventListener('change', observe);
  observe();
}

export function initScrollNav(): void {
  // Seeded from the URL so that arriving at /#contact does not immediately
  // rewrite the address bar back to /.
  activeId = location.hash ? location.hash.slice(1) : null;
  wireAnchors();
  wireSpy();
}
