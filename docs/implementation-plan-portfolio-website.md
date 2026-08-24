# Implementation Plan
## Personal CV & Portfolio Website — Mid-Level Frontend Engineer

| | |
|---|---|
| **Document status** | v1.6 |
| **Companion to** | PRD v1.0, App Flow v1.0, Design System v1.2 |
| **Audience** | Claude Code (executing agent) |
| **Sequencing** | Phases run in strict order. Do not start Phase N+1 until Phase N's verification passes. |

### Changelog

**v1.5** — In-place translation mechanism specified concretely: dual-render + CSS for static text, `data-i18n-*` attribute pairs for attributes, store subscription for React islands only. See §2.4.

**v1.4** — Content collections moved to `src/content.config.ts` with the Content Layer loader API (`glob()` / `file()`), which is what Astro 7 supports; `src/content/config.ts` is no longer resolved at all. Skills became one entry per category to suit the `file()` loader. See §2.1.

**v1.6** — Phase 3 build rules added to §3.0, each from a silent failure found while building it. Component dimensions must use arbitrary values (`h-[44px]`), because `--spacing: initial` makes `h-9` emit no rule at all. Display utilities must never be passed to a component through its `class` prop — the recipe already sets one, and which wins is decided by Tailwind's stylesheet order. `data-lang` must sit on a `<span>`, never on the semantic element, because `display: contents` deletes that element's box. Three new CI gates cover these: `verify:values`, `verify:css`, and the `data-lang` placement check. Design System advanced to v1.3.

**v1.3** — Dev-only showcase pages renamed from `_tokens` / `_components` to `tokens` / `components`. The underscore prefix excludes a page from routing altogether, so it never reached the deploy preview and the human approval gates in 1.4 and 3.x were unreachable. They are now real routes carrying `noindex`, excluded from the sitemap, unlinked from shipping pages, and deleted in Phase 10.3. See §1.4.

**v1.2** — Stack moved to the latest version of everything. Human decision, 2026-08-24. Astro 5 → **7**, Tailwind 3 → **4**, React 18 → **19**. Consequences:
- `@astrojs/tailwind` is **gone**. Its last release (6.0.2) supports Astro 5 at most and is deprecated upstream. Tailwind v4 wires in through `@tailwindcss/vite` as a Vite plugin instead (Design System §4.3).
- There is no `tailwind.config.mjs`. The theme is CSS-first, in `src/styles/base.css`. Design System §4 was rewritten for this; token *values* did not change.
- **TypeScript is pinned to 6.x, not 7.x.** `@astrojs/check@0.9.10` declares a peer of `^5 || ^6`. Since `astro check` is a blocking CI gate, TS 7 is not usable yet. Revisit when `@astrojs/check` widens the range.
- `@astrojs/mdx@7` requires `@astrojs/markdown-satteri` as an explicit peer — install it alongside.
- Node floor rises to **≥22.13.0** — Astro 7 requires 22.12 and pnpm 11.23 requires 22.13; the higher wins. `packageManager` is pinned in `package.json` because `pnpm/action-setup` reads its version from there.
- Browser floor rises to Safari 16.4+ / Chrome 111+ / Firefox 128+ (Tailwind v4).
- Step 8.3's gradient lint must now also catch v4 utility classes (`bg-linear-`, `bg-radial`, `bg-conic`), because v4 has no `corePlugins` to disable them with.

**v1.1** — Playwright removed from the project. Human decision, 2026-08-24. Consequences, all applied below:
- Step 8.4 (journey smoke tests) and Step 8.5 (cross-browser matrix) are **deleted**. Both become manual pre-launch checks in Step 8.6.
- Step 8.2 no longer runs `@axe-core/playwright`. The automated WCAG gate is now **Lighthouse's accessibility score = 100**, which runs axe internally. Accepted limitation: fewer rules than a full axe run, and only the default page state — not the SR language and not the form error state. Those move to the manual pass.
- Vitest stays, scoped to `src/lib/` pure logic only. No component tests, no DOM tests.
- Do not re-add Playwright, `@axe-core/playwright`, or `pnpm test:e2e` in any later phase.

---

## 0. How to execute this plan

### 0.1 Order of authority
1. This plan (build sequence and definition-of-done)
2. Design System (all visual and component decisions)
3. App Flow (all navigation, state, and interaction decisions)
4. PRD (goals, scope, non-functional requirements)
5. This document tells you *what to build and when*. The other three tell you *how*. If any conflict, ask the human — do not resolve on your own.

### 0.2 Before you start Phase 0
Read all four documents in full. All are in `docs/` at the repo root:
- `prd-portfolio-website.md`
- `app-flow-portfolio-website.md`
- `design-system-portfolio-website.md`
- `implementation-plan-portfolio-website.md` (this file)

### 0.3 Universal rules (apply throughout every phase)

1. **Never invent values.** Every color, size, spacing, radius, shadow, and duration comes from the Design System's token set. If a needed token doesn't exist, stop and ask.
2. **Never inline content.** Every string that will appear on screen goes through the i18n dictionary (set up in Phase 2). No hardcoded English (or Serbian) strings in components — ever, starting from the first component.
3. **Every component is built to spec.** Match the Design System §7 exactly — no invented states, sizes, or variants.
4. **Every commit is deployable.** Never commit code that breaks the build. If mid-refactor, commit to a branch.
5. **Ask, don't assume, on human-only tasks.** Account creation, secrets, DNS, real content, permissions, and legal decisions are the human's. Every one of these is flagged in the phase where it appears with a **[HUMAN]** tag.
6. **Verify before advancing.** Every phase ends with a "Verification" checklist. Do not begin the next phase until every box is ticked.
7. **Commit at the end of each numbered step within a phase**, not just at the end of the phase. Small commits are recoverable; giant commits are not.
8. **Report progress at the end of each phase** — a single message summarizing what was built, what verification passed, and what (if anything) is blocked on a **[HUMAN]** input.

### 0.4 Commit message convention
```
phase-N.M: <imperative summary>

<optional body: what and why, one paragraph>
```
Example: `phase-3.2: implement Button primary variant with all states`

### 0.5 Branching
Work directly on `main`. Every push triggers a Vercel preview deploy (set up in Phase 0). Do not create feature branches — this is a single-agent, single-repo build; branches add coordination overhead with no benefit.

Exception: **any change that fails the CI checklist** (Design System §11) must be reverted before push. Never push a red build.

### 0.6 Reporting blockers
If a phase step is blocked on a **[HUMAN]** input, do the following:
1. Complete every step in the phase that isn't blocked.
2. Stub the blocked step with a `TODO(human):` comment describing exactly what's needed.
3. Report the blocker in the phase summary.
4. Advance to the next phase's non-blocked steps — do not stall waiting.

---

## 1. Stack summary (pinned)

Confirming and pinning what the PRD §6 and Design System §4 recommended:

| Layer | Choice | Version notes |
|---|---|---|
| Runtime | Node.js | **≥ 22.13.0**. Astro 7's own floor is 22.12, but pnpm 11.23 requires 22.13 — the higher of the two wins. CI runs 24.x to match local development. |
| Package manager | **pnpm** | Fastest, disk-efficient, correct hoisting. Not npm, not yarn. |
| Framework | **Astro 7.2.6** | Latest. Note the engine floor above. |
| Styles | **Tailwind CSS 4.3.3** | CSS-first. No `tailwind.config.mjs`; the theme is an `@theme` block in `src/styles/base.css` per Design System §4.2. Wired via `@tailwindcss/vite` — **not** `@astrojs/tailwind`, which is deprecated and caps at Astro 5. |
| TypeScript | **6.0.3** | Deliberately not 7.x: `@astrojs/check` peers `^5 \|\| ^6`, and `astro check` is a blocking CI gate. |
| React islands | `@astrojs/react` 6.0.4 + **React 19.2.8** | Only for genuinely interactive components (language toggle, skill filter, sticky FAB, toast, form). Everything else is `.astro`. |
| Icons | `lucide-astro` (primary) + `lucide-react` (inside React islands) | Never Font Awesome. Never Material Icons. Never emoji. |
| Fonts | `@fontsource-variable/inter` + `@fontsource-variable/jetbrains-mono` | Self-hosted, subset to Latin + Latin Extended (Section 9.2 of Design System). Note the family names these expose are `Inter Variable` and `JetBrains Mono Variable` — Design System §4.2's `--font-sans` / `--font-mono` list them first. |
| MDX | `@astrojs/mdx` 7.0.8 + `@astrojs/markdown-satteri` | The second package is a declared peer of the first; install both. |
| Content | Astro Content Collections (Markdown/MDX + JSON) | In-repo. No CMS. |
| Hosting | **Vercel** (primary) | Netlify or Cloudflare Pages acceptable alternates. |
| Form service | To be confirmed **[HUMAN]** in Phase 6 | Default: Web3Forms (simplest, no account needed for basic use) or Formspree |
| Calendar | **[HUMAN]** — Calendly or Cal.com | Human provides embed URL + optional event UUID in Phase 6 |
| Analytics | **[HUMAN]** — Plausible / Fathom / Umami | Human provides site ID / script URL in Phase 6 |
| CI | GitHub Actions | Matrix: install, typecheck, lint, unit test, verify scripts, Lighthouse CI |
| Testing | **Vitest only**, scoped to `src/lib/` pure logic. **No Playwright, no e2e, no browser-driven tests.** A11y is gated by Lighthouse's accessibility score (=100), which runs axe internally. |

