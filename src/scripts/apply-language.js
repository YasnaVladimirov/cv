/**
 * Runs inline in <head>, BEFORE any stylesheet, on every page.
 *
 * Sets <html lang> from the stored preference so the CSS that shows one
 * language and hides the other is already correct at first paint. Without
 * this, a returning Serbian visitor sees a frame of English on every
 * navigation (PRD FR-6, App Flow 2.3).
 *
 * Constraints, all deliberate:
 *  - no imports, no build step: it is inlined verbatim via is:inline
 *  - synchronous and tiny: it blocks the parser by design, which is the point
 *  - never throws: localStorage access throws outright in some hardened and
 *    private-browsing configurations, and a thrown error here would leave the
 *    page in the default language with no styles applied yet
 *
 * The storage key must stay in step with STORAGE_KEY in src/lib/i18n.ts.
 */
(function () {
  try {
    var stored = localStorage.getItem('lang');
    if (stored && stored.toLowerCase().indexOf('sr') === 0) {
      document.documentElement.lang = 'sr-Latn';
    }
  } catch (e) {
    /* storage unavailable — English default stands, toggle still works */
  }
})();
