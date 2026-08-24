# Design System
## Personal CV & Portfolio Website — Mid-Level Frontend Engineer

| | |
|---|---|
| **Document status** | v1.2 |
| **Companion to** | PRD v1.0, App Flow v1.0, Implementation Plan v1.2 |

### Changelog

**v1.2** (2026-08-24) — Stack moved to latest: **Astro 7 + Tailwind CSS v4**. Human decision. Section 4 is rewritten end to end; Sections 1–3 and 5–12 are unchanged, because every token value is identical — only the mechanism that declares them moved from JS to CSS.
- There is no `tailwind.config.mjs` any more. The theme is an `@theme` block in `src/styles/base.css` (§4.2).
- `corePlugins` does not exist in v4, so gradients can no longer be disabled at the framework level. **Prohibition #1 is now enforced by regex lint alone** (§4.4, §11). The lint is load-bearing, not belt-and-braces.
- Each namespace is wiped with `--namespace-*: initial` before the allowed tokens are declared. This is what keeps "only these values exist" true — including `--spacing: initial`, which removes v4's dynamic spacing scale so `p-5` and `gap-7` genuinely do not exist.
- z-index and transition-duration have no v4 theme namespace; both are declared as `@utility` blocks so component code still names a token instead of a bare number.
- Browser floor rises to Safari 16.4+ / Chrome 111+ / Firefox 128+ (§4.5).

**v1.1** (2026-08-24) — Playwright removed from the project. The automated WCAG gate in §10.2 and §11 is now Lighthouse's accessibility score (=100), which runs axe internally. Everything it cannot reach — the SR language state, form error state, filtered timeline, keyboard operability, cross-browser fallbacks — moved to the manual checklist. See Implementation Plan changelog.
| **Audience** | Claude Code (implementation agent). Every decision is made here so none is made during build. |
| **Order of authority** | This doc > PRD > agent judgment. If this doc doesn't cover something, ask the human — do not improvise. |

---

## 0. How to use this document

- **Every value is a token.** Never write raw hex, px, or ms in component code — reference the token. If a needed token doesn't exist, add it to Section 3 first.
- **Every component is fully specified in Section 7** with every state and every dimension. Do not invent states, sizes, or variants that aren't listed.
- **Prohibitions in Section 2 are absolute.** Non-negotiable, no exceptions per component.
- **Serbian must be tested on every component** (Section 9) — the layout must not break at +35% string length.
- **Accessibility rules in Section 10 override aesthetic rules** when they conflict. Glass panels that hold text must meet the opacity floor even if it hurts the "glassy" look.

---

## 1. Design principles

1. **The site is a work sample.** Every implementation detail (contrast, motion, semantics, code quality of the components themselves) will be evaluated by frontend engineers. Details matter more than they would for a marketing site.
2. **Restraint is the personality.** Modern-minimal aesthetic (PRD choice) + near-monochrome + glass morphism. The glass panels ARE the visual voice — everything around them stays disciplined. No decoration that doesn't serve navigation or comprehension.
3. **Spend boldness in one place.** The signature elements (Section 6) are glass panels floating over soft accent-color shapes. Everywhere else: quiet, precise, structural.
4. **Static-first.** No skeletons, no loading spinners (except the one Calendly placeholder). Content renders immediately as HTML. If a component *needs* a loading state, it's the wrong component.
5. **One tab stop per meaningful action.** Cards are single links. Buttons are buttons. No nested interactives.

---

## 2. Absolute prohibitions

The agent must not, under any circumstance in this codebase:

1. **No gradients.** Anywhere. Not on backgrounds, buttons, borders, text, or backdrop shapes. Solid colors only. (Backdrop shapes for glass are solid + low opacity, not gradients.) Tailwind v4 cannot delete its gradient utilities, so this is enforced by the regex lint in §4.4 — that lint is the only thing standing between this rule and a silent violation.
2. **No emojis as icons.** Use only Lucide icons (Section 7.14).
3. **No stock photography, illustrations, or generic hero imagery.** Only: the human's photo (if provided), testimonial avatars (with permission), and case-study screenshots.
4. **No scroll-jacking, parallax, or scroll-linked animations** beyond `opacity`/`translateY` fade-in-once on first reveal.
5. **No skeleton screens** anywhere except the Calendly loading placeholder (Section 7.20).
6. **No text on a glass surface below opacity `0.55`.** Contrast fails otherwise. See Section 10.
7. **No animation without a `prefers-reduced-motion` alternative.** Reduced-motion path must be instant (0ms), not just faster.
8. **No auto-playing carousels, marquees, or auto-advancing content** of any kind.
9. **No hover-only affordances.** Anything hoverable must also be reachable and revealed via keyboard focus.
10. **No modal dialogs** in V1. The contact section is the only "conversion surface."
11. **No CAPTCHAs.** Honeypot + timing heuristic only (PRD FR-5).
12. **No AI-default aesthetic tells:** warm cream backgrounds (~`#F4F1EA`) with terracotta accents (~`#D97757`), acid-green-on-black, or broadsheet-column layouts. These read as templated regardless of subject.
13. **No decorative numbered markers** (01/02/03) unless the content is genuinely sequential.
14. **No cookies of any kind** in V1 (privacy-friendly analytics, no consent banner required).
15. **No custom scrollbars, custom cursors, or replaced native controls** where the native version is accessible.

---

## 3. Design tokens

All tokens are defined as CSS custom properties in `:root` **and** mirrored in `tailwind.config.js` (Section 4). Component code references Tailwind utility classes; where Tailwind can't express a token (e.g., glass recipe), reference the CSS variable directly.

### 3.1 Color

Near-monochrome base + one accent. Every color has a defined semantic role — do not use a color outside its role.

**Neutrals (base palette)**

| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#FAFAFA` | Page background |
| `--color-bg-elevated` | `#FFFFFF` | Opaque surfaces sitting above the page (non-glass cards) |
| `--color-surface-glass` | `rgba(255, 255, 255, 0.55)` | Standard glass panel fill (floor opacity for text-bearing glass) |
| `--color-surface-glass-strong` | `rgba(255, 255, 255, 0.72)` | Glass fill when text contrast requires more opacity (small text, dense forms) |
| `--color-text-primary` | `#171717` | Body text, headings |
| `--color-text-secondary` | `#525252` | De-emphasized text (metadata, dates, helper text) |
| `--color-text-tertiary` | `#737373` | Placeholder, disabled, most subtle labels |
| `--color-text-inverse` | `#FAFAFA` | Text on accent-filled buttons |
| `--color-border` | `#E5E5E5` | Solid element borders (inputs, opaque cards) |
| `--color-border-glass` | `rgba(255, 255, 255, 0.6)` | Top/left border of glass panels (specular edge) |
| `--color-border-subtle` | `rgba(0, 0, 0, 0.06)` | Bottom/right border of glass panels, dividers |

**Accent (single accent, deep teal)**

| Token | Hex | Role |
|---|---|---|
| `--color-accent` | `#0F766E` | Primary CTAs, active states, focus rings, link underlines |
| `--color-accent-hover` | `#115E59` | Hover state on primary CTAs |
| `--color-accent-active` | `#134E4A` | Active/pressed state |
| `--color-accent-subtle-bg` | `#F0FDFA` | Subtle accent-tinted backgrounds (filter pill, active toggle side) |
| `--color-accent-backdrop` | `rgba(15, 118, 110, 0.18)` | Backdrop shape color (visible through glass panels) |

**Semantic (used only as specified)**

| Token | Hex | Role |
|---|---|---|
| `--color-error` | `#DC2626` | Form error text and border |
| `--color-error-bg` | `#FEF2F2` | Form error message background |
| `--color-success` | `#0F766E` | Form success confirmation (reuses accent — teal doubles as success in this system) |
| `--color-focus-ring` | `#0F766E` | Same as `--color-accent`; named separately so it can diverge later if needed |