---

## Phase 0 — Bootstrap

**Objective**: Empty repo becomes a running Astro project deployed to a Vercel preview URL, with CI green.

**Prerequisites**: None (this is the start).

### Step 0.1 — Create repository **[HUMAN]**

Ask the human to:
1. Create a **public** GitHub repository (per PRD §6.3 recommendation — public reads as a second portfolio artifact for hiring managers).
2. Name it something professional (`firstnamelastname-site` or `personal-site` — the human decides).
3. Grant the agent access or provide the clone URL.
4. Decide on the site's eventual custom domain (not required to purchase yet, but decide the name for OG metadata later).

Wait for the URL before continuing. Do not create a GitHub repo yourself.

### Step 0.2 — Initialize Astro project

Clone the empty repo. Inside it, run:
Do **not** run `pnpm create astro` — the repo already contains `docs/`, `CLAUDE.md`, `README.md`, and git history, and the scaffolder is interactive and will fight a non-empty directory. Write `package.json`, `tsconfig.json`, and `astro.config.mjs` by hand with the versions pinned in §1, then:

```bash
pnpm install
```

The dependency set, for reference:
```bash
# runtime
astro@7.2.6 react@19.2.8 react-dom@19.2.8
@astrojs/react@6.0.4 @astrojs/sitemap@3.7.3 @astrojs/mdx@7.0.8 @astrojs/markdown-satteri@0.3.8
@tailwindcss/vite@4.3.3 tailwindcss@4.3.3
@fontsource-variable/inter@5.3.0 @fontsource-variable/jetbrains-mono@5.3.0
lucide-astro@0.556.0 lucide-react@1.34.0

# dev
@astrojs/check@0.9.10 typescript@6.0.3
@types/react@19.2.18 @types/react-dom@19.2.5
prettier@3.9.6 prettier-plugin-astro@0.14.1
vitest@4.1.11
```

There is no `postcss.config.mjs` and no `autoprefixer` — Tailwind v4 handles both itself.

Verify: `pnpm dev` starts the server on `localhost:4321` and shows the Astro welcome page. Then stop the server.

Commit: `phase-0.2: initialize Astro project with core dependencies`

### Step 0.3 — Configure `astro.config.mjs`

Create the config with React, sitemap, and MDX integrations, and Tailwind as a **Vite plugin** (`vite: { plugins: [tailwindcss()] }`) per Design System §4.3 — there is no Tailwind Astro integration in this stack. Set `site` to a placeholder (the future production URL — use `https://example.com` for now, replace in Phase 7). Set `output: 'static'`. Set `i18n` config using Astro's built-in i18n with `en` as default and `sr` as a locale — but **prefixDefaultLocale: false and routing.strategy: 'manual'**, because per PRD FR-6 we do not use route-based i18n. We're using Astro's i18n only for helper utilities and `lang` attribute handling.

Actually — override: **do not enable Astro's i18n routing at all.** It would create per-locale URLs, which contradicts the in-place client-side translation model (PRD FR-6, App Flow §3.1). Handle i18n entirely through our own dictionary + client-side toggle. Set no i18n config in `astro.config.mjs`.

Commit: `phase-0.3: configure astro with tailwind, react, sitemap integrations`

### Step 0.4 — Set up directory structure

Create the following structure, all empty except where noted:
```
src/
  components/
    ui/           # atomic components (Button, Link, TextInput, Toast, Tag, ...)
    layout/       # Header (Home + CaseStudy variants), Footer, SkipToContent, StickyFAB
    sections/     # HeroSection, ProofStrip, TimelineSection, CaseStudiesSection, SkillMatrix, ContactSection
    content/      # CaseStudyCard, TimelineEntry, TestimonialCard, MetricCallout, SectionEyebrow
    interactive/  # LanguageToggle, SkillFilter, ContactForm, CalendlyEmbed (React islands)
  content/
    case-studies/ # MDX files, one per case study; frontmatter defines both languages
    roles/        # JSON, one per role in timeline
    skills/       # JSON, skill matrix definitions
    testimonials/ # JSON (initially empty per launch decision)
    i18n/
      en.json     # UI strings — English
      sr.json     # UI strings — Serbian
  layouts/
    BaseLayout.astro       # <html>, <head>, base structure
    HomeLayout.astro       # extends BaseLayout, uses Header variant A
    CaseStudyLayout.astro  # extends BaseLayout, uses Header variant B
  pages/
    index.astro   # S1 — home
    work/
      [slug].astro # S2 — case study, dynamic route
    404.astro     # S3
  styles/
    base.css      # tokens + reset + global rules from Design System §4
  lib/
    i18n.ts       # translation helpers, language state store
    analytics.ts  # event dispatcher (stubbed in Phase 0)
public/
  fonts/          # subset WOFF2 files added in Phase 1
  cv.pdf          # placeholder — replaced by human in Phase 9
  cv-sr.pdf       # placeholder — replaced by human in Phase 9
  og-default.png  # placeholder — replaced in Phase 7
```

Create every directory with a `.gitkeep` file if empty. Create every listed file as an empty stub with a one-line comment describing its purpose. This scaffolds the mental model of the whole project up front.

Commit: `phase-0.4: scaffold full directory structure`

### Step 0.5 — Set up hosting **[HUMAN]**

Ask the human to:
1. Sign in to Vercel (free tier).
2. Import the GitHub repo.
3. Confirm the framework preset is auto-detected as Astro; deploy with defaults.
4. Share the resulting preview URL (`<project>.vercel.app`).

Verify the first deploy succeeded (Astro welcome page or empty state renders). Do not proceed until this works — every subsequent step needs the preview URL to be live.

### Step 0.6 — Set up CI (GitHub Actions)

Create `.github/workflows/ci.yml` with jobs:
- `install`: `pnpm install --frozen-lockfile`
- `typecheck`: `pnpm astro check`
- `build`: `pnpm build`
- `lint`: prettier check + eslint (configure both with sensible Astro/React defaults)

Do NOT add Lighthouse CI yet — it comes in Phase 8 (it needs pages to test against).

Ensure CI runs on every push to `main` and every PR. Verify the first CI run passes.

Commit: `phase-0.6: add ci workflow with install, typecheck, build, lint`

### Phase 0 verification

- [ ] Public GitHub repo exists and is cloned locally.
- [ ] `pnpm dev` runs without error.
- [ ] `pnpm build` succeeds and produces `dist/`.
- [ ] Vercel preview URL renders the built site.
- [ ] CI passes on the initial commit.
- [ ] Full directory structure is scaffolded (empty stubs are fine).

Report Phase 0 summary before continuing.

---

## Phase 1 — Design foundation

**Objective**: All Design System tokens are wired up in code. A test page renders every token so the human can visually confirm nothing is broken before components are built on top.

**Prerequisites**: Phase 0 complete.

### Step 1.1 — Base stylesheet with tokens

Copy the base stylesheet from Design System §4 verbatim into `src/styles/base.css`. Include:
- Every CSS custom property from Design System §3.1–3.8.
- Reset + font-family assignments.
- `:focus-visible` rules.
- `prefers-reduced-motion` global rule.
- `prefers-reduced-transparency` handling for `.glass` classes (Design System §10.5).

Import the stylesheet in `src/layouts/BaseLayout.astro`.

Commit: `phase-1.1: add base stylesheet with all design tokens`

### Step 1.2 — Tailwind v4 theme

There is no config file. Steps 1.1 and 1.2 are the same file: the `@theme`, `@utility`, and base blocks of `src/styles/base.css`, copied from Design System §4.2 verbatim.

Confirm every namespace is wiped with `--namespace-*: initial` before its tokens are declared. Miss one and Tailwind's full default scale leaks back in — the whole default colour palette, the dynamic spacing scale, `2xl` breakpoints — silently, with no error. Spot-check by trying to build a page using `bg-red-500`, `p-5`, and `2xl:block`: all three must fail to produce any CSS.

