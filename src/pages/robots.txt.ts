import type { APIRoute } from 'astro';

/**
 * robots.txt, generated rather than static (plan §7.4).
 *
 * The Sitemap line needs an absolute URL, and hard-coding it in
 * `public/robots.txt` would mean the production domain living in two places —
 * so step 7.5 would be a find-and-replace with one occurrence easy to miss.
 * Deriving it from `Astro.site` makes that step exactly one line in
 * `astro.config.mjs`.
 *
 * Nothing is disallowed. The dev-only /tokens and /components pages carry
 * `noindex` and are excluded from the sitemap, and disallowing them here would
 * be counterproductive: a crawler told not to fetch a page never sees the
 * noindex on it. They are deleted outright in Phase 10.3 regardless.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
