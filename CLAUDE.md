# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A bilingual (English / Serbian-Latin) CV & portfolio site for a frontend engineer. **The site is itself the work sample** — performance, accessibility, and code quality are the product, not decoration.

**Current state: Phases 0–5 complete.** Scaffold, tokens, content collections, the component library, page assembly, and every interactive system are built and deployed. Phase 6 (external integrations: form service, Calendly, analytics) is next, needs explicit human approval, and is blocked on [HUMAN] credentials for all three providers. Content is still fixtures and `TODO(human):` strings — real content lands in Phase 9.

Origin is `github.com/YasnaVladimirov/cv`. Push works over git; `gh` is authenticated to a different (JET) GitHub Enterprise host, so `gh` API commands fail against this repo — use plain `git`.

## The four specs and their authority order

Read specific document only when relevant. On conflict, higher wins; if they genuinely disagree, **ask the human — do not resolve it yourself** (`docs/implementation-plan-portfolio-website.md` §0.1).

1. `docs/implementation-plan-portfolio-website.md` (v1.8) — what to build, in what order, and definition-of-done per phase. **Read its Changelog first.**
2. `docs/design-system-portfolio-website.md` (v1.3) — every visual and component decision (tokens, prohibitions, component specs §7)
3. `docs/app-flow-portfolio-website.md` — navigation, state, interaction; the cross-cutting state matrix (§6) is the pre-launch verification grid
4. `docs/prd-portfolio-website.md` — goals, scope, non-functional targets

Note: the plan's §0.2 points at `/mnt/user-data/outputs/` — the docs are in `docs/` here.

## Locked decisions (do not re-litigate)

- **Second language is Serbian, Latin script.** Not Cyrillic, not Bulgarian.
- **Vercel from Phase 0** — every phase is verified on a live preview URL, not localhost.
- **Stop at every phase boundary.** Post the phase summary and wait for explicit approval before starting the next phase. Never run phases back-to-back.
- **No Playwright, no e2e, no browser-driven tests.** Removed 2026-08-24. Do not add `playwright`, `@axe-core/playwright`, or a `test:e2e` script in any phase. Vitest stays but covers `src/lib/` pure logic only.
- **Commits carry no Claude co-author trailer.** This repo is public and reads as the human's own work log. Message is exactly `phase-N.M: <imperative summary>` and nothing else.

## Working rules

- **Branch:** work directly on `main`, no feature branches. Never push a red build.
- **Commits:** one commit per numbered step, `phase-N.M: <imperative summary>`, e.g. `phase-3.2: implement Button primary variant with all states`. No trailers, no co-author lines, no session links. Never squash — the log is a build narrative that hiring managers will read.
- **[HUMAN] steps** (accounts, secrets, DNS, real content, permissions) are the human's. If blocked: finish everything else in the phase, stub the blocked step with `TODO(human):` describing exactly what's needed, report it in the phase summary, and continue with unblocked work. Do not stall.
- **Never invent a value.** Every color/size/spacing/radius/shadow/duration comes from the Design System token set. If a token is missing, stop and ask.
- **Never inline a user-visible string.** Every on-screen string goes through the i18n dictionary from the very first component.

## Architecture: the parts that need multiple docs to understand

### i18n is client-side and single-URL — this drives everything

There are no `/sr/` routes. One set of URLs; a header toggle swaps every string in place with no reload and no scroll jump (PRD FR-6, App Flow §2.3).

- Astro's built-in i18n routing is **deliberately not enabled** — it would create per-locale URLs and contradict this model.
- UI strings (chrome: buttons, labels, errors, toasts, 404) live in `src/content/i18n/{en,sr}.json`. Content strings (timeline bullets, case-study prose, testimonials) live beside their content in the collections as parallel `_en`/`_sr` fields. Don't mix the two.
- A module-scope store in `src/lib/i18n.ts` holds the active language; React islands subscribe and re-render. An inline `<head>` script (`src/scripts/apply-language.js`) applies `localStorage.lang` **before first paint** so a returning Serbian visitor never sees a flash of English.
- Switching also updates `document.documentElement.lang` (`en` ↔ `sr-Latn`), swaps the resume CTA target (`cv.pdf` ↔ `cv-sr.pdf`), and fires `lang_switch`.
- Case-study MDX bodies ship **both** languages in the HTML, in `data-lang="en"` / `data-lang="sr"` blocks, shown/hidden by CSS keyed on `html[lang]`. Doubled page weight is the accepted trade for an instant, JS-light switch.
- Accepted consequences: search engines index English only; without JS the site is English-only and the toggle does not render.

### Static-first, third-party-optional

Astro static output with React islands **only** where interaction demands it (language toggle, skill filter, sticky FAB, toast, contact form, Calendly embed). Everything else is `.astro`. The site must work fully with every third party down: Calendly lazy-loads behind a fallback link (tracker blockers commonly kill it), the form degrades to a `mailto:`, resume downloads are plain `<a download>`, and analytics failure must never affect the page.

### Content is data, not components