Verify: `pnpm build` passes, and `dist/` contains **zero** matches for `linear-gradient`, `radial-gradient`, `conic-gradient`. This is your first lint against the design.

Commit: `phase-1.2: tailwind v4 theme with wiped default namespaces`

### Step 1.3 — Fonts

Import the Inter and JetBrains Mono variable fonts. Configure font-display: swap. Verify at build time that the WOFF2 files include Latin Extended (contains `š`, `đ`, `č`, `ć`, `ž`).

Add a build-time check script `scripts/verify-fonts.mjs` that fails the build if any of those five glyphs are missing from either font's WOFF2. Wire this into CI.

Commit: `phase-1.3: self-host inter and jetbrains mono with latin extended`

### Step 1.4 — Token showcase page

Create `src/pages/tokens.astro`. Render:
- Every color token as a swatch with its variable name and hex value.
- Every type-scale token as a sample line with size, line-height, and weight labeled.
- Every spacing token as a labeled horizontal bar.
- Every radius token as a small filled square.
- Every shadow token as a labeled floating panel.
- The `glass` and `glass-strong` recipes rendered over a sample backdrop shape.
- Focus ring rendered on a sample button (Tab into it to verify).

This page is the visual truth of your token system. Do NOT skip it — every subsequent phase will reference it to verify components against the tokens they claim to use.

**Naming correction (v1.3).** The original plan said `_tokens.astro`, reasoning that Astro's underscore prefix keeps it out of the production build. That is true and it is exactly the problem: an underscore-prefixed page is excluded from routing entirely, so it never reaches the deploy preview either, and the human approval gate below could not happen. Verified by building `src/pages/_probe.astro`, which produces no route.

The dev-only pages (`tokens`, and `components` in Phase 3) are therefore ordinary routes, kept out of sight by three means instead:
- `noindex, nofollow` via the `BaseLayout` `noindex` prop
- excluded from the sitemap by a `filter` in the `@astrojs/sitemap` config
- listed for deletion in the Phase 10.3 launch checklist

They must not be linked from any shipping page.

**Content rule exemption.** These two pages are development instruments, not product surfaces: their strings are hardcoded English and deliberately bypass the i18n dictionary (plan §0.3 rule 2). They are deleted before launch, so they never ship an untranslated string. No other page gets this exemption.

Commit: `phase-1.4: add token showcase page for visual verification`

**[HUMAN]** — after this commit is deployed to the preview URL, ask the human to visit `<preview>.vercel.app/tokens` and confirm the palette + typography feel right before you start building components on top. This is the last easy moment to pivot on the accent color.

### Phase 1 verification

- [ ] `tokens` page renders every token correctly on the deploy preview.
- [ ] Zero gradient strings in the built CSS.
- [ ] Font subset check passes (Latin Extended glyphs present).
- [ ] Focus ring visible on Tab.
- [ ] Reduced-motion and reduced-transparency preferences visibly change behavior.
- [ ] Human has approved the visual foundation.

---

## Phase 2 — Content model + i18n scaffolding

**Objective**: Every content file that later phases will consume exists in its final schema, populated with **fixture content** — realistic placeholder data structured exactly like the real content will be. The i18n system is fully wired so components built in Phase 3 can reference translation keys from day one.

**Prerequisites**: Phase 1 complete.

### Step 2.1 — Define content collection schemas

**Path and API correction (v1.4).** The plan said `src/content/config.ts`. Astro 7 resolves the content config at **`src/content.config.ts`** — verified against `astro/dist/content/utils.js`, which searches only for `src/content.config.{ts,js,mjs}`. The old folder-based path is gone, along with the implicit "a directory under `src/content/` is a collection" behaviour. Collections are now declared explicitly with a **loader** (`glob()` or `file()` from `astro/loaders`).

One shape change follows from this: the skills collection is one entry **per category** rather than a single document containing a `categories` array, because `file()` maps an array to entries. The data is identical; only the container differs.

In `src/content.config.ts`, define Astro Content Collection schemas for:
- `case-studies` (MDX): frontmatter with `slug`, `order`, `title_en`, `title_sr`, `outcome_en`, `outcome_sr`, `metrics` (array of `{value, label_en, label_sr}`), `stack` (array of strings), `hero_image` (image path), `published` (boolean). Body content is MDX with both `<div lang="en">…</div>` and `<div lang="sr">…</div>` blocks — this is how case-study body copy handles bilingual content since the in-place toggle needs both languages rendered and swapped via CSS/JS.
- `roles` (JSON): `id`, `company`, `role_en`, `role_sr`, `dates` (`start`, `end` or null for current), `location`, `bullets_en` (array), `bullets_sr` (array), `stack` (array), `case_study_slug` (optional).
- `skills` (JSON): `categories` (array of `{name_en, name_sr, skills: [{name, timeline_matches: [role_id, ...]}]}`).
- `testimonials` (JSON): `quote_en`, `quote_sr`, `author`, `role_en`, `role_sr`, `company`, `avatar` (image path), `linkedin_url` (optional), `published` (boolean).

Add Zod validation for each schema. Fail the build if a required field is missing.

Commit: `phase-2.1: define content collection schemas with validation`

### Step 2.2 — Populate fixture content

Create realistic fixture files following the schemas:
- **3 case studies** (`case-studies/fixture-1.mdx`, `fixture-2.mdx`, `fixture-3.mdx`) — even though launch might ship with only 1 (per App Flow §4.3), building against 3 fixtures now lets you develop and verify all three card-count layouts. The `published` flag on each will be flipped by the human when real content lands.
- **4 roles** in `roles/` with varied dates, stacks, and bullets. Include one with `case_study_slug` pointing to a fixture case study, one without.
- **1 skills file** in `skills/skills.json` with 5 categories, ~20 skills, `timeline_matches` populated to exercise the filter interaction.
- **0 testimonials.** Create `testimonials/README.md` explaining that this collection is intentionally empty at launch (App Flow §4.4).

Fixture content should be recognizably fake ("Acme Corp", "Widget Refactor", metric numbers like "42%") so nobody mistakes it for real. Do NOT write plausible-looking real-sounding fake content — that risks going live accidentally.

Commit: `phase-2.2: populate fixture content across all collections`

### Step 2.3 — i18n dictionaries

Create `src/content/i18n/en.json` and `src/content/i18n/sr.json` with parallel structure. Include every UI string the app will need — do a first pass covering:
- All button labels (Book a chat, Download resume, Send message, Contact, Book, Sending…, etc.)
- All form labels, placeholders, helper text, and error messages
- All section eyebrows (`--experience`, `--case-studies`, `--skills`, `--contact` and Serbian equivalents `--iskustvo`, `--studije-slucaja`, `--vestine`, `--kontakt`)
- Section headings and subheads
- Toast messages
- 404 page copy
- Header/footer chrome
- Availability badge text
- Filter pill format string
- Any `aria-label` values

Use a flat nested-key convention: `hero.name`, `hero.subtitle`, `hero.cta.primary`, `contact.form.label.email`, `contact.form.error.email.invalid`, etc.

Write English first, then Serbian. Serbian must be translated for meaning — never machine-translated word-for-word. If any string is unclear, mark it `TODO(human): confirm SR translation` and continue.

Commit: `phase-2.3: seed i18n dictionaries with all initial ui strings`

### Step 2.4 — i18n runtime

Implement `src/lib/i18n.ts`:
- `getDictionary(lang)` — returns the parsed dictionary for a language.
- `t(key, lang)` — server-side translation lookup (used inside `.astro` components at build time — renders the English version by default into the initial HTML).
- A React context + hook `useI18n()` — for React islands to read the current language and translate strings.
- A tiny client-side store (plain module-scope `let` + `subscribe` callback pattern — no need for a state library) that:
  - Reads initial language from `localStorage.lang` (falls back to `en`).
  - On language change: updates the store, updates `document.documentElement.lang`, updates `localStorage`, notifies subscribers, fires the `lang_switch` analytics event.
- Every React island that renders text subscribes to language changes and re-renders on switch.

**Mechanism decision (v1.5).** The plan described React islands re-rendering on switch, which covers the islands but leaves most of the site unaddressed: the hero, timeline, skill matrix and footer are static `.astro`, and hydrating them purely to swap text would forfeit the performance budget the whole stack choice exists to protect. Three mechanisms are used instead, chosen per case:

| Content | Mechanism | Why |
|---|---|---|
| Static text in `.astro` | Both languages rendered, one shown by CSS on `html[lang]` — the `<T>` component | No JS, no hydration, no flash; identical technique to the MDX bodies in §2.5, so the site has one story rather than two |
| Attributes (`href`, `alt`, `aria-label`, `title`, `placeholder`) | `data-i18n-<attr>-en` / `-sr` pairs, swapped by `applyAttributeTranslations` | CSS cannot reach attributes. This is what moves the resume CTA between `cv.pdf` and `cv-sr.pdf` |
| React islands (form errors, toast) | `useI18n()` subscribing to the store | Strings appear conditionally at runtime, so they cannot be dual-rendered |

