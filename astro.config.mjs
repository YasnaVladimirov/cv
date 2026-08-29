// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// Deliberately NO `i18n` config. Astro's i18n routing would create per-locale
// URLs, which contradicts the single-URL in-place translation model
// (PRD FR-6, App Flow 3.1). i18n is handled entirely by our own dictionary
// plus a client-side toggle. See plan step 0.3.
export default defineConfig({
  // TODO(human): replace with the production domain in Phase 7.5 / 10.1.
  site: 'https://example.com',
  output: 'static',
  build: {
    /*
     * The stylesheet is ~9KB and every page needs all of it, so inlining it
     * removes a render-blocking round trip. Measured in Phase 8.1 against
     * Lighthouse's simulated Slow 4G: LCP 2406ms external, 2254ms inlined.
     * The cost is that it is re-sent per page rather than cached across them,
     * which on a four-page site is the cheaper side of the trade.
     */
    inlineStylesheets: 'always',
  },
  integrations: [
    react(),
    mdx(),
    // Dev-only showcase pages (plan 1.4, 3.0) are real routes so they reach
    // the deploy preview, but they must never be indexed or advertised.
    // They also carry noindex and are deleted in Phase 10.3.
    sitemap({ filter: (page) => !/\/(tokens|components)\/?$/.test(page) }),
  ],
  // Tailwind v4 is a Vite plugin, not an Astro integration
  // (@astrojs/tailwind is deprecated and caps at Astro 5).
  // Design System 4.3.
  vite: {
    plugins: [tailwindcss()],
    build: {
      // The Design System 4.5 browser floor, stated explicitly because the
      // CSS minifier needs it. With no target, esbuild assumes browsers new
      // enough that -webkit-backdrop-filter is redundant and deletes it,
      // leaving one declaration where the glass recipe needs both. Verified:
      // without this line the emitted .glass rule carries a single form, and
      // whichever one is lost takes the blur with it on a supported browser
      // (Design System 3.6). scripts/verify-css-output.mjs guards the result.
      target: ['safari16.4', 'chrome111', 'firefox128'],
    },
  },
});
