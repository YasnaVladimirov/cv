# App Flow Document
## Personal CV & Portfolio Website — Mid-Level Frontend Engineer

| | |
|---|---|
| **Document status** | v1.0 |
| **Companion to** | PRD v1.0 (prd-portfolio-website.md) |
| **Scope** | Every screen, state, and transition in V1. The PRD's section list is exhaustive — nothing exists outside this map. |

---

## 1. Application Map — Complete Screen Inventory

The application consists of exactly **three screen types**. There are no other pages.

```
┌─────────────────────────────────────────────────────────────┐
│  S1  HOME  /                                                │
│      One page, seven sections, anchor-navigated             │
│      ├── #hero                                              │
│      ├── #proof        (logo strip — launch state)          │
│      ├── #work         (timeline, fully expanded)           │
│      ├── #case-studies (1..3 cards; see 4.3 for 1-card)     │
│      ├── #skills       (matrix w/ timeline filtering)       │
│      ├── #testimonials (DEFERRED at launch — see 4.4)       │
│      └── #contact      (Calendly embed + form + mailto)     │
│                                                             │
│  S2  CASE STUDY  /work/[slug]                               │
│      Reduced header · prev/next footer nav                  │
│                                                             │
│  S3  NOT FOUND  /404                                        │
│      Mini-pitch variant (message + resume + contact)        │
└─────────────────────────────────────────────────────────────┘
```

Language (EN/SR) is **not** a separate screen: every screen above exists in both languages via the in-place toggle (PRD FR-6). Every state documented below must render correctly in both.

---

## 2. Global Elements (present on every screen)

### 2.1 Header — two variants

**Variant A — Home header (S1)**

| Zone | Desktop (≥1024px) | Mobile (<768px) |
|---|---|---|
| Left | Logo/name | Logo/name |
| Center | Anchor links: Work · Skills · Contact, with **scrollspy** (active section highlighted as it enters view) | — (no hamburger; the page itself is the navigation) |
| Right | EN/SR toggle · primary CTA button "Book a Chat" | EN/SR toggle · "Contact" button |

Behaviors:
- Header is sticky at all times.
- **Logo click on Home** → smooth-scroll to top (no reload).
- Anchor links → smooth-scroll to section; scrollspy updates; URL hash updates (`/#work`) so a reload or share lands at the same section.
- Header "Book a Chat" / mobile "Contact" → smooth-scroll to `#contact` (never direct-opens Calendly — channel choice is preserved).
- Scrollspy states: exactly one anchor highlighted; between sections the last-entered section stays active; above `#work`, none highlighted.
- Reduced motion (`prefers-reduced-motion`) → all smooth-scrolls become instant jumps; scrollspy still updates.

**Variant B — Case study header (S2, S3)**