The cost is that static text ships twice. It is text, it gzips well, and it buys an instant switch that does not depend on hydration having finished. The `display: contents` rule that drives it is in Design System §4.2.
- A vanilla script `src/scripts/apply-language.js` that runs before first paint via `is:inline` in `<head>` to read `localStorage.lang` and set `document.documentElement.lang` — this prevents the flash of English for returning SR visitors.

Add a build-time script `scripts/verify-i18n-parity.mjs`: fails the build if any key exists in `en.json` but not `sr.json`, or vice versa. Wire into CI.

Commit: `phase-2.4: implement i18n runtime with parity check`

### Step 2.5 — Bilingual body copy strategy for MDX case studies

MDX case study bodies contain long-form prose that also needs to switch. Two viable approaches:

**Chosen approach**: dual-render — the MDX file contains two body blocks tagged with `data-lang="en"` and `data-lang="sr"`; a stylesheet rule shows only the block matching `html[lang]`.
The rule itself lives in Design System §4.2 and uses `display: contents`, not `display: block`:

```css
[data-lang] { display: none; }
html[lang='en'] [data-lang='en'],
html[lang^='sr'] [data-lang='sr'] { display: contents; }
```

`contents` rather than `block` because the same rule has to serve both the block `<div>` wrapping a case-study body and the inline `<span>` the `<T>` component puts around a button label. With `block`, every inline swapped string would become a block and break the line it sits in.
This means both languages ship in the HTML (~2x page weight for case studies) but the switch is instant and CSS-only. Given case studies are the highest-value pages and file size is dominated by images, the trade is worth it.

**Not chosen**: separate MDX files per language. Would require URL-based routing (which we rejected in PRD FR-6) or JS-driven MDX swapping (complex).

Enforce a build-time check: every MDX case study must contain both `data-lang="en"` and `data-lang="sr"` root blocks, non-empty. Fail the build otherwise.

Commit: `phase-2.5: bilingual mdx strategy with build-time enforcement`

### Phase 2 verification

- [ ] Content collections type-check via `pnpm astro check`.
- [ ] Fixture content loads: log every collection at build time as a sanity check, then remove the log.
- [ ] `verify-i18n-parity.mjs` passes.
- [ ] `apply-language.js` correctly sets `document.documentElement.lang` before first paint (test by manually setting `localStorage.lang = 'sr'` in the browser and reloading — no EN flash).
- [ ] Every MDX case study has both language blocks (build-time check passes).

---

## Phase 3 — Component library

**Objective**: Every component from Design System §7 is built in isolation, verifiable in a component showcase page, before any real page assembly.

**Prerequisites**: Phases 0–2 complete.

### 3.0 — General component build rules
- Build every component using ONLY tokens from Phase 1 and translation keys from Phase 2. No hardcoded values.
- **Component dimensions use arbitrary values; spacing uses the scale.** The Design System specifies control heights in px (44px button, 36px ghost, 32px icon button, 24px tag) and §3.3 declares eleven spacing steps that do not include them. Write those as `h-[44px]`. Do **not** reach for the nearest numeric utility: `--spacing: initial` deletes v4's dynamic scale, so `h-9` and `p-5` emit **no rule at all** — no error, no warning, green build, and the element silently has no height. Verified in `dist/`: `h-9` produces nothing, `h-[36px]` produces `height:36px`. `scripts/verify-no-raw-values.mjs` fails the build on both an undeclared spacing step and a px literal the Design System does not name.
- For each component: build the component file, then add it to `src/pages/components.astro` (a dev-only showcase page mirroring `tokens`) with every state rendered side-by-side. Same treatment as the tokens page: `noindex`, excluded from the sitemap, unlinked, and deleted at launch.
- **Never pass a display utility to a component through its `class` prop.** `<Button class="hidden md:inline-flex">` does not hide the button: the recipe already sets `inline-flex`, `hidden` sets the same CSS property, and which one wins is decided by their order in Tailwind's generated stylesheet rather than by the class attribute. Found in 3.17, where both header CTAs rendered at 320px. Put visibility on a wrapper instead — `<span class="hidden md:contents">` — so the two utilities are never on the same element.
- Verify each component visually on the deploy preview before moving to the next, at 320px as well as desktop. 320px is where a component that cannot shrink shows up, and §9.1's ~35% longer Serbian strings make it the real test.
- Static `.astro` components by default. React island only when interactivity is needed (marked below).

### Step 3.1 — Section eyebrow + section heading (§7.15, §6.3)
Build together — they always appear together. `.astro` component. Takes props: `eyebrowKey` (i18n key like `sections.experience.eyebrow`), `titleKey`, `subtitleKey` (optional). Renders per Design System §7.15.

Add to `components` page with 4 examples covering both languages.

Commit: `phase-3.1: SectionHeading and SectionEyebrow`

### Step 3.2 — Buttons (§7.1–7.4)
Build `Button.astro` accepting props: `variant` (`primary` | `secondary` | `ghost` | `icon`), `size` (`default` | `small` for headers), `href` (renders as `<a>` if present, else `<button>`), `icon` (Lucide name for trailing icon), `iconPosition`, `disabled`, `loadingKey` (i18n key for loading label, only used inside forms — see 3.15).

Render every state of every variant on `components`. Tab through them — every one must show the focus ring correctly.

Commit: `phase-3.2: Button component with all variants and states`

### Step 3.3 — Links (§7.5)
`Link.astro`: three variants (`inline`, `standalone`, `external`). External sets `target="_blank" rel="noopener"` and uses `arrow-up-right` icon; standalone uses `arrow-right`; inline is plain underline.

Commit: `phase-3.3: Link component with three variants`

### Step 3.4 — Tags (§7.12)
`Tag.astro`: props `interactive` (bool), `active` (bool), `matches` (bool — for skills: false means non-interactive/no timeline matches). Non-interactive renders as `<span>`; interactive renders as `<button>`.

Filter interaction wiring comes in Phase 5. In Phase 3, just render the visual states.

Commit: `phase-3.4: Tag component`

### Step 3.5 — Availability badge (§7.13)
`AvailabilityBadge.astro`. Reads content from i18n dictionary key `hero.availability.text`. Renders only if `hero.availability.enabled` in the dictionary is `true`. Pulse animation only if reduced-motion is off.

Commit: `phase-3.5: AvailabilityBadge`

### Step 3.6 — Metric callout (§6.4)
`MetricCallout.astro`: props `value` (string, e.g. "-58%"), `labelKey` (i18n key). Tabular-nums, accent color, sizing per §6.4.

Commit: `phase-3.6: MetricCallout`

### Step 3.7 — Timeline entry (§7.14)
`TimelineEntry.astro`: takes a `role` object matching the Phase 2 schema. Renders per §7.14 including stack tags, optional case-study link, and the filtered/unfiltered visual states (opacity 0.35 for non-match).

Filter state is driven by a CSS class `data-filtered-out` — the actual filter logic that adds/removes this class comes in Phase 5. For now, allow toggling via a prop on `components` to visually verify both states.

Commit: `phase-3.7: TimelineEntry with filtered states`

### Step 3.8 — Case study card (§7.10)
`CaseStudyCard.astro`: takes a case study entry. Supports three layout variants via a prop `layout`: `grid` (default 3-up), `pair` (2-up), `spotlight` (1-up horizontal on desktop). Uses the `glass` recipe. Whole card is one link.

Render all three layouts on `components` using fixture case studies.

Commit: `phase-3.8: CaseStudyCard with grid/pair/spotlight layouts`

### Step 3.9 — Testimonial card (§7.11)
`TestimonialCard.astro`. Non-glass, per spec. Renders even if no testimonials exist (fed a fixture at the showcase page). This component will not appear in launch pages but must exist for post-launch enablement to be a config change.

Commit: `phase-3.9: TestimonialCard`

### Step 3.10 — Form primitives (§7.7–7.9) — React island
`TextInput.jsx`, `Textarea.jsx`, `FormField.jsx` — React because they'll be composed into a stateful form in 3.15. Each handles its states per §7.7–7.9.

Commit: `phase-3.10: form primitives as react island components`

### Step 3.11 — Toast (§7.6) — React island
`Toast.jsx` — controlled by a tiny toast store (module-scope subject pattern; no library). Exposes `showToast({ messageKey, linkKey?, linkHref? })`. Auto-dismiss 3s, timer pauses on hover/focus, Esc dismisses, never stacks.

Add a Toast trigger button on `components` to manually verify entry/exit, reduced-motion, and stacking behavior.