Rules: no color outside this list. If a component needs a color not defined here, add the token first with a rationale in the review notes. Never inline `#hex` values in components.

### 3.2 Typography

**Font stack** — Inter, variable, self-hosted (WOFF2), `font-display: swap`. Mono uses JetBrains Mono, variable, self-hosted, subset to Latin + Latin Extended (for Serbian).

```
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
```

**Type scale** — every size has a fixed line-height. No arbitrary sizes anywhere.

| Token | Size / Line-height | Letter-spacing | Weight | Usage |
|---|---|---|---|---|
| `text-xs` | 12 / 16 | +0.02em | 500 | Micro-labels, section eyebrows (Section 6.3), tag text |
| `text-sm` | 14 / 20 | 0 | 400 | Helper text, form errors, footer, dates |
| `text-base` | 16 / 26 | 0 | 400 | Body copy (default) |
| `text-lg` | 18 / 28 | 0 | 400 | Slightly emphasized body (hero subhead, case-study lead) |
| `text-xl` | 20 / 30 | -0.005em | 500 | Card titles, testimonial quotes |
| `text-2xl` | 24 / 32 | -0.01em | 600 | Section headings (H2) |
| `text-3xl` | 30 / 38 | -0.015em | 600 | Case-study titles (H1 on S2) |
| `text-4xl` | 36 / 44 | -0.02em | 700 | Hero subtitle |
| `text-5xl` | 48 / 56 | -0.025em | 700 | Hero name (mobile) |
| `text-6xl` | 60 / 68 | -0.03em | 700 | Hero name (desktop, ≥1024px) |
| `text-metric` | 40 / 44 | -0.02em | 600, tabular-nums | **Case-study metric callouts only** (Section 6.4) |
| `text-mono-sm` | 13 / 20 | 0 | 500, mono | Section eyebrows, stack tags, `--property`-style labels |

**Weight tokens** — Inter is variable; only these values exist: 400 (regular), 500 (medium), 600 (semibold), 700 (bold). No other weights.

**Global type rules**

- Never mix a size with an unspecified line-height. Every use of `text-*` pairs with the line-height above.
- Numbers in metric contexts (case-study outcomes, availability year counts) use `font-variant-numeric: tabular-nums`.
- Never use `text-decoration: underline` on non-link elements. Links: solid underline, `text-underline-offset: 3px`, `text-decoration-thickness: 1px`.
- Never justify body text.
- Headings never wrap to more than 3 lines at any breakpoint; enforce via `max-width` in ch units.

### 3.3 Spacing

Base unit 4px. Only these values exist — no arbitrary spacing.

| Token | Value | Common use |
|---|---|---|
| `space-0` | 0 | — |
| `space-1` | 4px | Tight icon-text gaps, tag padding |
| `space-2` | 8px | Related-element gaps |
| `space-3` | 12px | Form field internal padding |
| `space-4` | 16px | Component internal padding |
| `space-6` | 24px | Card padding (compact), grid gaps |
| `space-8` | 32px | Card padding (standard) |
| `space-12` | 48px | Between components in a section |
| `space-16` | 64px | Between minor sections on mobile |
| `space-24` | 96px | Between sections (mobile) |
| `space-32` | 128px | Between sections (desktop) |

**Section rhythm** — vertical spacing between major sections on `S1`:
- Mobile (<768px): `space-24` (96px)
- Desktop (≥768px): `space-32` (128px)

Do not deviate. Consistent rhythm is what makes a minimal design feel intentional versus empty.

### 3.4 Border radius

Only these values exist.

| Token | Value | Usage |
|---|---|---|
| `radius-none` | 0 | Dividers, section rules |
| `radius-sm` | 4px | Form inputs, small tags, filter pill |
| `radius-md` | 8px | Buttons, standard tags |
| `radius-lg` | 16px | Cards, glass panels (default) |
| `radius-xl` | 24px | Hero glass container, large glass surfaces |
| `radius-full` | 9999px | **Only** the language toggle switch track, the avatar photos, and the FAB |

Never use `radius-full` on rectangular buttons or CTAs. Pill-shaped buttons are prohibited (they read as social-media UI, wrong register).

### 3.5 Elevation / shadows

Minimal use. Glass panels are the "elevated" surface — they don't need heavy shadows to signal elevation.

| Token | Value | Usage |
|---|---|---|
| `shadow-flat` | `none` | Default state; opaque cards, form fields at rest |
| `shadow-glass` | `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)` | Glass panels at rest (barely there — the blur does most of the work) |
| `shadow-glass-hover` | `0 2px 4px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.08)` | Glass card on hover |
| `shadow-toast` | `0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)` | Toast (Section 7.6) — the one prominent shadow in the app |

Never use shadows to imply elevation on buttons. Never use shadow color other than these rgba(0,0,0,*) values (no colored shadows).

### 3.6 Glass panel specification

The signature element. Precise recipe — do not deviate.

**Standard glass panel** (cards, contact section container, headers)

```css
.glass {
  background: var(--color-surface-glass);           /* rgba(255,255,255,0.55) */
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid var(--color-border-glass);      /* rgba(255,255,255,0.6) - top+left highlight */
  border-right-color: var(--color-border-subtle);   /* rgba(0,0,0,0.06) - subtle bottom+right */
  border-bottom-color: var(--color-border-subtle);
  border-radius: var(--radius-lg);                  /* 16px */
  box-shadow: var(--shadow-glass);
}

@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: var(--color-bg-elevated);           /* solid white fallback */
    border-color: var(--color-border);
  }
}
```

**Strong glass panel** (form containers, dense text)
- Same as above but `background: var(--color-surface-glass-strong)` and `backdrop-filter: blur(24px) saturate(1.4)`.

**Glass panel rules**
- Use glass **only for containers of content**, never for buttons, tags, or inline elements.
- A glass panel must sit above either (a) a backdrop shape (Section 6.2), (b) grayscale imagery, or (c) an area of empty page background near a backdrop shape. Never over pure `--color-bg` with nothing behind it — blur on nothing looks broken.
- Never nest glass in glass.
- Never animate `backdrop-filter` (destroys frame rate on Safari and iOS). Fade opacity if a transition is needed.
- Do not apply glass to full-viewport surfaces (the header is the only exception).

**Where glass is used in this app** (exhaustive list — do not add more):
1. Home header (Variant A) — sticky, full-width
2. Case-study header (Variant B) — sticky, full-width
3. Case study cards on S1 (`#case-studies` section)
4. Contact section container (`#contact`) wrapping form + Calendly
5. Sticky FAB
6. Toast
7. Case study body container on S2

Timeline entries, testimonials, tags, buttons: **not glass**.

### 3.7 Motion tokens

| Token | Value | Usage |
|---|---|---|
| `duration-instant` | 0ms | Reduced-motion path for all transitions |
| `duration-fast` | 150ms | Hover/focus color and opacity changes, toast dismiss |
| `duration-base` | 250ms | Section fade-in-once on first reveal, filter apply, glass hover shadow |
| `duration-slow` | 400ms | Reserved for the toast entry/exit only |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default easing for all transitions |
| `ease-linear` | `linear` | Progress-style animations (none currently exist) |

Global CSS rule (must be in the base stylesheet):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Additionally, **smooth-scroll for anchor navigation must be JS-driven and check `prefers-reduced-motion`** — do not rely on CSS `scroll-behavior: smooth`, which some browsers apply inconsistently under reduced motion.

### 3.8 Z-index scale

Only these values exist.

| Token | Value | Usage |
|---|---|---|
| `z-base` | 0 | Default flow |
| `z-backdrop` | 1 | Backdrop shapes behind glass |
| `z-content` | 10 | Section content |
| `z-sticky` | 40 | Sticky header, sticky FAB |
| `z-toast` | 60 | Toast |
| `z-skip-link` | 100 | Skip-to-content link when focused |

No other z-index values. If a stacking issue seems to require one, restructure the DOM first.

---

