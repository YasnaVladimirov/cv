# Manual QA checklist

**Companion to** the Implementation Plan (§8.4–8.7) and the App Flow's cross-cutting state matrix (§6).
**Last walked:** 2026-08-29, Phase 8.4, against `pnpm dev` on Chromium 1200 · desktop 1280×900 and mobile 375×780.

---

## Why this document exists

There is no automated end-to-end testing in this project — removed by decision on 2026-08-24, and it is not coming back. Lighthouse's `accessibility = 1` assertion is the **only** automated WCAG gate, and it runs axe against a page in its default state. It cannot see:

- the Serbian state, which is applied client-side after load
- the form's error state, which needs a submit
- the filtered-timeline state, which needs a click
- keyboard operability of anything

Those are the four things this checklist exists for. Walk it in **both languages** before every launch, and after any change to an interactive system.

**A green CI run is not a substitute for this document.**

---

## How to run it

```bash
pnpm build && pnpm preview     # or pnpm dev
```

Then walk each journey below. `?lang=sr` loads any page directly in Serbian without touching the toggle — the pre-paint script reads it (`src/scripts/apply-language.js`).

---

## Journey 1 — Recruiter, 20 seconds

| # | Check | Expected | 2026-08-29 |
|---|---|---|---|
| 1.1 | Hero shows name, title line, value prop, two CTAs | above the fold at 375px | pass |
| 1.2 | "Download resume" href | `/cv.pdf`, with `download` | pass |
| 1.3 | Click it | PDF downloads **and** toast appears | pass |
| 1.4 | Toast semantics | `role="status"`, `aria-live="polite"` | pass |
| 1.5 | Toast does not steal focus | focus stays where it was | pass |
| 1.6 | Toast auto-dismisses | gone by ~3s | pass |
| 1.7 | Hover or focus the toast | timer pauses, full duration restarts on leave | pass |
| 1.8 | Toast link | dismisses toast, smooth-scrolls to `#contact` | pass |
| 1.9 | Same in Serbian | toast text in SR, href `/cv-sr.pdf` | pass |

## Journey 2 — Hiring manager, 4 minutes

| # | Check | Expected | 2026-08-29 |
|---|---|---|---|
| 2.1 | Click a header nav link | smooth scroll; section top lands at header + 16px | pass — 88px |
| 2.2 | Scrollspy | active link gets `aria-current="true"` and the accent underline | pass |
| 2.3 | Focus after anchor nav | moves to the section's `h2` | pass — `work-heading` |
| 2.4 | Hash | updates via `replaceState`; Back leaves the site | pass |
| 2.5 | Above `#work` | no link active, hash cleared | pass |
| 2.6 | Click a skill with matches | timeline filters, pill appears | pass — 3 match / 1 out |
| 2.7 | Non-matching entries | dim to 0.35, stay in place at full height | pass |
| 2.8 | Matching entries | 2px accent left border | pass |
| 2.9 | Skill with **no** matches | plain text, not focusable, no hover affordance | pass — 3 of 21 |
| 2.10 | Clear via pill ✕, Esc inside `#work`, or the active skill again | all three clear | pass |
| 2.11 | Esc **outside** `#work` | does nothing | pass |
| 2.12 | Filter pill while scrolling the timeline | sticks below the header, covers the line beneath it cleanly | pass |
| 2.13 | Open a case study | body renders with a `--kebab` eyebrow above every section | pass — 7 eyebrows |
| 2.14 | Prev/next | present with 3 published; **absent** when only 1 | pass (1-study state: publish one fixture to re-check) |
| 2.15 | Bottom CTA and header CTA | Calendly, `target="_blank"`, `rel="noopener"` | pass |
| 2.16 | "Back to work" | lands on `/#work` | pass |

## Journey 3 — Executive, mobile, 45 seconds

Viewport 375×780.

| # | Check | Expected | 2026-08-29 |
|---|---|---|---|
| 3.1 | At the hero | FAB hidden — `opacity: 0`, `aria-hidden="true"`, `tabindex="-1"` | pass |
| 3.2 | Scrolled past the hero | FAB visible, 48px tall, `aria-hidden="false"` | pass |
| 3.3 | Tap the FAB | lands at `#contact` | pass |
| 3.4 | While `#contact` is in view | FAB hidden | pass |
| 3.5 | Focus any text field | FAB hidden (mobile keyboard collision) | pass |
| 3.6 | Blur, scroll back up | FAB returns | pass |
| 3.7 | Hero CTAs | stacked, ≥44px tall | pass — 44px |
| 3.8 | No horizontal scroll | at 320, 375, 768, 1024, 1440 | pass |