Commit: `phase-3.11: Toast with store`

### Step 3.12 — Language toggle (§7.16) — React island
`LanguageToggle.jsx` — subscribes to the i18n store from Phase 2.4. Renders both labels always visible. On click: calls the store's `setLanguage`, which handles localStorage, `document.documentElement.lang`, and event dispatch.

Verify: clicking the toggle on `components` swaps every localized string on the page without reload, scroll position preserved, `<html lang>` updated in devtools.

Commit: `phase-3.12: LanguageToggle wired to i18n store`

### Step 3.13 — Sticky FAB (§7.17) — React island
`StickyFAB.jsx` — uses IntersectionObserver on `#hero` and `#contact` elements. Hides while either is in view. Hides while any `input`, `textarea`, or `[contenteditable]` is focused (mobile keyboard collision — subscribe to `focusin`/`focusout`).

For `components`, place fake `#hero` and `#contact` divs to test the observer behavior.

Commit: `phase-3.13: StickyFAB with intersection and focus handling`

### Step 3.14 — Filter pill (§7.21) — React island
`FilterPill.jsx` — appears when a skill filter is active, per App Flow §4.5. Sticky within the `#work` section. Close button clears the filter (wiring in Phase 5). For now, drive from a prop on `components`.

Commit: `phase-3.14: FilterPill`

