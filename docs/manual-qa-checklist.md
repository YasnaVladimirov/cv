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
| N.9 | JavaScript disabled | see below | **not yet walked** |

### N.9 — JavaScript off, by hand

Chrome DevTools → Command palette → "Disable JavaScript", then reload:

- [ ] Full page renders in English; all content present and Ctrl+F-findable
- [ ] Timeline fully expanded; every skill plain text, none focusable
- [ ] Language toggle does nothing (acceptable — documented consequence)
- [ ] Resume link still downloads, no toast
- [ ] Calendly placeholder replaced by a plain "Book a chat" link
- [ ] Contact form posts natively and lands on the provider's confirmation page
- [ ] Footer, mailto and all internal links work

---

## Keyboard operability

Lighthouse does not test this at all.

- [ ] Tab from a fresh load: **first** stop is "Skip to content"
- [ ] Activating it moves focus into `<main>`
- [ ] Every interactive element is reachable, in visual order
- [ ] The focus ring is visible on every one — 2px accent, 2px offset, never suppressed
- [ ] Case-study card is a **single** tab stop
- [ ] Skill buttons reachable; Enter and Space both activate
- [ ] Esc inside `#work` clears the filter
- [ ] Toast close button reachable while the toast is up
- [ ] No keyboard trap anywhere; no positive `tabindex`

## Reduced motion / reduced transparency

Set at OS level, not just in DevTools.

- [ ] `prefers-reduced-motion` — anchor navigation jumps instantly (0ms, not merely faster)
- [ ] Filter transition instant; toast appears without sliding
- [ ] Availability badge dot stops pulsing
- [ ] `prefers-reduced-transparency` — glass panels become solid `bg-elevated`; backdrop shapes disappear

---

## Cross-browser (§8.5)

| Browser | Check | Status |
|---|---|---|
| Chrome | full walk | pass (Chromium 1200) |
| Firefox | glass renders | **[HUMAN]** |
| Firefox | `about:config` → `layout.css.backdrop-filter.enabled=false` → solid fallback per §10.4 | **[HUMAN]** |
| Safari | `scroll-margin-top` — content must not land under the sticky header | **[HUMAN]** |
| Safari | `-webkit-backdrop-filter` on all glass surfaces | **[HUMAN]** — `verify:css` proves both spellings survive the build |
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
