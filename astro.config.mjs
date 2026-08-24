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
  integrations: [react(), mdx(), sitemap()],
  // Tailwind v4 is a Vite plugin, not an Astro integration
  // (@astrojs/tailwind is deprecated and caps at Astro 5).
  // Design System 4.3.
  vite: {
    plugins: [tailwindcss()],
  },
});