### Step 3.15 — Contact form (§7.9 composition) — React island
`ContactForm.jsx` — composes TextInput + Textarea + Button. Validates only on submit (App Flow decision #15). All states per App Flow §4.7: default, submitting (button label swaps to translated "Sending…"), success (form replaces with confirmation block), endpoint failure (error block above button with mailto fallback).

Form submission target is stubbed for now — actual endpoint wiring in Phase 6. Simulate success/failure via a dev-only query param (`?form=success`, `?form=error`).

Commit: `phase-3.15: ContactForm with all states, stubbed submission`

### Step 3.16 — Calendly loading placeholder (§7.23) — React island
`CalendlyEmbed.jsx` — for now, renders only the loading placeholder and the failure state (via dev query param `?calendly=fail`). Real Calendly script integration in Phase 6.

Commit: `phase-3.16: CalendlyEmbed placeholder and failure states`

### Step 3.17 — Header variants (§7.18–7.19)
`HeaderHome.astro` (variant A) and `HeaderCaseStudy.astro` (variant B). Both apply the glass recipe. Home header uses anchor nav with scrollspy (wiring in Phase 5); Case-study header uses back-link and direct-Calendly CTA (opens in new tab).

Commit: `phase-3.17: Header variants A and B`

### Step 3.18 — Footer (§7.20)
`Footer.astro`. `bg-elevated`, not glass. Language toggle in the last column reuses the LanguageToggle component from 3.12.

Commit: `phase-3.18: Footer`

### Step 3.19 — Skip-to-content (§7.24)
`SkipToContent.astro`. First tab stop on every page. Links to `#main-content`.

Commit: `phase-3.19: SkipToContent`

### Step 3.20 — Backdrop shapes (§6.2)
`BackdropShapes.astro` — 3–5 absolutely-positioned blurred solid-color ellipses. Configurable via props (positions, sizes). Include a `variant` prop for mobile (2 shapes, less blur).

Commit: `phase-3.20: BackdropShapes`

### Phase 3 verification

- [ ] Every component listed above renders on `components` in every state.
- [ ] Zero raw hex or px in component code (grep for `#[0-9a-fA-F]{3,6}` and `\d+px` — every match must be either in a token file or in a rare justified place, none in component code).
- [ ] Language toggle on `components` swaps every rendered string.
- [ ] Focus ring visible on Tab through every interactive element.
- [ ] Toast interactions (hover-pause, Esc-dismiss, no-stack) verified.
- [ ] All React islands successfully hydrate in the preview deploy.

Report Phase 3 summary. **[HUMAN]** — invite the human to visit `<preview>.vercel.app/components` and give a visual pass before Phase 4 page assembly.

---

## Phase 4 — Page assembly

**Objective**: All three screen types from App Flow §1 are assembled from Phase 3 components, using Phase 2 fixture content, and are navigable.

**Prerequisites**: Phase 3 complete and human-approved.

### Step 4.1 — BaseLayout
`src/layouts/BaseLayout.astro`. `<html lang="en">` (updated at runtime by the i18n script). `<head>` includes the inline `apply-language.js` script (Phase 2.4) BEFORE any stylesheet — this is critical to prevent SR flash. Includes base stylesheet, fonts, viewport meta, charset, sensible default meta description and title (per-page metadata handled in Phase 7).

Structure: `<body>` contains `<SkipToContent />`, then `<slot name="header" />`, `<main id="main-content">`, `<slot name="footer" />`, `<slot name="fab" />`, and a global `<Toast />` mount point.

Commit: `phase-4.1: BaseLayout with skip link, main, slots, toast mount`

### Step 4.2 — HomeLayout and CaseStudyLayout
`HomeLayout.astro` extends BaseLayout, fills the `header` slot with `HeaderHome`, includes `BackdropShapes` positioned for the home page, and adds `StickyFAB` to the fab slot.

`CaseStudyLayout.astro` extends BaseLayout, fills `header` with `HeaderCaseStudy`. No FAB. No backdrop shapes (case study body is text-dense; distraction-free).

Commit: `phase-4.2: HomeLayout and CaseStudyLayout`

### Step 4.3 — Home page (S1) — hero, proof strip, timeline, case studies

Assemble `src/pages/index.astro` using `HomeLayout`. Build sections in order:

**Hero**: name (from i18n `hero.name`), title line, value prop, availability badge (if enabled), CTAs. Primary CTA `href={cvPath}` where `cvPath` is `/cv.pdf` or `/cv-sr.pdf` based on language — set client-side via the i18n store subscription so the href updates on toggle. On click, fires the toast.

**Proof strip**: sits directly below hero. Static logos in `public/logos/` (fixture logos for now — human replaces in Phase 9). If the `logos.enabled` i18n flag is false, section is omitted entirely per App Flow §6.

**Timeline** (`#work`): SectionHeading + iterate over sorted roles collection, render each with TimelineEntry.

**Case studies** (`#case-studies`): SectionHeading + iterate over published case studies. Choose layout: 1 → spotlight, 2 → pair, 3 → grid. If 0 published, do not render the section (matches App Flow §4.3).

Commit: `phase-4.3: Home page hero through case studies`

### Step 4.4 — Home page — skill matrix, contact section

**Skill matrix** (`#skills`): SectionHeading + render each category as a group. Each skill is a Tag; skills with empty `timeline_matches` render as non-interactive (per App Flow §4.6).

**Contact** (`#contact`): SectionHeading + one-line invitation + ContactForm + CalendlyEmbed + mailto line. All wrapped in a `glass` container.

Commit: `phase-4.4: skill matrix and contact section`

### Step 4.5 — Case study page (S2)

`src/pages/work/[slug].astro`. Uses `CaseStudyLayout`. Renders:
- Section eyebrow with the case study's title-slug as an id
- H1 case study title + one-line outcome
- Body from MDX (both language blocks, CSS-controlled visibility per Phase 2.5)
- Outcome block with MetricCallouts (from frontmatter `metrics` array)
- Stack list as Tags
- Bottom CTA: direct Calendly link, external style, new tab (per App Flow §4.9)
- Prev/next footer — only rendered if more than one case study is published (per App Flow §4.9). Order by frontmatter `order` field.

Use `getStaticPaths` to prerender every published case study. Unpublished case studies do not generate routes (a request would 404 → S3).

Commit: `phase-4.5: case study page with prev/next`

### Step 4.6 — 404 page (S3)

`src/pages/404.astro`. Uses `BaseLayout` directly with `HeaderCaseStudy` in the header slot but with the "Back to work" center link omitted (per Design System §7.22). Layout per §7.22: eyebrow, H1, subtext, three CTAs (home, resume, contact).

Verify: `pnpm build` outputs `dist/404.html`. Vercel serves this on any unknown path.

Commit: `phase-4.6: 404 page`

### Step 4.7 — Section spacing + rhythm audit

Walk the deployed preview and verify vertical spacing between sections matches Design System §3.3 exactly. Fix any deviations.

Commit: `phase-4.7: section rhythm audit and fixes`

### Phase 4 verification

- [ ] `/` renders all sections with fixture content in both layouts (fixture case study count = 3).
- [ ] `/work/fixture-1`, `/work/fixture-2`, `/work/fixture-3` render.
- [ ] Any random `/work/does-not-exist` returns 404 with the mini-pitch layout.
- [ ] All three case-study card layouts can be visually verified by publishing/unpublishing fixtures.
- [ ] Language toggle now swaps content across the entire home page and case study pages.
- [ ] No hardcoded strings anywhere (grep `.astro`/`.jsx` files for suspicious quoted English).

---

## Phase 5 — Interactive systems

**Objective**: Every interactive behavior specified in App Flow works: smooth scrolling with scrollspy, skill filtering, sticky FAB visibility, toast on resume download, language persistence.

**Prerequisites**: Phase 4 complete.

### Step 5.1 — Smooth scrolling + scrollspy

Implement a small React island `ScrollNav.jsx` mounted inside `HeaderHome`. Uses IntersectionObserver on `#work`, `#skills`, `#contact` sections. Updates the active anchor with a matching class. Above `#work`, none active.

Smooth-scroll handler on anchor clicks: JS-driven (not CSS `scroll-behavior: smooth`), checks `prefers-reduced-motion`, applies `scroll-margin-top` correctly (already set on sections in Phase 4.7).

Hash updates via `history.replaceState` (per App Flow §7.4). Back button exits site — verify.

Focus management: anchor click moves focus to the target section's H2 (`tabindex="-1"` on all section headings).

Commit: `phase-5.1: smooth scrolling with scrollspy and focus management`

### Step 5.2 — Skill filter

Implement `SkillFilter.jsx` or a Zustand-free state module that connects the skill matrix Tags and the TimelineEntry components. Single-select. Clicking a skill:
1. Sets the filter state to that skill.
2. Applies `data-filtered-out` to non-matching TimelineEntry roots via a small script that queries by role id.
3. Renders FilterPill via a mount point at the top of `#work`.
4. Scrolls the top of `#work` into view if it's off-screen.

Clearing (FilterPill close button, Esc while focus in `#work`, or clicking the active skill again) reverses everything.

Non-interactive skills (empty `timeline_matches`) are not focusable and do not respond to clicks.

Commit: `phase-5.2: skill filter with pill and clear paths`

### Step 5.3 — Resume download toast

The hero primary CTA and 404 resume CTA fire the toast on click. Toast content from i18n key `toast.resume_download`, with an inline link to `#contact` from key `toast.resume_download.link`.

The toast link, when clicked, dismisses the toast and smooth-scrolls to `#contact`.

Commit: `phase-5.3: resume download toast wired to CTAs`

### Step 5.4 — Language persistence + no-flash verification

Verify end-to-end:
1. First visit: `<html lang>` is `en`, dictionary is EN.
2. Toggle to SR: everything swaps in place, `<html lang>` becomes `sr-Latn`, `localStorage.lang` = `sr-Latn`.
3. Reload the page: apply-language.js runs before first paint, `<html lang>` is already `sr-Latn`, SR renders immediately.
4. Navigate to a case study: same, no flash.
5. Return next session: SR still active.
6. Clear localStorage: back to EN.

Any flash of EN when returning as SR user = failure. Debug the inline script's placement in `<head>` if this happens.

Commit: `phase-5.4: verify language persistence and no-flash`

### Phase 5 verification

- [ ] Anchor navigation smoothly scrolls (or jumps under reduced-motion).
- [ ] Scrollspy correctly highlights the current section.
- [ ] Skill click filters timeline, pill appears, Esc/close clears.
- [ ] Non-matching skills are non-interactive.
- [ ] Resume download shows the toast.
- [ ] Toast link scrolls to contact and dismisses toast.
- [ ] Language toggle persists across pages and sessions with no EN flash.
- [ ] All above verified in both languages.

---

## Phase 6 — External integrations

**Objective**: Real form submissions, real Calendly, real analytics events flow.

**Prerequisites**: Phase 5 complete. Human has provided credentials for form service, Calendly, and analytics.

### Step 6.1 — Form service **[HUMAN]**

Ask the human to pick and provision one of:
- **Web3Forms** (free, no account, just an API key emailed on signup)
- **Formspree** (free tier, requires account)
- Self-hosted serverless function (only if the human explicitly wants this — more complex)

Recommendation: Web3Forms — lowest friction, no account overhead, sends form data directly to the human's email.

Once provisioned, add the endpoint + access key to `.env.local` (local) and to Vercel's environment variables (production). Names: `PUBLIC_FORM_ENDPOINT` (URL) and `PUBLIC_FORM_KEY` (access key). `PUBLIC_` prefix is required by Astro for client-side access.

Update `ContactForm.jsx` to POST to `PUBLIC_FORM_ENDPOINT` with fields (`name`, `email`, `company`, `message`, `_key: PUBLIC_FORM_KEY`, `_honeypot: <hidden field value>`, `_time: <ms since form mount>`). Reject client-side if `_honeypot` is filled or `_time < 3000ms` (bot heuristics per PRD FR-5).

Handle success and error paths per App Flow §4.7. Wire the `mailto:` fallback in the error path to use the human's email address (from an i18n key `contact.email`).

Commit: `phase-6.1: contact form wired to real endpoint with spam heuristics`

### Step 6.2 — Calendly **[HUMAN]**

Ask the human to:
1. Create a Calendly (or Cal.com) account.
2. Create a single event type: 15-minute intro call.
3. Share the public URL (e.g., `https://calendly.com/human/intro`).

Add `PUBLIC_CALENDLY_URL` to env vars.

Update `CalendlyEmbed.jsx`:
- Lazy-load the Calendly widget script only when the embed's IntersectionObserver fires (or on user interaction with the embed area).
- Render the widget with the human's URL.
- After 4s without the widget rendering, swap to the failure state (existing UI from Phase 3.16).
- All Calendly widget config uses lang-neutral options; if Calendly supports a locale hint that matches the current site language, apply it.

Also add a direct-link CTA in the case-study header (Design System §7.19) and case-study bottom CTA using this URL, new tab.

Commit: `phase-6.2: calendly integration with lazy load and failure fallback`

### Step 6.3 — Analytics **[HUMAN]**

Ask the human to pick one:
- **Plausible** (paid, or self-hosted; simplest)
- **Fathom** (paid)
- **Umami** (free cloud tier or self-hosted; open source)

Recommendation: Umami cloud — free, cookieless, straightforward.

Add the tracking script (or SDK) per the provider's docs. Add `PUBLIC_ANALYTICS_SITE_ID` (or similar) to env vars.

Implement `src/lib/analytics.ts` with a single `trackEvent(name, props?)` function that maps to the provider's API. If the provider isn't configured (missing env var), the function no-ops silently — never let analytics failures break the app (PRD FR-7 edge case).

Wire events per PRD FR-7 and App Flow §5:
- `cta_hero_resume`, `cta_hero_book` — on hero button clicks
- `resume_download` — on any resume download (with `lang` prop)
- `form_submit_success`, `form_submit_error` — in ContactForm
- `calendly_open` — when the CalendlyEmbed opens the fallback link, OR when the direct-link CTAs on case studies are clicked
- `calendly_booked` — via Calendly's own webhook if supported, else via URL parameter on a redirect back to the site
- `lang_switch` — in the i18n store
- `case_study_open` — on CaseStudyCard click, and on `/work/[slug]` page view
- Scroll-depth events: fire at 25/50/75/100% via a small IntersectionObserver on hidden markers throughout the page
- Outbound clicks — GitHub, LinkedIn from footer, external links in case studies

Ensure no PII is sent — analytics receives event names and non-personal props only.

Commit: `phase-6.3: analytics with all event instrumentation`

### Phase 6 verification

- [ ] Real form submission arrives in the human's inbox.
- [ ] Form failure state visible (temporarily point to bad endpoint to test, then revert).
- [ ] Calendly embed loads and allows booking.
- [ ] Calendly failure fallback visible (temporarily block the Calendly script in devtools to test).
- [ ] Every event listed above shows up in the analytics dashboard.
- [ ] Environment variables set in Vercel production.

---

## Phase 7 — SEO and metadata

**Objective**: Every page has correct title, description, canonical, OG/Twitter tags, structured data, and appears in the sitemap.

**Prerequisites**: Phase 6 complete. Custom domain decided (not necessarily purchased yet — decide the string).

### Step 7.1 — Base metadata layer

Extend `BaseLayout.astro` to accept metadata props: `title`, `description`, `canonicalPath`, `ogImagePath`, `structuredData` (optional JSON-LD object).

Set defaults from i18n `meta.default.*` keys. Site-wide OG defaults: use a designed 1200×630 PNG at `public/og-default.png` (placeholder for now — commission or self-create in Phase 8).

Per PRD §5.3: metadata language is English only (indexed language per the single-URL i18n choice). Do NOT emit `hreflang` — there is no SR URL to point to.

Commit: `phase-7.1: base metadata layer with defaults`

### Step 7.2 — Per-page metadata

Set unique title + description on:
- Home (`/`): `<Name> — Frontend Engineer` / value-prop-based description
- Each case study (`/work/[slug]`): case study title + one-line outcome
- 404: friendly title + short description

All titles under 60 chars, descriptions under 155.

Commit: `phase-7.2: per-page titles and descriptions`

### Step 7.3 — Structured data

Add `Person` JSON-LD to home page: name, jobTitle, url, sameAs array (GitHub, LinkedIn URLs from i18n).

Add `Article`-style JSON-LD to each case study: headline, author (self), datePublished (from frontmatter or file mtime), articleBody excerpt.

Validate with Google's Rich Results Test before Phase 10 launch.

Commit: `phase-7.3: structured data on home and case studies`

### Step 7.4 — Sitemap and robots

`@astrojs/sitemap` was installed in Phase 0.2 — configure it in `astro.config.mjs` now with the production `site` URL (still a placeholder — final URL set in Phase 10).

Create `public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: <SITE_URL>/sitemap-index.xml
```

Commit: `phase-7.4: sitemap and robots.txt`

### Step 7.5 — Update site URL

Once the human confirms the final domain (Phase 10 prep), find/replace the placeholder in `astro.config.mjs` and `robots.txt`.

Commit: `phase-7.5: set production site url` (deferred if domain not yet chosen)

### Phase 7 verification

- [ ] Every page has unique title + description under limits.
- [ ] `/sitemap-index.xml` builds and lists home + every published case study + 404? (Astro sitemap plugin excludes 404 automatically — verify.)
- [ ] OG images unfurl correctly (test with a link-preview debugger like opengraph.xyz).
- [ ] Structured data validates (Google Rich Results Test).
- [ ] `robots.txt` present and correct.

---

## Phase 8 — Quality gates (performance, accessibility, cross-browser, device)

**Objective**: All Design System §11 automated and manual checks pass. Site meets every non-functional requirement in PRD §5.

**Prerequisites**: Phase 7 complete.

### Step 8.1 — Lighthouse CI

Add `@lhci/cli` as a dev dependency. Configure `lighthouserc.mjs` with assertions:
- Performance ≥ 95 (mobile, throttled)
- Accessibility = 100
- Best Practices ≥ 95
- SEO ≥ 95
- LCP ≤ 1.8s, CLS ≤ 0.05, INP ≤ 200ms

Test URLs: `/`, `/work/fixture-1`, `/404`. Run in both languages (add `?lang=sr` query param handling to force SR at load for LH runs).

Add LH CI as a GitHub Actions job. Failure blocks merge.

**The `Accessibility = 100` assertion is the project's only automated WCAG gate** (see Changelog v1.1). Lighthouse runs axe internally, so this catches contrast, labels, landmarks, and ARIA misuse. It does **not** cover: the SR language state, the form error state, the filtered-timeline state, or keyboard operability. Those are manual, in Steps 8.4–8.7. Do not treat a green Lighthouse run as full a11y coverage.

Commit: `phase-8.1: lighthouse ci with hard performance and a11y assertions`

### Step 8.2 — Unit tests for `src/lib/` (Vitest)

Add `vitest` as a dev dependency. Test **only pure logic in `src/lib/`** — no components, no DOM, no browser. Scope:

- `i18n.ts` — dictionary lookup by key, missing-key behavior (dev warning, never a raw key rendered), language store set/subscribe/notify, `localStorage` read with the storage-blocked path stubbed.
- `analytics.ts` — `trackEvent` no-ops silently when the provider env var is absent (PRD FR-7 edge case); event name and props pass through correctly when it is present; no PII in the payload.
- Contact-form spam heuristics — honeypot filled → reject; `_time < 3000ms` → reject; valid submission → pass.
- Any date/number formatting helper — correct output for `en-US` and `sr-Latn-RS`.

Target is ~4–6 small test files. Do not add component or integration tests; there is no browser test runner in this project.

Add as a CI job (`pnpm test`).

Commit: `phase-8.2: unit tests for i18n, analytics, and spam heuristics`

### Step 8.3 — Regex lints for design rules

Add pre-commit hook (via `simple-git-hooks` or Husky) and a CI job running:
- **No hardcoded hex** outside token files: `grep -rE '#[0-9a-fA-F]{3,6}' src/components src/layouts src/pages` must be empty.
- **No hardcoded px in components**: `grep -rE '\b\d+px\b' src/components src/layouts src/pages` must be empty.
- **No gradients anywhere** — two spellings, both must be empty (Design System §4.4):
  - raw functions: `grep -rE 'linear-gradient|radial-gradient|conic-gradient' src` and over `dist/**.css`
  - v4 utility classes: `grep -rE '\bbg-(linear|radial|conic)' src`
  In v4 there is no `corePlugins` to disable these with, so this lint is the *only* thing enforcing Prohibition #1.
- **No `outline: none` without `:focus-visible`**: manual review of any matches.

Commit: `phase-8.3: regex lints enforcing design rules`

### Step 8.4 — Manual journey walkthrough

There is no automated e2e in this project (Changelog v1.1). These five journeys are walked by hand on the deploy preview, in **both languages**, and the results recorded in the phase summary.

Write the checklist to `docs/manual-qa-checklist.md` so it is repeatable before every future launch, then walk it:

- **Journey 1 (recruiter)**: home → click "Download resume" → PDF downloads, toast appears, toast auto-dismisses at 3s, toast link scrolls to `#contact`.
- **Journey 2 (hiring manager)**: home → scroll (scrollspy tracks) → open case study → prev/next present when >1 published, absent when 1 → bottom CTA opens Calendly in a new tab → "Back to work" lands on `/#work` → skill click filters timeline, pill appears, Esc clears.
- **Journey 3 (executive, mobile)**: 375px viewport → scroll past hero → FAB appears → tap → lands at `#contact` → FAB hides while `#contact` in view → focus a form field, FAB hides.
- **Journey 4 (Serbian)**: toggle to SR → every visible string swaps, scroll position held, `<html lang>` is `sr-Latn`, resume CTA points at `cv-sr.pdf` → reload → SR renders with no flash of English → navigate to a case study → still SR.
- **Journey 5 (lost visitor)**: `/does-not-exist` → 404 mini-pitch with three CTAs → each CTA works.

Negative paths, also manual:
- Submit the form with every required field empty → inline errors, focus moves to the first invalid field, `aria-live` summary announced.
- Point `PUBLIC_FORM_ENDPOINT` at a bad URL → error block renders, entered content preserved, mailto fallback visible. Revert.
- Block the Calendly script in devtools → 4s timeout → fallback link renders.

Commit: `phase-8.4: manual qa checklist for all user journeys`

### Step 8.5 — Manual cross-browser check

No automated browser matrix (Changelog v1.1). Open the deploy preview by hand in Chrome, Firefox, and Safari and verify the known risk areas in this design:

- **Firefox** — `backdrop-filter` support varies by version and config. Confirm glass renders, then disable it (`about:config` → `layout.css.backdrop-filter.enabled` = false) and confirm the `@supports not` solid fallback per Design System §10.4.
- **Safari** — `scroll-margin-top` on anchor targets (content must not land under the sticky header), and `-webkit-backdrop-filter` on all seven glass surfaces.
- **All three** — `prefers-reduced-motion` and `prefers-reduced-transparency` at the OS level actually change behavior.

Add findings to `docs/manual-qa-checklist.md`. Fix any failures before advancing.

Commit: `phase-8.5: cross-browser findings and fixes`

### Step 8.6 — Real device check **[HUMAN]**

Automated tests don't catch every real-device issue. Ask the human to:
1. Load the preview on a real low-end Android (or borrow one) — verify glass rendering, FAB behavior, Calendly, form submission.
2. Load on iOS Safari — same.
3. Load in the LinkedIn in-app browser (share the URL to themselves via LinkedIn, open from the app) — this is where Journey 3 actually happens.
4. Report any issues.

Fix reported issues before Phase 9.

### Step 8.7 — Manual screen reader pass **[HUMAN or agent-assisted]**

Ideally the human runs VoiceOver (macOS) or NVDA (Windows). If the human can't, the agent should describe expected screen-reader behavior for each of the five journeys and the human verifies against a recording.

Verify in both languages — `<html lang>` correctness means screen readers should pronounce Serbian correctly with a Serbian voice installed.

### Step 8.8 — OG image

Design a proper 1200×630 PNG for the default OG image. Should include the human's name, "Frontend Engineer" or the value prop, subtle glass panel matching the site aesthetic. Also generate a per-case-study OG image (either automated via Astro's OG image generation, or one manually designed template that pulls the case study title).