## 4. Tailwind configuration

The stack is **Astro 7 + Tailwind CSS v4** (Implementation Plan §1). Tailwind v4 is **CSS-first**: there is no `tailwind.config.mjs`. The theme lives in an `@theme` block inside the base stylesheet, and the tokens in Section 3 are its single source of truth. This section is authoritative — copy it directly.

### 4.1 How v4 differs from the config this system was first written against

Four differences change how the rules in this document are enforced. Know them before you write a line of CSS.

| Concern | v3 mechanism (historic) | v4 mechanism (use this) |
|---|---|---|
| Theme definition | `tailwind.config.mjs` JS object | `@theme { }` block in CSS |
| Restricting to allowed values only | Replace `theme.colors` etc. wholesale | `--namespace-*: initial` wipes the default scale, then declare only the allowed tokens |
| Blocking gradients | `corePlugins: { backgroundImage: false }` | **No `corePlugins` exists in v4.** Enforced by regex lint instead — see §4.4 |
| Content scanning | `content: [...]` glob array | Automatic; `@source` only for exceptions |

**The most important consequence**: v4 cannot mechanically disable the gradient utilities. Prohibition #1 in Section 2 is now enforced by lint, not by the framework. The lint in §4.4 is therefore **not optional** — without it the no-gradient rule has no teeth at all.

### 4.2 Required base stylesheet (`src/styles/base.css`)

Note on structure: in v4, everything declared in `@theme` is **also emitted as a CSS custom property on `:root`**. So the glass recipe and the `@utility` blocks below can read `var(--color-accent)` directly — there is no need to declare tokens twice, and doing so would create a circular reference. Only the scales Tailwind does not namespace (duration, z-index, glass geometry) are declared in a separate `:root` block.

**`@theme static` is mandatory, not stylistic.** A plain `@theme` block tree-shakes every variable no utility happens to reference, so `var(--color-accent)` inside the glass recipe would resolve to nothing and the panel would render transparent. This fails silently — the build succeeds and the page just looks wrong. `static` forces all tokens into `:root` unconditionally, which is what this design system assumes, because much of its CSS is hand-written rather than utility-generated.