## Journey 4 — Serbian evaluator

| # | Check | Expected | 2026-08-29 |
|---|---|---|---|
| 4.1 | Toggle to SR | every visible string swaps | pass — 0 EN visible, 86 SR |
| 4.2 | Scroll position | held, no jump | pass |
| 4.3 | `<html lang>` | `sr-Latn` | pass |
| 4.4 | `localStorage.lang` | `sr-Latn` | pass |
| 4.5 | Resume CTA | `/cv-sr.pdf` | pass |
| 4.6 | Reload | SR renders with **no flash of English** | pass |
| 4.7 | Navigate to a case study | still SR, including body and prev/next | pass |
| 4.8 | Case study body | Serbian block shown, English block hidden | pass |
| 4.9 | Clear `localStorage` and reload | back to English | pass |
| 4.10 | Serbian diacritics | š đ č ć ž render in both fonts | pass — `verify:fonts` |

## Journey 5 — Lost visitor

| # | Check | Expected | 2026-08-29 |
|---|---|---|---|
| 5.1 | Any unknown path | 404 status, mini-pitch layout | pass |
| 5.2 | Header | variant B **without** "Back to work" | pass |
| 5.3 | Three CTAs | Back home `/`, Download resume, Get in touch `/#contact` | pass |
| 5.4 | Resume CTA here | fires the toast too | pass |
| 5.5 | Toast link on the 404 | `/#contact`, a real navigation | pass |
| 5.6 | `noindex` | present | pass |
| 5.7 | In Serbian | full swap, SR PDF | pass |

---

## Negative paths

| # | Check | Expected | 2026-08-29 |
|---|---|---|---|
| N.1 | Submit the form empty | inline errors, focus to the error summary, nothing sent | pass |
| N.2 | Submit with the honeypot filled | success shown, **no request made** | pass |
| N.3 | Submit within 3s of load | success shown, no request made | pass |
| N.4 | Valid submit | POST carries `access_key`, and **not** the honeypot field | pass |
| N.5 | Endpoint returns 500 | error block, entered content preserved, mailto visible | pass |
| N.6 | No endpoint configured | same error block — never a false success | pass |
| N.7 | Calendly script blocked | 4s timeout → explanatory line + direct link | pass — 4046ms |
| N.8 | Calendly widget never mounts | same fallback | pass |
| N.9 | JavaScript disabled | see below | pass, from the served HTML |

### N.9 — JavaScript off

Verified by reading the served HTML directly, which is exactly what a
JS-disabled browser gets. Re-check by hand in DevTools → Command palette →
"Disable JavaScript" before launch.

| Check | Expected | 2026-08-29 |
|---|---|---|
| Timeline fully in the HTML | all entries, all bullets, nothing hidden | pass — 4 entries, 10 bullets |
| Every skill plain text | `<span>`, none focusable | pass — 21 spans, 0 buttons |
| Language toggle | **hidden** — App Flow §2.3 | pass, after the fix below |
| Resume link | downloads, no toast | pass — `download` present |
| Calendly | `<noscript>` link replaces the placeholder | pass |
| Contact form | posts natively, carrying `access_key` and the honeypot | pass |
| mailto and internal links | work | pass — 2 mailto, 6 case-study links |

**Fixed during this walk.** The language toggle was rendering with JS off.
Astro server-renders islands, so the button was in the HTML, looked live, and
did nothing when pressed. App Flow §2.3 puts the no-JS state at "the toggle
does not render", so a `<noscript>` rule now hides it — a dead control is
worse than no control.

---

## Keyboard operability

Lighthouse does not test this at all.