All roles, skills, case studies, and testimonials live in Astro Content Collections with Zod schemas (`src/content/config.ts`). Adding a job or fixing a Serbian typo must never require touching a component. Sections adapt to content count: 0 testimonials → section absent (the launch state); 1 case study → spotlight layout; 3 → grid.

### Tailwind v4 is CSS-first — the theme is the stylesheet

`src/styles/base.css` holds an `@theme` block that IS the design token system (Design System §4.2). Two things about it are easy to get wrong and fail silently:

- Every namespace is wiped with `--namespace-*: initial` **before** its allowed tokens are declared. Skip one and Tailwind's entire default scale leaks back in — the full colour palette, the dynamic spacing scale — with no error. `--spacing: initial` is what makes `p-5` and `gap-7` not exist.
- v4 has **no `corePlugins`**, so the gradient utilities cannot be deleted. Prohibition #1 (no gradients) rests entirely on the regex lint, which must catch both `linear-gradient`/`radial-gradient`/`conic-gradient` and the class forms `bg-linear-*`/`bg-radial*`/`bg-conic*`.

z-index and transition-duration have no v4 namespace; both are `@utility` blocks so component code names a token instead of a bare number.

### Verification is code, not vibes

Build/CI gates that block: `astro check`, Vitest unit tests (`src/lib/` only), i18n key parity between `en.json` and `sr.json`, font-subset check for Serbian glyphs (š đ č ć ž), both MDX language blocks present and non-empty, Lighthouse ≥95 perf and **=100 accessibility** on mobile, link check including PDFs, and regex lints for the design prohibitions (no gradients, no raw hex/px in components, no `outline: none` without `:focus-visible`).

Lighthouse's accessibility score is the **only** automated WCAG gate — it runs axe internally. It does not see the SR state, the form error state, or keyboard operability. Those live in `docs/manual-qa-checklist.md` (created in plan §8.4) and are walked by hand before launch.

## Absolute prohibitions (Design System §2 — no exceptions)

No gradients anywhere. No emoji as icons (Lucide only). No stock photography or illustrations. No scroll-jacking or parallax. No skeleton screens except the single Calendly placeholder. No text on glass below opacity 0.55. No animation without a `prefers-reduced-motion` alternative (reduced path is 0ms, not merely faster). No carousels or auto-advancing content. No hover-only affordances. No modals. No CAPTCHA (honeypot + timing only). No cookies of any kind. No custom scrollbars/cursors or replaced native controls. And no AI-default aesthetic tells — cream-and-terracotta, acid-green-on-black, broadsheet columns.

Visual identity is near-monochrome + one accent (deep teal `#0F766E`) + glass panels over solid low-opacity backdrop shapes. Boldness is spent there and nowhere else.

## Commands

These land as the project is scaffolded (plan Appendix A). **pnpm, not npm or yarn.**

```bash
pnpm dev              # dev server on :4321
pnpm build            # production build to dist/
pnpm preview          # serve dist/ locally

pnpm astro check      # typecheck
pnpm astro sync       # regenerate content collection types after a schema change
pnpm test             # unit tests (Vitest) — src/lib/ pure logic only
pnpm lint             # prettier + eslint
pnpm verify:fonts     # font subset check (Serbian glyphs)
pnpm verify:i18n      # i18n key parity check
pnpm verify:no-flash  # pre-paint language script precedes all styles
pnpm lhci             # Lighthouse CI locally
```

Run a single test: `pnpm vitest run path/to/file.test.ts -t "test name"`.

## Stack (pinned by plan §1)

Node **≥22.13** (Astro wants 22.12, pnpm 11.23 wants 22.13) · pnpm · **Astro 7.2.6** · **Tailwind v4.3.3** (CSS-first, via `@tailwindcss/vite`) · `@astrojs/react` 6 + **React 19.2.8** · **TypeScript 6.0.3** · `@astrojs/mdx` 7 + `@astrojs/markdown-satteri` · `lucide-astro` / `lucide-react` · self-hosted `@fontsource-variable/inter` and `jetbrains-mono` (Latin Extended subset) · Vercel · GitHub Actions · Vitest (`src/lib/` only) · `@lhci/cli`.

Three pins that look wrong but are deliberate:
- **TypeScript 6, not 7** — `@astrojs/check` peers `^5 || ^6`, and `astro check` is a blocking CI gate.
- **No `@astrojs/tailwind`** — deprecated, and its last release caps at Astro 5. Tailwind is a Vite plugin here.
- **No `tailwind.config.mjs`, no `postcss.config.mjs`, no autoprefixer** — v4 is CSS-first and handles all of it. The theme lives in `src/styles/base.css`.

Form service, calendar, and analytics providers are [HUMAN] choices deferred to Phase 6; their config arrives as `PUBLIC_`-prefixed env vars (plan Appendix B).

## How to answer

Be concise. Most important: **use simple wording.** Short sentences, plain language, no filler. Give the answer first, skip the wind-up.

Use the real technical terms — `LCP`, `hydration`, `content collection`, `island` — do not soften or rename them. **No analogies, no metaphors, no "think of it like…".** Simple wording means simple sentences around precise terms, not replacing the terms with everyday stand-ins.