```css
/* `source(none)` disables v4's automatic content detection, which otherwise
   scans every non-gitignored file in the project — including this design
   system document and the lint scripts. Prose that merely NAMES a utility
   is enough to generate it: documenting the ban on `bg-conic` is what put
   a real conic-gradient rule in the bundle. Scanning is therefore scoped
   to the source files that can legitimately contain class names. */
@import 'tailwindcss' source(none);
@source '../**/*.{astro,ts,tsx,js,jsx,mdx}';

/* Self-hosted variable fonts — §3.2, §9.2. The `wght` cut carries the weight
   axis only, which is all this system uses (400/500/600/700); no italics are
   specified anywhere, so the italic files are deliberately not imported.
   Fontsource splits each family by unicode-range, so a browser fetches the
   latin-ext file — the one holding š đ č ć ž — only when the page actually
   contains those characters. font-display: swap is already set upstream.
   Glyph coverage is asserted at build time by scripts/verify-fonts.mjs. */
@import '@fontsource-variable/inter/wght.css';
@import '@fontsource-variable/jetbrains-mono/wght.css';

/* ------------------------------------------------------------------ *
 * 1. Tailwind theme — Section 3 tokens, verbatim.                     *
 *    Every namespace is wiped with `initial` first so ONLY these      *
 *    tokens generate utilities. This is what makes "no value outside  *
 *    this list" true rather than aspirational.                        *
 *    v4 also emits each of these as a :root custom property.          *
 * ------------------------------------------------------------------ */
@theme static {
  /* --- Color — §3.1. Wipes Tailwind's default palette entirely. --- */
  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;
  --color-bg: #fafafa;
  --color-bg-elevated: #ffffff;
  --color-surface-glass: rgba(255, 255, 255, 0.55);
  --color-surface-glass-strong: rgba(255, 255, 255, 0.72);
  --color-text-primary: #171717;
  --color-text-secondary: #525252;
  --color-text-tertiary: #737373;
  --color-text-inverse: #fafafa;
  --color-border: #e5e5e5;
  --color-border-glass: rgba(255, 255, 255, 0.6);
  --color-border-subtle: rgba(0, 0, 0, 0.06);
  --color-accent: #0f766e;
  --color-accent-hover: #115e59;
  --color-accent-active: #134e4a;
  --color-accent-subtle-bg: #f0fdfa;
  --color-accent-backdrop: rgba(15, 118, 110, 0.18);
  --color-error: #dc2626;
  --color-error-bg: #fef2f2;
  --color-success: #0f766e;
  --color-focus-ring: #0f766e;

  /* --- Font family — §3.2 --- */
  --font-*: initial;
  --font-sans: 'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  /* --- Type scale — §3.2. Every size carries its line-height,
         letter-spacing and weight, so `text-*` alone is always complete
         and Section 3.2's "never mix a size with an unspecified
         line-height" rule cannot be violated by accident. --- */
  --text-*: initial;

  --text-xs: 12px;
  --text-xs--line-height: 16px;
  --text-xs--letter-spacing: 0.02em;
  --text-xs--font-weight: 500;

  --text-sm: 14px;
  --text-sm--line-height: 20px;
  --text-sm--letter-spacing: 0em;
  --text-sm--font-weight: 400;

  --text-base: 16px;
  --text-base--line-height: 26px;
  --text-base--letter-spacing: 0em;
  --text-base--font-weight: 400;

  --text-lg: 18px;
  --text-lg--line-height: 28px;
  --text-lg--letter-spacing: 0em;
  --text-lg--font-weight: 400;

  --text-xl: 20px;
  --text-xl--line-height: 30px;
  --text-xl--letter-spacing: -0.005em;
  --text-xl--font-weight: 500;

  --text-2xl: 24px;
  --text-2xl--line-height: 32px;
  --text-2xl--letter-spacing: -0.01em;
  --text-2xl--font-weight: 600;

  --text-3xl: 30px;
  --text-3xl--line-height: 38px;
  --text-3xl--letter-spacing: -0.015em;
  --text-3xl--font-weight: 600;

  --text-4xl: 36px;
  --text-4xl--line-height: 44px;
  --text-4xl--letter-spacing: -0.02em;
  --text-4xl--font-weight: 700;

  --text-5xl: 48px;
  --text-5xl--line-height: 56px;
  --text-5xl--letter-spacing: -0.025em;
  --text-5xl--font-weight: 700;

  --text-6xl: 60px;
  --text-6xl--line-height: 68px;
  --text-6xl--letter-spacing: -0.03em;
  --text-6xl--font-weight: 700;

  --text-metric: 40px;
  --text-metric--line-height: 44px;
  --text-metric--letter-spacing: -0.02em;
  --text-metric--font-weight: 600;

  --text-mono-sm: 13px;
  --text-mono-sm--line-height: 20px;
  --text-mono-sm--letter-spacing: 0em;
  --text-mono-sm--font-weight: 500;

  /* --- Weight — §3.2. Only these four exist. --- */
  --font-weight-*: initial;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* --- Spacing — §3.3. `--spacing: initial` disables v4's dynamic
         scale, so p-5 / gap-7 / mt-13 do not exist. Only these eleven
         values are expressible. --- */
  --spacing: initial;
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-24: 96px;
  --spacing-32: 128px;

  /* --- Radius — §3.4 --- */
  --radius-*: initial;
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* --- Shadow — §3.5 --- */
  --shadow-*: initial;
  --shadow-flat: none;
  --shadow-glass: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06);
  --shadow-glass-hover: 0 2px 4px rgba(0, 0, 0, 0.05), 0 12px 32px rgba(0, 0, 0, 0.08);
  --shadow-toast: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);

  /* --- Easing — §3.7 --- */
  --ease-*: initial;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-linear: linear;

  /* --- Breakpoints — §5.1. No 2xl. --- */
  --breakpoint-*: initial;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;

  /* --- Containers — §5.2. Generates max-w-container / max-w-prose. --- */
  --container-*: initial;
  --container-container: 1200px;
  --container-prose: 65ch;

  /* --- Blur — §3.6. Generates backdrop-blur-glass. --- */
  --blur-*: initial;
  --blur-glass: 20px;
  --blur-glass-strong: 24px;
}

/* ------------------------------------------------------------------ *
 * 2. Scales Tailwind v4 does not namespace. Declared here so that     *
 *    component code still references a named token rather than a      *
 *    bare number, per Section 0.                                      *
 * ------------------------------------------------------------------ */
:root {
  /* Motion — §3.7 */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;

  /* Z-index — §3.8 */
  --z-base: 0;
  --z-backdrop: 1;
  --z-content: 10;
  --z-sticky: 40;
  --z-toast: 60;
  --z-skip-link: 100;

  /* Glass geometry — §3.6 */
  --glass-blur: 20px;
  --glass-blur-strong: 24px;
  --glass-saturate: 1.6;
  --glass-saturate-strong: 1.4;
}

/* ------------------------------------------------------------------ *
 * 3. Named utilities for the two scales above, plus the glass recipe. *
 * ------------------------------------------------------------------ */
@utility z-base       { z-index: var(--z-base); }
@utility z-backdrop   { z-index: var(--z-backdrop); }
@utility z-content    { z-index: var(--z-content); }
@utility z-sticky     { z-index: var(--z-sticky); }
@utility z-toast      { z-index: var(--z-toast); }
@utility z-skip-link  { z-index: var(--z-skip-link); }

@utility duration-instant { transition-duration: var(--duration-instant); }
@utility duration-fast    { transition-duration: var(--duration-fast); }
@utility duration-base    { transition-duration: var(--duration-base); }
@utility duration-slow    { transition-duration: var(--duration-slow); }

/* Glass — §3.6. A fixed recipe, not a composable utility.
   Never nest glass in glass. Never animate backdrop-filter. */
@utility glass {
  background: var(--color-surface-glass);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--color-border-glass);
  border-right-color: var(--color-border-subtle);
  border-bottom-color: var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}

@utility glass-strong {
  background: var(--color-surface-glass-strong);
  backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong));
  -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong));
  border: 1px solid var(--color-border-glass);
  border-right-color: var(--color-border-subtle);
  border-bottom-color: var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}

/* ------------------------------------------------------------------ *
 * 4. Global base rules.                                               *
 * ------------------------------------------------------------------ */
html {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg);
}
body { min-height: 100dvh; }

/* Focus ring — never suppressed. §10.6 */
:focus { outline: none; }
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Glass fallbacks — §10.4 and §10.5. Both are mandatory.
   These are plain class selectors, so they override the @utility
   definitions above by source order. */
@supports not (backdrop-filter: blur(1px)) {
  .glass, .glass-strong {
    background: var(--color-bg-elevated);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: var(--color-border);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass, .glass-strong {
    background: var(--color-bg-elevated);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: var(--color-border);
  }
}

/* ------------------------------------------------------------------ *
 * 5. Language switching — §9. Both languages are present in the HTML;   *
 *    exactly one is shown, keyed on <html lang>. This is what makes the *
 *    switch instant, JS-free after first paint, and flash-free.         *
 *                                                                       *
 *    `display: contents` rather than block/inline: the wrapper must not  *
 *    affect layout, and the same rule has to serve both an inline <span> *
 *    around a button label and a block <div> around a case-study body.   *
 * ------------------------------------------------------------------ */
[data-lang] {
  display: none;
}
html[lang='en'] [data-lang='en'],
html[lang^='sr'] [data-lang='sr'] {
  display: contents;
}

/* Reduced motion — §3.7. The reduced path is instant, not merely faster. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4.3 Wiring Tailwind into Astro

There is no `@astrojs/tailwind` integration for Astro 7 — it was deprecated and its final release supports Astro 5 at most. v4 ships a Vite plugin instead:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

Import `src/styles/base.css` once, in `BaseLayout.astro`. Do not import it per-component.

### 4.4 Enforcing the no-gradient prohibition without `corePlugins`

Prohibition #1 (Section 2) is absolute, but v4 gives no way to delete the gradient utilities. The regex lint in Section 11 is the whole enforcement mechanism. It must catch **both** spellings:

- Raw CSS functions: `linear-gradient`, `radial-gradient`, `conic-gradient`
- v4 utility classes: `bg-linear-*`, `bg-radial*`, `bg-conic*`

Gradient colour stops (`from-*`, `via-*`, `to-*`) produce nothing on their own, so the three `bg-` prefixes above are sufficient and precise. The lint runs against `src/` **and** the built `dist/` CSS.

**Scope Tailwind's source detection or the lint fights itself.** v4 scans every non-gitignored file by default, so naming a utility anywhere in the repo generates it — this document listing `bg-conic` as forbidden was enough to emit `.bg-conic{background-image:conic-gradient(…)}` into the build. §4.2 opens with `source(none)` plus an explicit `@source` for exactly this reason. Keep prose and lint patterns out of the scanned set, and treat any gradient in `dist/` as a genuine violation rather than a false positive.

### 4.5 Browser floor

Tailwind v4 targets Safari 16.4+, Chrome 111+, and Firefox 128+; it uses `@property` and `color-mix()` and does not degrade below that. This is compatible with — and slightly stricter than — the `backdrop-filter` support this design already assumes. The `@supports` and `prefers-reduced-transparency` fallbacks in §4.2 remain mandatory regardless: they cover users who have transparency disabled, not users on old browsers.


## 5. Layout system

### 5.1 Breakpoints

Mobile-first. These are the only breakpoints; do not introduce others.

| Name | Range | Notes |
|---|---|---|
| (default) | 320–639px | Mobile |
| `sm` | 640–767px | Large mobile |
| `md` | 768–1023px | Tablet |
| `lg` | 1024–1439px | Desktop |
| `xl` | ≥1440px | Large desktop |

Minimum supported width: 320px. Test explicitly at 320, 375, 768, 1024, 1440.

### 5.2 Containers

| Container | Max width | Horizontal padding |
|---|---|---|
| `container` (default page container) | 1200px | 16px mobile / 24px `sm` / 32px `md`+ |
| `container-prose` (text-heavy: case study body, testimonials) | 65ch (~680px) | Same as above |

Reading content **must** use `container-prose`. Timeline bullets, case-study body paragraphs, testimonial quotes: all capped at 65ch. Body text lines longer than 65ch violate the design.

### 5.3 Grid

CSS Grid or Flexbox — no framework grid. Common grid patterns used in this app:

| Pattern | Definition |
|---|---|
| **Case studies grid (3 cards)** | `grid-cols-1 md:grid-cols-3 gap-6` |
| **Case studies grid (2 cards)** | `grid-cols-1 md:grid-cols-2 gap-6` |
| **Case studies spotlight (1 card)** | Single full-width card, `max-w-container` |
| **Skill matrix categories** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8` |
| **Footer** | `grid-cols-2 md:grid-cols-4 gap-6` |

### 5.4 Section vertical rhythm

Every top-level section on S1 uses:
- Vertical padding: `py-24 md:py-32` (per section-rhythm rule, Section 3.3)
- Sections do not touch — they have full rhythm between them, always. No "half-height" sections.

### 5.5 Header safe zone

Sticky header height: 64px mobile, 72px desktop. Every anchor target must have `scroll-margin-top` equal to header height + 16px (`scroll-mt-20 md:scroll-mt-24`). Content must never land under the header.

---

## 6. Signature elements

The memorable details. Applied precisely as specified — deviation breaks the identity.

### 6.1 Glass panels
See Section 3.6. That IS the primary signature.

### 6.2 Backdrop shapes (behind glass)

Soft, blurred, solid-color organic blobs of `--color-accent-backdrop` that sit behind glass panels and give the blur something to blur.