Commit: `phase-8.8: proper OG images`

### Phase 8 verification

- [ ] Lighthouse CI passes with all assertions (incl. Accessibility = 100) on all three page types in both languages.
- [ ] Vitest unit tests pass in CI.
- [ ] Regex lints pass.
- [ ] `docs/manual-qa-checklist.md` exists and all five journeys walked in both languages — results in the phase summary.
- [ ] Manual cross-browser check done in Chrome, Firefox, Safari, incl. the backdrop-filter fallback.
- [ ] Real device check completed by human — issues fixed.
- [ ] Screen reader pass completed.
- [ ] OG images look professional and unfurl correctly.

---

## Phase 9 — Content integration

**Objective**: All fixture content is replaced with real content from the human. Nothing on the site is fake.

**Prerequisites**: Phase 8 complete. **[HUMAN]** has written real content.

### Step 9.1 — Solicit real content **[HUMAN]**

Ask the human for:
- **Hero copy** (EN + SR): name, title line, value prop (1–2 sentences), availability text if using
- **Roles** (EN + SR each): all fields per the Phase 2.1 schema. All employment.
- **Case studies** (EN + SR each): 1–3 (whatever's ready). Full body per PRD FR-2 structure.
- **Skills**: final list per category with honest `timeline_matches`.
- **Proof strip logos**: names of employers/clients whose logos can appear + SVG or PNG logos + confirmation of permission.
- **CV PDFs**: `cv.pdf` and `cv-sr.pdf`, professionally set.
- **Contact email**: for the mailto fallback.
- **GitHub URL, LinkedIn URL**.
- **Photo** (optional): if the hero includes a portrait.
- **Testimonials** (optional post-launch, per App Flow §4.4): quotes with named permission + avatars.

If any category is not ready, flag it and continue with the ones that are.

### Step 9.2 — Replace fixture content

For each real content piece, replace the corresponding fixture. Verify:
- Content collection type-check still passes.
- Every page still renders.
- No English-only strings snuck in (grep i18n dictionaries for `TODO`).

Delete fixture files that were removed (not merely emptied — the `published: false` flag doesn't delete; actually remove the files so they don't stay in the repo).

Commit as separate commits per content type (`phase-9.2a: replace hero content`, `phase-9.2b: replace roles`, etc.) so history is clean.

### Step 9.3 — Verify all bilingual pairs

Every translated string must be reviewed. Best done by the human (native SR speaker); otherwise flag every string as `unverified` in a comment.

Run `verify-i18n-parity.mjs`, `verify-fonts.mjs`, and all Phase 8 quality gates one more time.

### Step 9.4 — Final content audit

Read every string on the site as an evaluator would:
- Does every timeline bullet lead with an outcome and a metric where honest?
- Does every case study follow the Context → Problem → Role → Approach → Outcome → Stack → What I'd do differently structure?
- Is every button label sentence case, verb-led, ≤3 words?
- Is the value prop in the hero specific and outcome-focused, not generic?
- Are all photos loading and correctly sized?
- Are the CV filenames `firstname-lastname-cv.pdf` and equivalent SR?

Flag anything the human should reconsider.

### Phase 9 verification

- [ ] Zero fixture content remains.
- [ ] Both CV PDFs exist and are current.
- [ ] Real photo/logos in place (or omitted with confirmation).
- [ ] All content reviewed for tone and quality.
- [ ] All quality gates still pass.

---

## Phase 10 — Launch

**Objective**: The site is live on the production domain. Every launch checklist item passes. Monitoring is on.

**Prerequisites**: Phase 9 complete.

### Step 10.1 — Domain purchase and DNS **[HUMAN]**

Ask the human to:
1. Purchase the domain (via Cloudflare, Namecheap, Google Domains, etc. — anywhere reputable).
2. In Vercel, add the domain to the project (both `firstnamelastname.com` and `www.firstnamelastname.com`).
3. Configure DNS at the registrar per Vercel's instructions.
4. Confirm HTTPS certificate provisions (automatic via Vercel, takes minutes).
5. Set the apex domain as primary; `www` redirects to apex (or vice versa — decide once, be consistent).

Update `astro.config.mjs` `site` field and `robots.txt` sitemap URL. Push. Verify live URL renders.

### Step 10.2 — Professional email **[HUMAN]**

Recommend: hello@firstnamelastname.com or firstname@firstnamelastname.com — using the domain for email is a low-effort signal of professionalism. Options: Fastmail, Google Workspace, Cloudflare Email Routing (free forwarding to a personal inbox — simplest).

Update the `contact.email` i18n key with the professional address. Update form endpoint if it emails to a different address than the mailto target.

Commit: `phase-10.2: professional email address`

### Step 10.3 — Full launch checklist

Run through the launch checklist from PRD Appendix B, adapted:

- [ ] Both CV PDFs finalized and current
- [ ] Lighthouse ≥ 95 mobile on all page types in both languages
- [ ] Lighthouse Accessibility = 100 on every page type, both languages
- [ ] Manual screen reader pass complete
- [ ] All analytics events firing (verified in dashboard)
- [ ] Form tested end-to-end including failure state
- [ ] Calendly booking tested from an incognito mobile session
- [ ] OG images verified in a link-preview debugger
- [ ] Language toggle tested on every section, form errors, 404
- [ ] Language persistence verified across pages and revisits
- [ ] No layout breakage from longer SR strings on any breakpoint
- [ ] 404 page live and functional
- [ ] DNS + HTTPS + apex/www redirects confirmed
- [ ] `robots.txt` and `sitemap-index.xml` live and correct
- [ ] Structured data validates
- [ ] Dev-only pages deleted: `src/pages/tokens.astro` and `src/pages/components.astro`
- [ ] All CI checks green on main

### Step 10.4 — Search engine notification

Submit the sitemap to Google Search Console. Verify domain ownership via DNS TXT record.

Bing Webmaster Tools optional but recommended (some recruiters use Bing/Edge default).

### Step 10.5 — Announce **[HUMAN]**

Update LinkedIn bio and Twitter/X bio (if used) with the URL. Add to email signature. Update the URL in the CV PDFs if not already.

The site is live. The plan is complete.

---

## Post-launch operations (not part of V1 build, listed for continuity)

- **Weekly**: check analytics dashboard for the first month; iterate hero copy if hero CTA CTR is below 25% after ~200 visitors (PRD §2.2 threshold).
- **When testimonials arrive**: add to `testimonials/` collection with `published: true` — the section renders automatically (per Phase 3.9 and App Flow §4.4).
- **When new case studies ready**: MDX file + frontmatter + push. The card layout adapts to count.
- **When roles change**: edit the roles collection.
- **Do not add** blog, dark mode, or other out-of-scope items without first revisiting the PRD and Design System.

---

## Appendix A — Common commands reference

```bash
# Development
pnpm dev              # start dev server on :4321
pnpm build            # production build to dist/
pnpm preview          # serve dist/ locally

# Verification
pnpm astro check      # typecheck
pnpm test             # unit tests (Vitest) — src/lib/ only
pnpm lint             # prettier + eslint
pnpm verify:fonts     # font subset check
pnpm verify:i18n      # i18n parity check
pnpm lhci             # Lighthouse CI local run

# Content
pnpm astro sync       # regenerate content collection types after schema change
```

## Appendix B — Environment variables reference

Set in `.env.local` for development, in Vercel dashboard for production. All must be `PUBLIC_` prefixed for client-side access in Astro.

| Variable | Provider | Notes |
|---|---|---|
| `PUBLIC_FORM_ENDPOINT` | Web3Forms/Formspree | Form POST URL |
| `PUBLIC_FORM_KEY` | Web3Forms/Formspree | Access key/site key |
| `PUBLIC_CALENDLY_URL` | Calendly | Public event URL |
| `PUBLIC_ANALYTICS_SITE_ID` | Umami/Plausible/Fathom | Site identifier |
| `PUBLIC_ANALYTICS_SCRIPT_URL` | (if self-hosted) | Full script URL |

## Appendix C — Human input checkpoints (summary)

Every point where the plan requires human input, in phase order:

| Phase | Step | What's needed |
|---|---|---|
| 0 | 0.1 | GitHub repo creation and access |
| 0 | 0.5 | Vercel project setup |
| 1 | 1.4 | Approval of visual foundation on `tokens` page |
| 3 | end | Approval of components on `components` page |
| 6 | 6.1 | Form service selection and credentials |
| 6 | 6.2 | Calendly URL |
| 6 | 6.3 | Analytics provider selection and credentials |
| 8 | 8.6 | Real device testing |
| 8 | 8.7 | Screen reader pass |
| 9 | 9.1 | All real content (biggest lift) |
| 9 | 9.3 | Serbian translation verification |
| 10 | 10.1 | Domain purchase + DNS |
| 10 | 10.2 | Professional email setup |
| 10 | 10.5 | Announcement |