| Zone | All breakpoints |
|---|---|
| Left | Logo/name → links to `/` (full navigation, lands at top) |
| Center | "← Back to work" → links to `/#work` |
| Right | EN/SR toggle · "Book a Chat" button → **opens Calendly directly in a new tab** (per decision #9, the case-study context is high-intent; the home contact section is a click away via Back) |

No anchor links, no scrollspy — the reader stays in the reading flow.

### 2.2 Sticky Contact CTA (S1 only)

- Hidden while `#hero` is in view. Appears (slide/fade in; instant if reduced-motion) once the visitor scrolls past the hero.
- Tap/click → smooth-scroll to `#contact`.
- **Disappears when `#contact` is in view** (never point at where the user already is).
- Mobile: floating button, bottom-right, 56px, never overlapping form inputs when keyboard is open (hide while any form field is focused).

### 2.3 Language Toggle (all screens)

- Compact "EN / SR", both labels always visible, active one emphasized. In header on every screen; repeated in footer.
- On tap: all strings swap in place, `lang` attribute flips, scroll position preserved, choice saved to localStorage, `lang_switch` event fires.
- Applies to: body copy, nav labels, CTAs, form labels + errors + confirmations, 404 content, alt text, dates, and the resume link target (`cv.pdf` ↔ `cv-sr.pdf`).
- Return visit: stored language applied before first paint — no flash of English for a Serbian returner.
- localStorage unavailable → toggle works per-session, silently non-persistent.
- JS failed/disabled → toggle not rendered; site is English (accepted per PRD FR-6).

### 2.4 Footer (S1, S2; abbreviated on S3)

GitHub · LinkedIn · email (`mailto:`) · EN/SR toggle · optional "built with" note.
**All external links throughout the site (GitHub, LinkedIn, live project links inside case studies) open in a new tab** with `rel="noopener"`. `mailto:` and PDF downloads behave natively (same tab).

### 2.5 Resume Download Feedback (global behavior)

Everywhere a resume CTA exists (hero, 404, footer if added):
1. Click → download begins natively (plain `<a download>` — works without JS).
2. **Visible acknowledgment** (decision #18): a small toast/inline confirmation appears for ~3s — EN: "Resume downloading — talk soon?" / SR equivalent — with a subtle link to `#contact`. Progressive enhancement: if JS is unavailable, the native browser download UI is the only feedback, which is acceptable.
3. `resume_download` event fires with a `lang` property.
4. Toast is `aria-live="polite"`, auto-dismisses, never traps focus, never stacks (rapid double-click → one toast, one download).

---

## 3. Navigation Graph — every transition

```
                    ┌──────────────────────────────────────────┐
                    │                EXTERNAL                  │
                    │  LinkedIn · applications · direct link   │
                    │  · Google (branded search) · shared      │
                    │  case-study links                        │
                    └───────┬──────────────────┬───────────────┘
                            │                  │
                            ▼                  ▼
   ┌─────────────── S1 HOME (/) ────────┐   S2 CASE STUDY (/work/slug)
   │ hero ⇄ work ⇄ case ⇄ skills ⇄ ...  │   │  ▲
   │  │        │      │            │    │   │  │ prev/next between
   │  │        │      └─ card ─────┼────┼──▶│  │ case studies
   │  │        │                   │    │   │  ▼
   │  │  skill click filters       │    │   ├─ "← Back to work" ─▶ /#work
   │  │  timeline (in place)       │    │   ├─ logo ─▶ / (top)
   │  │                            │    │   ├─ header CTA ─▶ Calendly (new tab)
   │  └─ CTAs scroll to #contact ◀─┘    │   └─ bottom CTA ─▶ Calendly (new tab)
   │        │                           │
   │        ├─▶ Calendly booking (embed)│   S3 404 (any bad URL)
   │        ├─▶ form submit             │   ├─ home CTA ─▶ /
   │        └─▶ mailto (native)         │   ├─ resume ─▶ PDF + toast
   │                                    │   └─ contact ─▶ /#contact
   └────────────────────────────────────┘
   Any dead /work/ slug ─────────────────▶ S3
```

**Transition rules (exhaustive):**

| From | Trigger | To | Type |
|---|---|---|---|
| Anywhere on S1 | Header anchor / scrollspy nav | Section on S1 | Smooth-scroll, hash updates |
| S1 hero | "Download Resume" | — (stays) | Native download + toast |
| S1 hero | "Book a Chat" | `#contact` | Smooth-scroll |
| S1 sticky CTA | Tap | `#contact` | Smooth-scroll |
| S1 case-study card | Click anywhere on card | S2 | Full navigation |
| S1 timeline entry | "Read case study →" link (flagship roles only) | S2 | Full navigation |
| S1 skill (with matches) | Click | — (stays) | Timeline filters in place |
| S2 | "← Back to work" | `/#work` | Full navigation, lands at section |
| S2 | Logo | `/` top | Full navigation |
| S2 | Prev/Next | Adjacent S2 | Full navigation; hidden if only one case study exists |
| S2 header/bottom CTA | Click | Calendly | **New tab** |
| S2/S1 | External links (GitHub, LinkedIn, live demos) | External | **New tab** |
| Any URL not matching S1/S2 | — | S3 | Server-rendered 404 |
| S3 | Home / resume / contact CTAs | S1 / download / `/#contact` | Navigation / download |
| Any screen | EN/SR toggle | Same screen, same scroll | In-place swap |
| Browser back after anchor scrolls | Back button | Previous hash position | Native history — hash updates use `history.pushState`-compatible behavior so Back walks section history sanely; if this proves annoying in testing, switch to `replaceState` (Back exits the site) — flag as a build-time decision, default `replaceState` |

Dead ends: **none permitted.** Every screen, including 404 and every error state, contains at least one contact-path CTA.

---

## 4. Screen-by-Screen Specification with All States

### 4.1 S1 — Home: section order & scroll narrative

Order (top → bottom): hero → proof strip → work timeline → case studies → skills → *(testimonials, post-launch)* → contact → footer.
Narrative logic: credibility (proof) is borrowed *before* attention is spent (timeline); evidence (case studies) precedes claims (skills); everything funnels downward to contact. The sticky CTA exists because Flow-C visitors (executives on mobile) won't scroll that far.

### 4.2 Hero — states

| State | Behavior |
|---|---|
| Default | Name, title line, value prop, availability badge (if enabled), CTAs: "Download Resume" + "Book a Chat" |
| Resume clicked | Download + toast (2.5) |
| "Book a Chat" clicked | Smooth-scroll to `#contact` |
| SR active | All strings + CV target swapped |
| 320px width | CTAs stacked, ≥44px targets |
| No JS | Both CTAs fully functional (`<a>` elements); no toast |

No loading state: content is static HTML, rendered immediately. **No skeletons anywhere on the site** (decision #16) — the only loading placeholder that exists belongs to the Calendly embed (4.8).

### 4.3 Case Studies section — content-count states *(launch reality: possibly one)*

| Count | Layout |
|---|---|
| **1 (probable launch state)** | Single full-width "featured" card: larger imagery, 2–3 metric callouts, reads as *deliberate spotlight*, not as a grid missing members. Section heading: "Featured work" (singular-friendly), never "Case studies (1)". Prev/next on S2 hidden. |
| 2 | Two half-width cards, equal weight |
| 3 | Three-card grid (desktop) / vertical stack (mobile) |
| 0 | **Not a permitted launch state.** If zero are ready, the section is removed entirely and timeline bullets carry the evidence load. Build the section conditionally so removal is config, not surgery. |

Card anatomy: title · one-line outcome with metric · stack tags · whole card is one link (single tab stop, `<a>` wrapping, no nested links inside).

### 4.4 Testimonials — launch state: ABSENT

Decision #11: no named quotes at launch. The section **does not render** — no "coming soon", no empty frame. The logo/proof strip near the hero carries all social proof. When 2+ quotes with permission exist, the section appears between skills and contact via a content-file change (no code change). This document treats its post-launch anatomy per PRD FR-4.

### 4.5 Work timeline — states

| State | Behavior |
|---|---|
| Default | All entries fully visible and expanded — no accordions, nothing hidden (decision #7). Ctrl+F finds everything. |
| Filtered (via skill click) | Non-matching entries dim + collapse vertically (animated; instant under reduced-motion). A filter pill appears above the timeline: "Showing: React ✕". Clearing (✕, clicking the active skill again, or Esc) restores all. |
| Filtered + zero visual results | **Cannot occur**: skills with no timeline matches are not clickable (4.6). |
| SR active | All entries swap; dates reformatted per locale |
| No JS | Full timeline visible; filtering simply unavailable |

### 4.6 Skill matrix — states

| State | Behavior |
|---|---|
| Default | Categorized text lists, all rendered in HTML |
| Skill **with** timeline matches | Rendered as a button: hover/focus shows affordance ("filter timeline"); click activates filter + scrolls timeline's top edge into view if off-screen |
| Skill **without** timeline matches | Rendered as plain text — not focusable, no hover affordance, no cursor change. The zero-result state is designed out of existence (decision #12). |
| One filter active, another skill clicked | Filter replaces (single-select), pill updates |
| No JS | Plain categorized lists; every skill is plain text |

### 4.7 Contact section — the three channels, all states

Layout: heading + one-line invitation → Calendly embed (primary) → short form → mailto line ("Prefer plain email? →"). One-line privacy note under the form.

**Form states (validation on submit only — decision #15):**

| State | Behavior |
|---|---|
| Default | Name, email, message, optional company; honeypot hidden field |
| Typing | No validation feedback of any kind until submit |
| Submit → invalid | Submission blocked client-side; each invalid field gets inline error below it; summary announced via `aria-live`; focus moves to first invalid field; entered content preserved |
| Submit → valid, in flight | Button disabled + label "Sending…"; duplicate submits impossible |
| **Success** | Form is replaced in place by a confirmation block (decision #17): "Thanks — I'll reply within 24 hours." + a secondary line "Prefer to skip the wait? Book a slot above." `form_submit_success` fires. No route change. |
| **Endpoint failure** | Form remains with content intact; error block above button: "Something broke on my end — email me directly instead:" + prominent mailto. `form_submit_error` fires. |
| Spam-trap triggered | Silently accepted client-side (bot sees success), discarded server-side |
| SR active | Labels, errors, confirmation all in Serbian |
| No JS | Form posts natively to the form-service endpoint; service's hosted confirmation page is the fallback success state |

### 4.8 Calendly embed — states

| State | Behavior |
|---|---|
| Pre-load | Embed lazy-loads on approach (IntersectionObserver). Placeholder: fixed-height framed area with "Loading calendar…" — **the one loading placeholder in the app**; fixed height prevents CLS. |
| Loaded | Inline booking; keyboard-reachable and escapable |
| **Load failure / blocked** (tracker blockers — common) | After timeout (~4s) placeholder swaps to explanatory line (decision #13): "Calendar blocked by your browser? Open it directly →" + button to Calendly in new tab. `calendly_open` fires on that click. |
| Booking completed | Calendly's native confirmation inside the embed (decision #17 — nothing custom layered on). `calendly_booked` captured via UTM/webhook where available. |
| No JS | Static "Book a call →" link to Calendly (new tab) renders in place of the embed |

### 4.9 S2 — Case study page

Anatomy: reduced header (2.1B) → title + one-line outcome → context/problem/role/approach → outcome metrics block → stack list → "what I'd do differently" → **bottom CTA: "Want to talk about work like this? Book a chat →" (direct to Calendly, new tab)** → prev/next footer nav (hidden when only one case study exists) → footer.

| State | Behavior |
|---|---|
| Default | Full article, static HTML |
| Images | Explicit dimensions (no CLS); meaningful alt text in active language |
| Only one case study exists | Prev/next block hidden entirely — not disabled arrows |
| SR active | Full swap incl. metric labels; if a translation lags, inline labeled fallback per PRD FR-2 edge case |
| Bad slug | Server-rendered S3, no client-side redirect flicker |

### 4.10 S3 — 404 page (mini-pitch variant, decision #14)

Anatomy: short human message ("That page doesn't exist — but I do.") → one-line value prop → three CTAs: "Back to home" · "Download resume" (with toast) · "Get in touch" (`/#contact`) → abbreviated footer. Reduced header (Variant B, minus "Back to work"). Fully bilingual. Rationale: a mislinked recruiter is still a recruiter — the 404 is a conversion surface, not an apology.

---

## 5. End-to-End User Journeys (happy + unhappy paths)

### Journey 1 — Recruiter, desktop, 20 seconds
```
Google "[name]" or link from application
  → S1 hero renders instantly (static HTML, no skeleton)
  → reads title line + value prop (0–8s)
  → clicks "Download Resume"
  → PDF downloads · toast: "Resume downloading — talk soon?"
  → EXIT (success) — or toast link → #contact → mailto
```
**Unhappy branch**: PDF link broken → prevented by CI link check (PRD); this state is designed to be unreachable, not handled.

### Journey 2 — Hiring manager, desktop, 4 minutes
```
S1 → hero (skims) → scrolls; scrollspy tracks position
  → proof strip (2s glance)
  → timeline: reads all entries (nothing to expand — all visible)
  → clicks flagship "Read case study →" → S2
  → reads full study → "what I'd do differently" (differentiator moment)
  → EITHER bottom CTA → Calendly new tab → books (Calendly-native confirmation)
  → OR prev/next → second study → same exit
  → OR "← Back to work" → /#work → continues → skills
      → clicks "TypeScript" → timeline filters, pill shown → clears via ✕
  → scrolls to #contact → books in embed OR submits form → inline confirmation
```
**Unhappy branches**:
- Calendly embed blocked → 4s timeout → "Open it directly →" → new tab → books. No dead end.
- Form endpoint down → error block + mailto → sends email. No dead end.
- Only 1 case study live → no prev/next shown; "Back to work" is the only continuation — timeline must carry remaining evidence.

### Journey 3 — Executive, mobile, 45 seconds
```
LinkedIn app in-app browser → S1 mobile
  → hero fills viewport: name, value prop, stacked CTAs
  → reads (0–15s) → scrolls one flick → sticky Contact FAB appears
  → taps FAB → smooth-scroll to #contact
  → taps a Calendly slot → books
  → (keyboard opens at any point → FAB hides while a field is focused)
```
**Unhappy branches**:
- In-app browsers throttle third-party embeds → fallback link path (4.8) is the expected path here, not the exception.
- Prefers email → mailto line is visible without scrolling past the embed on mobile (layout requirement: channel list must not push mailto below two viewport-heights of embed — cap embed height on mobile).

### Journey 4 — Serbian evaluator, either device
```
S1 (English default, first visit)
  → taps SR in header → full in-place swap, scroll preserved
  → proceeds as Journey 1/2/3 entirely in Serbian
  → resume CTA now serves cv-sr.pdf · form errors/confirmation in Serbian
  → returns next week → SR applied before first paint (localStorage)
```
**Unhappy branches**:
- localStorage blocked → SR for session only; next visit starts EN; toggle is one tap away — acceptable.
- A case-study translation lags → labeled "available in English" inline fallback (PRD FR-2); never a hidden or broken page.

### Journey 5 — Lost visitor
```
Mistyped/stale URL → S3 (404 mini-pitch)
  → "Back to home" → S1  |  "Download resume" → PDF + toast  |  "Get in touch" → /#contact
```

---

## 6. Cross-Cutting State Matrix

Every cell below must be verified before launch (feeds the PRD launch checklist).

| Surface | Empty state | Loading state | Error state | No-JS state | SR state |
|---|---|---|---|---|---|
| Hero | n/a (content always present) | none (static) | n/a | fully functional | full swap + SR PDF |
| Proof strip | If no logos cleared for use → omit strip entirely (config) | none | n/a | static | logos lang-neutral; alt text swaps |
| Timeline | Not permitted empty | none | n/a | visible, unfilterable | full swap, locale dates |
| Case-study section | 1-card spotlight layout; 0 → section removed | none | n/a | static links | full swap |
| Skill matrix | n/a | none | n/a | plain lists | labels swap |
| Testimonials | **Launch: section absent** | none | n/a | static | quotes marked as translated |
| Calendly | n/a | "Loading calendar…" fixed-height placeholder (only loader in app) | 4s timeout → explanatory line + direct link (new tab) | static link replaces embed | event language config; embed non-switching is labeled |
| Contact form | n/a | "Sending…" disabled button | inline error + mailto fallback; content preserved | native POST to form service | labels/errors/confirmation swap |
| Resume CTA (all) | n/a | n/a | CI-prevented | native download, no toast | serves cv-sr.pdf |
| S2 page | 0 studies → routes don't exist | none | bad slug → S3 | fully readable | swap or labeled EN fallback |
| S3 404 | n/a | none | n/a | fully functional | full swap |
| Toast | n/a | n/a | never blocks anything | absent | message swaps |

---

## 7. Interaction & Motion Rules

1. **Scroll behavior**: all in-page navigation uses smooth scroll; instant under `prefers-reduced-motion`. Scroll-margin on sections accounts for sticky header height (anchors never land content underneath the header).
2. **Focus management**: anchor navigation moves focus to the target section's heading (`tabindex="-1"`); form success moves focus to the confirmation; form error moves focus to first invalid field; toast never steals focus.
3. **Single-motion budget**: entrance animations (if any) are opacity/transform only, once, on first reveal — no scroll-jacking, no parallax (PRD out-of-scope #6 adjacent).
4. **Hash handling**: section hashes update on scrollspy via `replaceState` (default; see §3 table note) — Back exits the site rather than replaying scroll history.
5. **Filter interaction**: single-select; Esc clears; the filter pill is the visible system-status indicator (Nielsen #1) — filtering must never be invisible state.
6. **Tap targets**: ≥44px everywhere; card = one link = one tab stop.
7. **New-tab policy**: external destinations only (Calendly direct links, GitHub, LinkedIn, live demos). Internal navigation never opens new tabs.

---

## 8. Open Items Feeding the Build

1. **Case-study count at launch** — flow supports 1–3; confirm the real number two weeks before launch so the 1-card spotlight layout gets design attention if needed (it is the *probable* state, so design it first, not last).
2. **Testimonial trigger** — outreach for named quotes starts now (longest lead time, per PRD Appendix A #4); section ships dark until 2+ exist.
3. **Hash strategy** (`replaceState` default vs `pushState`) — decide in first build week after feel-testing Back-button behavior.
4. **Mobile Calendly height cap** — must be validated on a real device so the mailto option stays discoverable (Journey 3 requirement).
5. **Proof-strip logo permissions** — confirm which employers' logos can be shown; strip is config-removable if none clear.

---

## Appendix — Traceability to PRD

| Flow element | PRD source |
|---|---|
| Screen inventory (3 types) | §3.1 architecture |
| In-place language behavior | FR-6 |
| Contact channel states | FR-5 |
| Timeline/case-study states | FR-2 |
| Skill filtering constraints | FR-3 |
| Testimonials deferral | FR-4 edge case ("fewer than 2 → logo strip only") |
| No-skeleton rule | §5.1 static-first + decision #16 |
| All analytics events referenced | FR-7 |
| Motion/focus rules | §5.2 accessibility |