| # | Check | 2026-08-29 |
|---|---|---|
| K.1 | First Tab stop is "Skip to content" | pass |
| K.2 | Focus ring visible — 2px solid accent, 2px offset | pass |
| K.3 | `:focus { outline: none }` is paired with a `:focus-visible` ring | pass — enforced by `verify:values` |
| K.4 | No positive `tabindex` anywhere | pass — none |
| K.5 | Tab order follows visual order | pass — skip → name → toggle → CTA → hero CTAs → timeline → cards → skills |
| K.6 | Case-study card is a **single** tab stop | pass — one `<a>`, eyebrow `aria-hidden` |
| K.7 | Card's accessible name is title + outcome | pass |
| K.8 | Esc inside `#work` clears the filter | pass |
| K.9 | Skip link activates into `<main>` | **[HUMAN]** — needs a real key press |
| K.10 | Enter and Space both activate a skill button | **[HUMAN]** |
| K.11 | Toast close button reachable while up | **[HUMAN]** |
| K.12 | No keyboard trap anywhere | **[HUMAN]** |

## Reduced motion / reduced transparency

Set at OS level, not just in DevTools.

| # | Check | 2026-08-29 |
|---|---|---|
| M.1 | `prefers-reduced-motion` — anchor navigation jumps instantly, 0ms not merely faster | pass — forced via matchMedia, landed at 88px in one frame |
| M.2 | Global rule flattens transitions and animations | pass — present in base.css |
| M.3 | `@supports not (backdrop-filter)` → `.glass, .glass-strong` solid | pass — rule present |
| M.4 | `prefers-reduced-transparency` → `.glass, .glass-strong` solid | pass — rule present |
| M.5 | `prefers-reduced-transparency` → backdrop shapes removed | pass — rule present |
| M.6 | The above verified at OS level, not just in the cascade | **[HUMAN]** |
| M.7 | Availability badge dot stops pulsing | **[HUMAN]** — badge is disabled until Phase 9 |

---

## Cross-browser (§8.5)

**Findings, 2026-08-29.** Only Chromium was driveable from the build environment,
so Firefox and Safari remain open. Two of the three risk areas are structurally
guaranteed rather than browser-tested, and it is worth being precise about the
difference:

- **`-webkit-backdrop-filter` survives the build.** `verify:css` reads `dist/`
  and fails if either spelling is missing — added in Phase 3 after the CSS
  minifier silently dropped the prefixed one, which would have removed the
  blur on Safari 16.4–17 with no error anywhere. That proves the declaration
  ships. It does **not** prove Safari renders it; only Safari does.
- **Both glass fallbacks are in the cascade**, confirmed by reading the live
  stylesheet: `@supports not (backdrop-filter: blur(1px))` and
  `@media (prefers-reduced-transparency: reduce)`, each targeting
  `.glass, .glass-strong`, plus a third removing the backdrop shapes. The
  Firefox check below is what confirms the first one actually takes effect.
- **`scroll-margin-top` lands correctly in Chromium** — every anchor stops the
  section top at exactly 88px, header + 16px per §5.5. Safari is the one to
  re-check, since this is where content most often ends up under a sticky
  header.



| Browser | Check | Status |
|---|---|---|
| Chrome | full walk | pass (Chromium 1200) |
| Firefox | glass renders | **[HUMAN]** |
| Firefox | `about:config` → `layout.css.backdrop-filter.enabled=false` → solid fallback per §10.4 | **[HUMAN]** |
| Safari | `scroll-margin-top` — content must not land under the sticky header | **[HUMAN]** |
| Safari | `-webkit-backdrop-filter` on all glass surfaces | **[HUMAN]** — `verify:css` proves both spellings survive the build, but only a real Safari proves it renders |
| All | OS-level reduced motion / transparency actually change behaviour | **[HUMAN]** |

## Real devices (§8.6) — [HUMAN]

- [ ] Low-end Android: glass rendering, FAB, Calendly, form submission
- [ ] iOS Safari: same
- [ ] **LinkedIn in-app browser** — this is where Journey 3 actually happens

## Screen reader (§8.7) — [HUMAN]

VoiceOver (macOS) or NVDA (Windows), in both languages. With `<html lang="sr-Latn">` a Serbian voice should be selected if installed.

- [ ] Landmarks announced: banner, main, contentinfo
- [ ] Heading outline reads sensibly: one `h1`, `h2` per section, `h3` per entry
- [ ] Section eyebrows are **not** announced (`aria-hidden` — they restate the heading)
- [ ] Language toggle announces the action and its pressed state
- [ ] Skill buttons announce pressed state when a filter is applied
- [ ] Form errors announced on submit; focus lands on the summary
- [ ] Toast announced politely, without interrupting
- [ ] Case-study card announces as one link with a meaningful name