**Recipe**
- 3–5 shapes per S1, positioned absolutely inside the page (never fixed).
- Each shape: an SVG or CSS-drawn ellipse/circle, filled with `var(--color-accent-backdrop)`, with `filter: blur(80px)`.
- Sizes: 320px–560px on the longest axis; vary per shape.
- Positioned so that at least one glass panel sits above (or partially above) each shape.
- `z-index: var(--z-backdrop)` (behind all content).
- `pointer-events: none`, `aria-hidden="true"`.
- On mobile, cap to 2 shapes and reduce blur to 60px (performance).

**Do not**
- Animate shapes (no floating, no morphing).
- Use gradients inside shapes.
- Place shapes over case-study screenshots or photos.
- Exceed 5 total on any page.

### 6.3 Section eyebrows (the "developer's craft" signature)

Every major section heading on S1 and S2 is preceded by a mono eyebrow styled as a CSS custom property. This is a small, quiet reference to the subject's craft (frontend engineering) — it should read as considered, not cute.

**Anatomy**
```
--work-experience
Experience
```

**Specification**
- Eyebrow text: `--kebab-case` label, in `text-mono-sm`, `color: var(--color-text-tertiary)`.
- Prefix `--` is literal (part of the string).
- Directly above the section H2, `margin-bottom: var(--space-2)` (8px).
- Bilingual: the label is translated but stays kebab-case (SR: `--iskustvo`, `--kontakt`, etc.).
- Used on: `#work`, `#case-studies`, `#skills`, `#testimonials` (post-launch), `#contact`, and above each S2 body section (Context, Approach, Outcome, Stack, What I'd do differently).
- **Not used** on the hero (the hero opens with the name, no eyebrow) or the proof strip.

### 6.4 Metric callouts

Numerical outcomes in case studies (e.g., "-58% LCP", "6% conversion lift", "200k users") get a distinct visual treatment.

**Specification**
- Font: `text-metric` (40 / 44, tabular-nums, semibold).
- Color: `var(--color-accent)`.
- Below the metric, a `text-sm` label in `var(--color-text-secondary)` describing what the number means.
- Metrics appear only in three places: case-study cards on S1, case-study body outcome block on S2, and (optionally) an "at a glance" strip on S1 near the hero if fewer than 3 case studies are ready.
- Never used for anything not a real outcome metric — no "5 years experience" as a metric callout (that's `text-lg`, secondary color, in-flow).

---

## 7. Component specifications

Every component below is fully specified — every state, every dimension, every token. Do not add states, sizes, or variants not listed. Do not use these components for purposes not listed. When in doubt, ask.

Legend: **Anatomy** = parts; **States** = every visual state; **Tokens** = exact references; **A11y** = accessibility requirements; **Bilingual** = SR-specific notes.

### 7.1 Button — Primary

**Purpose**: The single most important CTA in a given context. Only one primary button visible in any given viewport.

**Anatomy**: Text label · optional trailing icon (16px, Lucide).

**Dimensions**: Height 44px, padding `0 var(--space-6)` (24px horizontal), `radius-md` (8px), `text-base` (16/26), weight 500. Icon-only variant is not a primary button; see 7.4.

**States**

| State | Background | Text | Border | Extra |
|---|---|---|---|---|
| Default | `bg-accent` | `text-inverse` | none | `shadow-flat` |
| Hover | `bg-accent-hover` | `text-inverse` | none | transition 150ms |
| Focus-visible | `bg-accent` | `text-inverse` | none | 2px focus ring, 2px offset |
| Active | `bg-accent-active` | `text-inverse` | none | translateY(1px) |
| Disabled | `bg-accent` at opacity 0.4 | `text-inverse` | none | `cursor: not-allowed`; `aria-disabled="true"` |
| Loading (form submit) | `bg-accent` | `text-inverse` "Sending…" label swap | none | Button disabled; spinner icon replaces trailing icon if present |

**A11y**
- Real `<button>` (or `<a>` if it navigates, with role="button" prohibited — pick the correct element).
- Minimum tap target 44×44px including any padding.
- Focus ring never removed.
- Loading state announces via `aria-live="polite"` on the form container, not the button.

**Bilingual**: label may run ~35% longer in SR; button auto-widens with content. Never truncate button labels.

**Prohibited**: gradients, uppercase transformation, letter-spacing changes, icon-only usage, drop shadows.

### 7.2 Button — Secondary

**Purpose**: Secondary CTA in the same viewport as a primary (e.g., "Book a Chat" next to "Download Resume" in hero).

**Anatomy**: Text label · optional trailing icon.

**Dimensions**: Same as primary (44px height, same padding, same type).

**States**

| State | Background | Text | Border |
|---|---|---|---|
| Default | transparent | `text-primary` | 1px solid `border` |
| Hover | `bg-elevated` | `text-primary` | 1px solid `text-primary` |
| Focus-visible | transparent | `text-primary` | 1px solid `border` + 2px focus ring |
| Active | `bg-elevated` | `text-primary` | 1px solid `text-primary` |
| Disabled | transparent | `text-tertiary` | 1px solid `border-subtle` |

### 7.3 Button — Ghost

**Purpose**: Tertiary action. Used sparingly — e.g., "Clear filter" on the filter pill's affordance, or "See all skills" if the matrix collapses (not in V1).

**Dimensions**: Height 36px, padding `0 var(--space-4)`, `radius-md`, `text-sm`, weight 500.

**States**

| State | Background | Text |
|---|---|---|
| Default | transparent | `text-secondary` |
| Hover | `bg-elevated` | `text-primary` |
| Focus-visible | transparent | `text-primary` + focus ring |
| Active | `bg-elevated` | `text-primary` |
| Disabled | transparent | `text-tertiary` (opacity 0.5) |

### 7.4 Button — Icon-only

**Purpose**: Compact action (close toast, dismiss filter pill). Never used as a primary CTA.

**Dimensions**: 32×32px square, `radius-md`, contains a 16px Lucide icon centered.

**States**: Same color pattern as ghost, but background `bg-elevated` on hover.

**A11y**: **Must** have `aria-label` describing the action ("Close" / "Zatvori"). Never rely on icon-only affordance for meaning.

### 7.5 Links

Three variants. Underlines are load-bearing.

| Variant | Where used | Style |
|---|---|---|
| **Inline** | Inside prose (case-study body) | Color `text-primary`, underline solid 1px, offset 3px, underline color `accent`; hover: full text color becomes `accent` |
| **Standalone** | Case-study "Read case study →" link, timeline links | Color `accent`, weight 500, underline on hover only, includes right arrow (Lucide `arrow-right` 16px) |
| **External** | GitHub, LinkedIn, live demos | Same as standalone but arrow is `arrow-up-right` 16px; `target="_blank" rel="noopener"` |

Focus-visible on all three: 2px focus ring, 2px offset, no underline change.

### 7.6 Toast

**Purpose**: Ephemeral confirmation (resume download acknowledgment — the only toast in V1).

**Anatomy**: Icon (16px, `check`) · message text · optional inline link ("Talk soon?") · close button (icon-only, 7.4).

**Dimensions**: `min-width: 280px`, `max-width: 400px`, padding `space-4` (16px), `radius-md`.

**Behavior**
- Enters with `duration-slow` (400ms) fade + `translateY(8px → 0)`. Instant under reduced motion.
- Auto-dismisses after 3000ms. Timer pauses on hover/focus within the toast.
- Position: bottom-right on desktop, bottom-center on mobile with 16px inset from viewport edge.
- Never stacks: rapid re-triggers replace the current toast, they don't queue.

**Style**
- `glass-strong` recipe (higher opacity for text contrast on translucent surface — mandatory per Section 10).
- `shadow-toast`.
- Text: `text-sm`, `text-primary`.
- Inline link: standalone-link style but smaller (`text-sm`).

**A11y**
- Container: `role="status"` `aria-live="polite"` `aria-atomic="true"`.
- Not focus-trapping. Never blocks the underlying UI.
- Close button reachable by keyboard (Tab from wherever focus is; on Esc, dismiss).

### 7.7 Text input

**Purpose**: Form fields (name, email, company). Never used outside forms.

**Anatomy**: Wrapper (see 7.9) provides label, error, helper. This spec is the input element only.

**Dimensions**: Height 44px, padding `0 var(--space-3)` (12px horizontal), `radius-sm` (4px), `text-base`.

**States**

| State | Background | Text | Border |
|---|---|---|---|
| Default | `bg-elevated` | `text-primary` | 1px solid `border` |
| Focus | `bg-elevated` | `text-primary` | 1px solid `accent` + 2px focus ring (2px offset) |
| Filled | `bg-elevated` | `text-primary` | 1px solid `border` |
| Error | `bg-elevated` | `text-primary` | 1px solid `error` |
| Disabled | `bg` | `text-tertiary` | 1px solid `border-subtle` |

Placeholder: `text-tertiary`, `text-base`. Never use placeholder as a substitute for a label.

**A11y**: Real `<label>` linked via `for`/`id`. `aria-invalid="true"` on error. `aria-describedby` pointing to helper/error text.

### 7.8 Textarea

Same as 7.7 with:
- Min-height: 120px, max-height: 320px, `resize: vertical`.
- Padding `var(--space-3) var(--space-3)` (12px all sides).
- Line-height: 26px (matches `text-base`).

### 7.9 Form field wrapper

**Purpose**: The complete labeled field unit. Every input/textarea appears inside one.

**Anatomy** (top to bottom):
1. Label — `text-sm`, weight 500, `text-primary`, `margin-bottom: 6px`.
2. Optional helper text — `text-sm`, `text-secondary`, above the input if brief instructions needed.
3. Input or textarea.
4. Error message — `text-sm`, `text-error`, `margin-top: 6px`, includes `alert-circle` Lucide icon 14px inline; only rendered when validation fails.

Required fields have no visual marker (all three of name/email/message are required; company is the only optional field and is labeled "Company (optional)").

### 7.10 Case study card (on S1)

**Purpose**: A single flagship case study preview. Also a link.

**Anatomy** (top to bottom, inside a glass panel):
1. Screenshot or key visual — 16:10 aspect ratio, `radius-md`, `object-cover`.
2. Section eyebrow (`--case-study`, mono-sm, tertiary).
3. Title — `text-xl`, weight 600, `text-primary`.
4. One-line outcome — `text-base`, `text-secondary`.
5. Metric callout row — up to 3 metrics using `text-metric` treatment (Section 6.4), horizontal on desktop, stacked on mobile.
6. Stack tags row (Section 7.12).
7. "Read case study →" standalone link (Section 7.5).

**Dimensions**
- Glass panel: `radius-lg` (16px), padding `space-8` (32px), min-height `420px` on desktop.
- Whole card is one link (`<a>` wrapping content), single tab stop.

**Layouts**
- 3-card grid: standard card as above.
- 2-card grid: same card, wider.
- 1-card spotlight (probable launch state): card becomes horizontal on desktop — image left (50%), content right (50%); vertical on mobile as before. Screenshot ratio becomes 4:3.

**States**

| State | Panel style |
|---|---|
| Default | `glass` recipe, `shadow-glass` |
| Hover | `shadow-glass-hover`, title color → `accent`, transition 250ms |
| Focus-visible | Default panel + 2px focus ring on the outer link |

**Bilingual**: min-height increases to `460px` in SR to absorb longer strings; enforce via CSS logical properties.

### 7.11 Testimonial card (post-launch)

**Purpose**: Named third-party quote.

**Anatomy** (inside a **non-glass** panel — testimonials sit on a bg-elevated surface for maximum text contrast):
1. Quote — `text-xl`, weight 400, `text-primary`, max-width 55ch. No decorative quote marks (typography carries the quote).
2. Divider — 1px solid `border-subtle`, width 40px, `margin: space-6 0`.
3. Attribution row: 40px round avatar (`radius-full`) + column of (name in `text-sm` weight 600 + role/company in `text-sm` `text-secondary`).
4. Optional external link icon → LinkedIn recommendation (external link style, 7.5).

**Dimensions**: padding `space-8`, `radius-lg`, `bg-elevated`, 1px `border`. No shadow.

### 7.12 Tag / Badge

**Purpose**: Skills (in skill matrix) and stack tags (on case studies).

**Anatomy**: Small pill of text, optionally with a preceding dot for category color coding (not used in V1 — reserved).

**Dimensions**: Height 24px, padding `0 var(--space-2)` (8px), `radius-sm` (4px), `text-mono-sm` (13/20, mono, weight 500).

**States**

| Variant | Background | Text | Border |
|---|---|---|---|
| Default (non-interactive stack tag) | `bg-elevated` | `text-secondary` | 1px solid `border-subtle` |
| Interactive skill (has timeline matches) — default | `bg-elevated` | `text-primary` | 1px solid `border` |
| Interactive skill — hover | `accent-subtle-bg` | `accent` | 1px solid `accent` |
| Interactive skill — active (filter applied) | `accent` | `text-inverse` | 1px solid `accent` |
| Interactive skill — focus-visible | Same as default + 2px focus ring |

Non-interactive skills (no matches) render as **default (non-interactive stack tag)** style — not focusable, no hover state.

### 7.13 Availability badge (hero)

**Purpose**: Optional "Open to opportunities · Vienna / Remote" indicator in the hero.

**Anatomy**: Small dot (8px circle, `accent` fill, subtle pulse animation ONLY if reduced-motion off) + `text-sm` weight 500 `text-primary`.

**Dimensions**: Height 32px, padding `0 var(--space-3)`, `radius-full` (this is one of the two badges allowed to be pill-shaped, alongside FAB and toggle track), `bg-elevated`, 1px `border-subtle`.

Rendered only when the corresponding content key `hero.availability.enabled` is true.

### 7.14 Timeline entry

**Purpose**: One role in the work timeline (`#work`).

**Anatomy** (each entry is a horizontal layout on desktop, stacked on mobile):
- Left column (desktop) / top (mobile): dates in `text-mono-sm`, `text-tertiary`, tabular-nums; below dates, company name in `text-sm` weight 500.
- Right column: role title in `text-lg` weight 600; below, achievement bullets — real `<ul>`, `text-base`, `text-primary`, marker is a 4px accent-colored square (not a disc).
- Below bullets: horizontal row of stack tags (7.12) used at that role.
- Optional: "Read case study →" standalone link at the bottom if the role has a case study.

**Dimensions**: entries separated by 1px `border-subtle` horizontal rule with `space-8` (32px) vertical spacing. No card container.

**Filtered state** (when a skill is clicked in the matrix and this entry matches): default. Non-matching entries: `opacity: 0.35`, transition `duration-base`. Matching entries also get a 2px left border in `accent` at the entry's leading edge to reinforce the match.

### 7.15 Section heading

**Purpose**: The H2 for each section on S1 (also H1 for the case-study body sections' subheadings — those are H2 in S2's outline).

**Anatomy** (top to bottom):
1. Section eyebrow (Section 6.3).
2. H2: `text-2xl` (mobile) / `text-3xl` (`md`+), weight 600, `text-primary`.
3. Optional subhead: `text-lg`, `text-secondary`, max-width `container-prose`, `margin-top: space-2`.

Spacing below the block before content: `space-8` (32px).

### 7.16 Language toggle

**Purpose**: EN/SR switch in header and footer.

**Anatomy**: Two labels `EN` and `SR` separated by a `/`, with the active label in `text-primary` weight 600 and the inactive in `text-tertiary` weight 500.

**Dimensions**: Height 32px, padding `0 var(--space-2)`, `radius-full`, `bg-elevated`, 1px `border-subtle`. `text-mono-sm`.

**States**

| State | Style |
|---|---|
| Default | As above |
| Hover | Inactive label transitions to `text-secondary`, transition 150ms |
| Focus-visible | 2px focus ring on the whole control |
| Active (clicked) | Labels swap emphasis; full-page in-place translation runs (per PRD FR-6) |

**Behavior**: Single button toggling between the two languages. Not a `<select>`. Not a dropdown.

**A11y**: `<button>` with `aria-label` "Switch to Serbian" (or "Switch to English" when SR active) — the aria-label describes the *action*, not the current state. `aria-pressed` reflects state (`false` when EN active, `true` when SR active — arbitrary but consistent).

### 7.17 Sticky contact FAB

**Purpose**: Floating "Contact" button appearing after hero scroll-out (per App Flow 2.2).

**Anatomy**: `message-circle` Lucide icon 20px + text label "Contact" (or "Kontakt").

**Dimensions**: Height 48px, padding `0 var(--space-6)`, `radius-full` (allowed pill exception), `bg-accent`, `text-inverse`, `shadow-glass-hover`.

**Position**: `fixed`, `bottom: 24px`, `right: 24px` desktop / `bottom: 16px`, `right: 16px` mobile. `z-sticky`.

**Visibility rules**
- Hidden while `#hero` in view (IntersectionObserver on hero).
- Visible while past hero.
- Hidden while `#contact` in view.
- Hidden while any form field is focused (mobile keyboard collision).

**Transitions**: opacity 250ms `ease-out`. Instant under reduced motion.

### 7.18 Header — Variant A (Home)

**Purpose**: Sticky navigation for S1.

**Anatomy**
- Left: logo/name — `text-base` weight 600, `text-primary`. Clickable, scrolls to top of `/`.
- Center (desktop only, `md`+): anchor nav — "Work", "Skills", "Contact" as ghost-button-styled links (7.3 dimensions, no background); scrollspy applies `text-primary` + underline (1px, offset 3px, accent) to the active section link, others are `text-secondary`.
- Right: language toggle (7.16) · primary CTA button "Book a Chat" (7.1, small size — 36px height, `text-sm`, padding `0 var(--space-4)`).
- Mobile: left logo + right (language toggle + secondary-styled "Contact" button 36px). **No hamburger.**

**Container**: full-width, sticky, `top: 0`, `z-sticky`. Height 64px mobile / 72px desktop. Applies the `glass` recipe as background. Inner content wrapped in `max-w-container` with horizontal padding per 5.2.

### 7.19 Header — Variant B (Case study + 404)

**Anatomy**
- Left: logo/name — links to `/`.
- Center: "← Back to work" standalone link (7.5) linking to `/#work`. **Not shown on 404** (link would be broken semantics; center empty on 404).
- Right: language toggle · primary CTA button "Book a Chat" (opens Calendly directly in new tab per App Flow 2.1 decision).

Same dimensions and glass treatment as Variant A.

### 7.20 Footer

**Anatomy** (grid, `grid-cols-2 md:grid-cols-4`):
- Column 1: logo/name + one-line tagline (`text-sm`, `text-secondary`).
- Column 2: heading "Links" (`text-sm` weight 600) + list of anchor links (Work, Skills, Contact) — `text-sm` `text-secondary`, hover `text-primary`.
- Column 3: heading "Elsewhere" + external links: GitHub, LinkedIn, email (mailto).
- Column 4: language toggle repeat + optional "built with" note (`text-sm`, `text-tertiary`).

**Style**: `bg-elevated`, `border-top: 1px solid border-subtle`. Padding `space-12 0` (48px vertical). Not glass.

### 7.21 Filter pill (skill filter indicator)

**Purpose**: When a skill is active as a timeline filter, this pill shows the current filter and allows clearing (per App Flow 4.5).

**Anatomy**: `filter` Lucide icon 14px + "Showing: [skill]" text + close icon-button (7.4, smaller: 24×24).

**Dimensions**: Height 32px, padding `space-1 space-3`, `radius-sm`, `accent-subtle-bg` background, 1px solid `accent`, `accent` text, `text-sm` weight 500.

**Position**: Directly above the timeline; sticky within the `#work` section only (`position: sticky`, `top: [header height + 16px]`) so the pill stays visible as the user reviews entries.

**Behavior**: Clicking the close button, pressing Esc while focus is anywhere in `#work`, or clicking the active skill again all clear the filter.

### 7.22 404 layout

**Anatomy** (centered, single column, max-width 480px):
1. Section eyebrow: `--404`.
2. H1: `text-4xl` "That page doesn't exist — but I do." (SR: equivalent — must be written, not translated literally).
3. Subtext: `text-lg`, `text-secondary`, one-line pitch.
4. Row of CTAs (stacks on mobile): primary "Back home" · secondary "Download resume" · ghost "Get in touch".
5. Uses Header Variant B (7.19) and Footer.

**Container**: fills viewport minus header + footer, content vertically centered.

### 7.23 Calendly loading placeholder

**Purpose**: Fills the embed's future dimensions until Calendly loads. Prevents CLS.

**Anatomy**: A `glass-strong` panel matching the eventual embed's dimensions (min-height `640px` desktop, `540px` mobile), containing centered `calendar` Lucide icon 32px + `text-sm` `text-secondary` "Loading calendar…".

**Failure state** (after 4s timeout — per App Flow 4.8): the icon changes to `external-link`, text becomes "Calendar blocked by your browser? Open it directly →" as an inline link (7.5 external style) below the icon.

### 7.24 Skip-to-content link

**Purpose**: Keyboard accessibility.

**Behavior**: Visible only on focus. First tab stop on every page. Links to `#main-content` (each page's main region must have this id).

**Style**: Position `absolute`, translate off-screen (`top: -100px`); on focus, `top: 16px`, `left: 16px`, `z-skip-link`. Styled as primary button (7.1) small size.

**Text**: "Skip to content" / "Preskoči na sadržaj".

---

## 8. Writing rules (enforced by components)

The design system dictates the *shape* of text; these rules dictate its *style*. Both apply to every string the agent writes and every string in the content files.

1. **Button labels**: sentence case, verb-led, max 3 words, no punctuation. "Download resume", "Book a chat", "Send message", "Copy email". Never: "SUBMIT", "Click here", "Learn more".
2. **Vocabulary consistency**: an action keeps the same name throughout the flow. The button "Send message" produces a confirmation "Message sent." Not "Submit" → "Received!"
3. **Voice**: first person ("I built…", "I led…"), plain verbs, no filler ("a passionate, results-driven engineer" is banned), no exclamations except in the resume-download toast.
4. **Error messages**: name the problem and the fix; interface's voice, not human's. "Enter a valid email address" ✓ / "Oops! Looks like that email isn't quite right :(" ✗.
5. **Empty states**: describe what to do next, not what's missing. "No case studies match — clear the filter to see all work" not "Nothing here."
6. **Labels label. Placeholders demonstrate.** Never use a placeholder to replace a label. Never use a helper text to demonstrate an example if the placeholder can.
7. **Metrics**: always with unit and direction. "-58% LCP" not "58% faster." "6% conversion lift" not "6% up."
8. **Dates**: locale-formatted. EN: "March 2024 – Present". SR: "Mart 2024 – Sada". Never dates in a mono font except in the timeline's date column.
9. **Never quote yourself.** The site is first-person; testimonials are the only third-party voice.

---

## 9. Bilingual considerations

### 9.1 Layout tolerance
Every component must render without layout breakage when its text content grows +35% (Serbian average vs. English). Test with sample-longest strings — never with placeholder Latin.

### 9.2 Font subsetting
Inter and JetBrains Mono must be loaded with the **Latin Extended** subset (contains: š, đ, č, ć, ž — full Serbian Latin). Verify with a build-time script that checks the WOFF2 for these glyphs.

### 9.3 Locale formatting
Dates, numbers, and any programmatic text formatting uses `Intl.DateTimeFormat` and `Intl.NumberFormat` with the active locale (`en-US` and `sr-Latn-RS`). Never hand-format dates.

### 9.4 lang attribute
`<html lang="en">` on first load. On language switch: JS updates `document.documentElement.lang = 'sr-Latn'`. Screen readers rely on this for pronunciation switching. This is not optional.

### 9.5 Translation dictionary shape
Two JSON files: `src/content/i18n/en.json`, `src/content/i18n/sr.json`. Identical key structure enforced by a build-time check that fails the build on missing keys. Never fall back to English silently in production — only in dev, with a console warning.

### 9.6 Content vs. UI strings
- **Content strings** (case-study body, timeline bullets, testimonials): in the content collection files, alongside their content, with `en` and `sr` fields per record.
- **UI strings** (button labels, form labels, errors, toast messages, 404 copy): in the two i18n JSON files above.
- Don't mix. Content goes with content; chrome goes with chrome.

---

## 10. Accessibility mandates (glass-specific overrides)

Glass morphism introduces contrast risk. These rules override aesthetic preference when they conflict.

1. **Text on glass**: any text sitting on a glass surface must be on `--color-surface-glass-strong` (opacity 0.72) or higher. `--color-surface-glass` (0.55) is only allowed for glass containers that don't hold text directly (e.g., a case-study card where the *inner* content sits on the glass but the primary contrast is provided by the screenshot area — verify per component).
2. **Verified contrast**: enforced in CI by Lighthouse's accessibility category, asserted at **100** on every page type (Implementation Plan §8.1). Lighthouse runs axe internally, so contrast, labels, landmarks, and ARIA misuse block the build. No exceptions. Limitation to be honest about: this only sees the default page state in the default language. Contrast on glass in the **SR** state and in the **form error** state is verified manually (Implementation Plan §8.4) — check both, because SR strings are ~35% longer and can push text onto a different part of a backdrop shape.
3. **Focus rings on glass**: focus rings must be `--color-accent` at full opacity (not a translucent variant). Verify visibility against every glass surface the ring might appear on.
4. **Backdrop-filter fallback**: `@supports not (backdrop-filter)` → glass surfaces become solid `--color-bg-elevated` with a `border-color: var(--color-border)`. Test in a browser with backdrop-filter disabled (Firefox with `layout.css.backdrop-filter.enabled` false).
5. **Reduced transparency preference**: respect `prefers-reduced-transparency` — treat identically to the backdrop-filter fallback (solid surfaces). All glass classes must include:
   ```css
   @media (prefers-reduced-transparency: reduce) {
     .glass, .glass-strong {
       background: var(--color-bg-elevated);
       backdrop-filter: none;
       border-color: var(--color-border);
     }
   }
   ```
6. **Focus visible everywhere**: never `outline: none` without a `:focus-visible` replacement. The base stylesheet establishes the ring; do not override it per component.
7. **Motion-triggered visual updates** (fade-in-once, filter dim) must still leave content readable and interactive at every point during the transition — no interaction-blocking states mid-animation.
8. **Keyboard operability**: every interactive element must be reachable via Tab in DOM order that matches visual order. Test on every screen. The Calendly embed's keyboard reachability is a known risk area — verify Tab enters and Escape exits.
9. **Semantic HTML**: `<header>`, `<nav>`, `<main id="main-content">`, `<footer>` landmarks on every page. Exactly one `<h1>` per page. Sequential heading levels — no skipping (h2 → h4 prohibited).
10. **Screen reader pass**: one manual VoiceOver or NVDA pass before launch (in both languages). The automated gate catches roughly a third of real issues, and this project has no e2e tests — so the manual pass carries more weight here than it would elsewhere. Do not skip it.

---

## 11. Testing checklist (build-time and pre-launch)

Automated (CI-enforced, blocks merge):

- [ ] `src/styles/base.css` matches Section 4.2 verbatim — every namespace wiped with `initial`, every token present.
- [ ] Lighthouse: Performance ≥95, **Accessibility 100**, Best Practices ≥95, SEO ≥95 (mobile, throttled) on every page type in both languages. This is the WCAG gate — there is no separate axe job.
- [ ] Vitest unit tests pass (`src/lib/` pure logic only — no component or browser tests exist in this project).
- [ ] i18n key parity: every key in `en.json` exists in `sr.json` and vice versa.
- [ ] Link check: every internal link and every PDF link resolves.
- [ ] No raw hex, no raw px in component code (regex lint).
- [ ] No `outline: none` without a `:focus-visible` companion (regex lint).
- [ ] No gradients anywhere — regex lint over `src/` and built `dist/` CSS for **both** spellings: the raw functions `linear-gradient` / `radial-gradient` / `conic-gradient`, and the v4 utility classes `bg-linear-` / `bg-radial` / `bg-conic`. See §4.4. In v4 this lint is the sole enforcement of Prohibition #1.

Manual (pre-launch):

- [ ] Every component visually verified in both EN and SR at 320, 375, 768, 1024, 1440.
- [ ] Every component visually verified with `prefers-reduced-motion`, `prefers-reduced-transparency`, and backdrop-filter disabled.
- [ ] VoiceOver pass on macOS Safari (EN and SR).
- [ ] Keyboard-only pass through Journeys 1–5 (App Flow §5) in both languages.
- [ ] Calendly load, Calendly-blocked, and form-endpoint-down states verified live.
- [ ] Real low-end Android device pass (not just DevTools throttling) for the sticky FAB, glass rendering, and mobile Calendly.

---

## 12. Reference — components-to-token mapping cheat sheet

**Utility names stutter where a token name repeats its namespace.** Tailwind builds a colour utility as `<property>-<token name minus the --color- prefix>`. Since several tokens in §3.1 are themselves named `text-*`, `bg-*`, or `border-*`, the resulting class doubles the word:

| Token | Text colour | Background | Border |
|---|---|---|---|
| `--color-text-primary` | `text-text-primary` | — | — |
| `--color-text-inverse` | `text-text-inverse` | — | — |
| `--color-bg-elevated` | — | `bg-bg-elevated` | — |
| `--color-border-subtle` | — | — | `border-border-subtle` |
| `--color-accent` | `text-accent` | `bg-accent` | `border-accent` |

This is cosmetic, not a bug, and it was true of the v3 config too. The table below uses the **real** class names. Verified by build probe, not by assumption.


| Component | Primary tokens |
|---|---|
| Button (Primary) | `bg-accent`, `text-text-inverse`, `rounded-md`, `text-base` |
| Button (Secondary) | `border-border`, `text-text-primary`, `rounded-md`, `text-base` |
| Text input | `bg-bg-elevated`, `border-border`, `text-text-primary`, `rounded-sm`, `text-base` |
| Toast | `glass-strong`, `shadow-toast`, `text-sm`, `rounded-md` |
| Case study card | `glass`, `shadow-glass`, `rounded-lg`, `text-xl` (title), `text-metric` (metrics) |
| Testimonial card | `bg-bg-elevated`, `border-border`, `rounded-lg`, `text-xl` (quote) |
| Tag / skill | `bg-bg-elevated`, `border-border-subtle`, `rounded-sm`, `text-mono-sm` |
| Section eyebrow | `text-mono-sm`, `text-text-tertiary` |
| Section H2 | `text-2xl` mobile / `text-3xl` md, `font-semibold`, `text-text-primary` |
| Header (both) | `glass`, sticky, `z-sticky`, height 64/72 |
| Footer | `bg-bg-elevated`, `border-t border-border-subtle` |
| FAB | `bg-accent`, `text-text-inverse`, `rounded-full`, `shadow-glass-hover`, `z-sticky` |
| Language toggle | `bg-bg-elevated`, `border-border-subtle`, `rounded-full`, `text-mono-sm` |
| Filter pill | `bg-accent-subtle-bg`, `border-accent text-accent`, `rounded-sm`, `text-sm` |
