# Product Requirements Document
## Personal CV & Portfolio Website — Mid-Level Frontend Engineer

| | |
|---|---|
| **Document status** | Draft v1.0 |
| **Owner** | [Your Name] |
| **Target launch** | 4–6 weeks from kickoff |
| **Languages** | English (default), Serbian (sr) |

---

## 1. Product Overview & Vision

### 1.1 Problem Statement

Recruiters and hiring managers spend an average of 6–10 seconds on an initial resume scan and rarely more than 60–90 seconds on a portfolio site. A static PDF resume cannot demonstrate frontend craft, fails to differentiate among hundreds of similar candidates, and creates friction between "I'm interested" and "let's talk" — the recruiter has to open their email client, compose a message, and wait.

For a frontend engineer specifically, the portfolio site *is* a work sample. A slow, inaccessible, or generic site actively harms candidacy; a fast, polished, thoughtfully built one is evidence of competence before a single word is read.

**The product**: a bilingual (EN/SR) personal website that lets a time-poor evaluator understand the candidate's value in under 60 seconds and convert interest into a scheduled conversation in under 3 clicks.

### 1.2 Target Personas

**P1 — The Recruiter (primary, highest volume)**
Sourcing or agency recruiter screening 50+ candidates per week, usually on desktop, often mid-task. Needs: instant role/seniority/stack confirmation, downloadable resume for their ATS, one-click contact. Tolerance for friction: near zero. Time on site: 15–45 seconds.

**P2 — The Hiring Manager (primary, highest intent)**
Engineering manager or tech lead evaluating whether the candidate can do the actual job. Reads case studies, judges the site's build quality itself (view-source is a real behavior), checks metrics and outcomes, not just responsibilities. Time on site: 2–5 minutes. This persona decides whether an interview happens.

**P3 — The Executive Decision-Maker (secondary)**
CTO/VP at a smaller company, or founder hiring directly. Skims for business impact ("reduced load time 40%," "shipped feature used by 200k users") and signals of ownership/communication. Often on mobile. Time on site: under 60 seconds.

**P4 — The Serbian-market evaluator (secondary)**
Local recruiter or hiring manager in Serbia/ex-Yu region who prefers or expects Serbian-language materials. Functionally identical to P1/P2 but requires full content parity in Serbian, including a Serbian-language resume PDF.

### 1.3 Business Goals

**Primary goal**: Maximize qualified inbound conversations — resume downloads, contact form submissions, and booked calls from people with hiring authority or influence.

**Secondary goals**:
1. Serve as a living work sample demonstrating frontend competence (performance, accessibility, code quality if open-sourced).
2. Rank for "[Your Name] + frontend developer" branded searches so the site is the first result recruiters find.
3. Reduce back-and-forth scheduling friction to zero via direct calendar booking.
4. Be maintainable by one person in under 1 hour/month (content updates must not require redeployment gymnastics).

### 1.4 Explicit Non-Goals

This is not a blog platform, a freelance lead-generation funnel, or a design showcase for its own sake. Every element must serve the hiring conversion path. (See Section 7 for the full out-of-scope list.)

---

## 2. Key Performance Indicators (KPIs)

### 2.1 North Star Metric

**Qualified contact events per month** = resume downloads + contact form submissions + Calendly bookings, deduplicated by session.

### 2.2 Metric Tree

| Metric | Target | Measurement | Why it matters |
|---|---|---|---|
| **CTA click-through rate** (hero CTA clicks / unique visitors) | ≥ 25% | Analytics event on both hero buttons | Validates value proposition clarity |
| **Resume download rate** | ≥ 15% of unique visitors | Download event | Recruiter-persona conversion |
| **Contact conversion rate** (form submits + bookings / unique visitors) | ≥ 5% | Form + Calendly events | The actual goal |
| **Calendly booking completion** | ≥ 50% of Calendly opens | Calendly webhook/UTM | Detects scheduling friction |
| **Bounce rate** | ≤ 55% | Analytics | Hero effectiveness proxy |
| **Median time to first CTA interaction** | ≤ 30s | Custom event timing | "60-second comprehension" check |
| **Scroll depth to case studies** | ≥ 40% of visitors reach section | Scroll events | Hiring-manager engagement |
| **Language switch usage** | Tracked, no target | Event on toggle | Validates SR investment |
| **Core Web Vitals pass rate** | 100% of field data "Good" | CrUX / PageSpeed Insights | Credibility as work sample |

### 2.3 Guardrail Metrics

Form spam rate below 20% of submissions (else add stronger protection), zero accessibility regressions (enforced in CI by Lighthouse accessibility = 100, which runs axe internally — see Implementation Plan v1.1), and error rate on form submission below 1%.

### 2.4 Measurement Notes

Use a privacy-friendly analytics tool (see Section 6) so no cookie consent banner is required — a consent modal is conversion friction and a poor first impression. Instrument every CTA, download, form submit, Calendly open, and language switch as named events from day one. Review monthly; iterate hero copy if CTA CTR is below target after ~200 visitors.

---

## 3. User Flow & Site Architecture

### 3.1 Architecture Decision: Single Page + Satellite Pages

**Assumption**: a single-page layout with anchor navigation, plus separate routes only where depth demands it. Rationale: all three personas are time-poor; a single scroll path controls the narrative and eliminates navigation decisions. Case studies get dedicated routes so they are individually linkable (in applications, LinkedIn, cover letters) and can carry their own metadata for sharing.

**Language model**: one set of URLs; language is a client-side toggle that swaps all text in place (see FR-6). There are no `/sr/` routes — a Serbian visitor and an English visitor share the same URL and the toggle switches the strings instantly, without a reload or navigation. English is the default on first visit; the choice persists across pages and return visits.

```
/                      → Single-page home (EN default; SR via in-place toggle)
/work/[slug]           → Individual case study pages (same toggle applies)
/cv.pdf, /cv-sr.pdf    → Resume downloads, one PDF per language
/404                   → Custom 404 with CTA back home
```

*Known trade-off (accepted)*: because the Serbian version has no URLs of its own, search engines index the site in English only, and a shared link always opens in the recipient's stored/default language rather than the sender's. Acceptable given the primary discovery path is direct links from applications and LinkedIn, not Serbian-language search.

### 3.2 Visual Hierarchy (top to bottom on home)

1. **Hero** — name, role, value proposition, dual CTA (Download Resume / Book a Chat), language toggle in header
2. **Social proof strip** — logos of companies worked with or 1-line testimonial (borrowed credibility before asking for attention)
3. **Work experience timeline** — reverse chronological, achievement-led, each role expandable or linking to a case study
4. **Featured case studies** — 2–3 cards with outcome metrics in the card itself
5. **Skill matrix** — categorized tech stack (see FR-3)
6. **Testimonials** — 2–4 full quotes with names, titles, photos
7. **Contact section** — embedded Calendly + fallback contact form + direct email link
8. **Footer** — GitHub, LinkedIn, email, language toggle repeat, "built with" note (optional flex)

### 3.3 Primary User Flows

**Flow A — Recruiter (15–45s):**
Land on hero → confirm role/stack from headline → click "Download Resume" → (optionally) skim timeline → leave or email. *Success: resume downloaded. Max clicks to resume: 1.*

**Flow B — Hiring Manager (2–5 min):**
Land → read hero → scroll timeline → open one case study → return → check skill matrix → scroll to contact → book via Calendly or submit form. *Success: booking. Max clicks to a booked slot: 3 (scroll → Calendly slot → confirm).*

**Flow C — Executive (mobile, <60s):**
Land on mobile → read value prop → tap sticky "Contact" → book or email. *Success: contact initiated without pinch-zooming or hunting.*

**Flow D — Serbian evaluator:**
Land on `/` (English) → tap the EN/SR toggle in the header → entire page swaps to Serbian in place, scroll position preserved → identical flow in Serbian → download Serbian CV (the resume CTA now serves `cv-sr.pdf`). *Success: full journey with zero English-only dead ends; choice remembered on return visits.*

### 3.4 Navigation Rules

Sticky header with anchor links (Work, Skills, Contact) + persistent primary CTA button. On mobile, header collapses to logo + CTA + menu. A floating/sticky contact CTA appears after the user scrolls past the hero. Language toggle (EN/SR) is always visible in the header; it swaps all on-page text in place — no reload, no navigation, scroll position preserved.

---

## 4. Functional Requirements

Priority key: **P0** = launch blocker, **P1** = should ship in V1, **P2** = fast-follow.

### FR-1: Hero Section — P0

**User story**: As a recruiter with 10 seconds, I want to immediately understand who this person is, what they do, and how to act on my interest, so I can decide without scrolling.

**Functional behavior**
- Above the fold on all breakpoints: name, title line ("Frontend Engineer — React/TypeScript" or similar), 1–2 sentence value proposition focused on outcomes, and two CTAs: primary "Download Resume" (direct PDF download, correct language version) and secondary "Book a Chat" (smooth-scrolls to contact section or opens Calendly directly).
- Resume download fires an analytics event and serves a filename like `firstname-lastname-frontend-engineer.pdf` (not `cv_final_v7.pdf`).
- Value proposition text is distinct per language, not machine-translated.
- Optional: subtle availability badge ("Open to opportunities · Vienna / Remote") — high-signal for recruiters.

**Edge cases**
- PDF fails to load / 404 → link must be validated in CI; downloads should never break silently.
- JavaScript disabled → CTAs are plain anchor/href elements; download and mailto work without JS.
- Very narrow screens (320px) → CTAs stack vertically, remain ≥44px tap targets.

### FR-2: Work Experience Timeline & Case Studies — P0

**User story**: As a hiring manager, I want to see what this candidate actually achieved (with numbers), not just where they sat, so I can judge fit for my team.

**Functional behavior**
- Reverse-chronological timeline: company, role, dates, location/remote, 2–4 achievement bullets each. Every bullet leads with an outcome and a metric where honest ("Cut LCP from 4.1s to 1.8s on the checkout flow, lifting conversion 6%").
- 2–3 flagship entries link to full case study pages using a consistent structure: **Context → Problem → My role → Approach → Outcome (metrics) → Stack → What I'd do differently**. The last section is a strong differentiator for senior evaluators.
- Case study pages include screenshots or short clips, are individually shareable with proper OG metadata, and include a bottom CTA ("Want to talk about work like this? → Book a chat").
- Timeline is fully rendered in HTML (no "load more" hiding content from crawlers or Ctrl+F).

**Edge cases**
- NDA-constrained work → describe problem shape and outcomes without confidential specifics; state "details under NDA, happy to discuss the approach live" — this converts a limitation into a CTA.
- Employment gaps → timeline displays dates honestly; no auto-generated gap markers.
- A case study exists in EN but SR translation lags → SR page shows the entry with an inline "available in English" link rather than hiding it (avoid dead ends, but never silently switch language without labeling).

### FR-3: Skill Matrix / Categorized Tech Stack — P1

**User story**: As a recruiter matching against a job spec, I want to scan the candidate's stack by category in seconds, so I can confirm keyword fit.

**Functional behavior**
- Skills grouped by category: Languages, Frameworks/Libraries, Styling, Testing, Tooling/Infra, Practices. Text-first and Ctrl+F-friendly — recruiters literally search the page for "TypeScript."
- "Interactive" is kept deliberately restrained: category filtering or hover detail (e.g., years used, related project link) is acceptable; skill-percentage bars and star ratings are explicitly banned (they communicate nothing and invite skepticism).
- Optionally, clicking a skill highlights or filters timeline entries where it was used — this is the one interaction that adds evaluative value.
- All skills render in initial HTML for SEO and scannability; interactivity is progressive enhancement only.

**Edge cases**
- JS disabled / crawler → full categorized list visible, no filtering required to see content.
- Long lists → cap at honest, defensible skills; every listed skill is fair game in an interview.

### FR-4: Testimonials / Social Proof — P1

**User story**: As an executive, I want third-party evidence that this person delivers and is good to work with, so I can trust the self-reported claims.

**Functional behavior**
- 2–4 testimonials with full name, title, company, and photo (with permission) — anonymous quotes are worth less than none. Prefer quotes that speak to specific behaviors ("owned the migration end-to-end") over generic praise.
- Optional link to the LinkedIn recommendation source for verifiability.
- Company logo strip near the hero doubles as compact social proof.
- Testimonials are translated for SR, marked as translated from the original.

**Edge cases**
- Fewer than 2 strong testimonials at launch → ship the logo strip only and add quotes later; a weak testimonial section is worse than none.
- Permission revoked → content is data-driven (single content file) so removal is a one-line change.

### FR-5: Contact — Calendly + Form + Direct Email — P0

**User story**: As any evaluator, I want to start a conversation in the channel I prefer with minimal effort, so that interest converts before it decays.

**Functional behavior**
- Three parallel channels, all visible in the contact section: (1) embedded Calendly inline widget (15/30-min intro call event types), (2) a short contact form — name, email, message, optional company — and (3) a plain `mailto:` link for people who hate both.
- Form submits via a serverless endpoint or form service (see Section 6); on success, shows confirmation and fires an analytics event; on failure, shows a clear error, preserves the entered message, and displays the direct email as fallback.
- Spam protection via honeypot field + time-to-submit heuristic. **No CAPTCHA** — it punishes real recruiters to stop bots.
- Calendly loads lazily (on scroll into view or on click) so its third-party JS doesn't damage initial page performance; a "Book a call" link fallback opens Calendly in a new tab if the embed fails or is blocked.
- Calendly event descriptions exist in both languages (or a language-neutral event is used); form labels, validation messages, and confirmations are fully localized.

**Edge cases**
- Calendly blocked by tracker-blocking extensions (common!) → fallback link must always render.
- Duplicate/rapid submissions → disable submit button while in flight; idempotent handling server-side.
- Form endpoint down → error state with mailto fallback; never a dead end.
- Email harvesting bots → acceptable trade-off; obfuscation hurts real users more than it stops scrapers.

### FR-6: Internationalization (EN/SR) — P0

**User story**: As a Serbian-market evaluator, I want to flip the whole site into Serbian with one tap and have it stay that way, so the experience feels native without hunting for a translated version.

**Functional behavior**
- **In-place translation, single URL set.** All translatable strings live in two structured dictionaries (`en.json`, `sr.json`); components render from the active dictionary. The header EN/SR toggle swaps every string on the page instantly — no page reload, no route change, scroll position preserved.
- **Default and persistence.** English on first visit. The selected language is stored client-side (localStorage) and applied on every subsequent page and return visit before first paint, so there is no flash of English on a Serbian visitor's second page view.
- **Everything switches together**: body copy, navigation, CTAs, form labels/placeholders/validation messages, confirmation and error states, the 404 page, image `alt` text, and dates (locale-aware formatting). The resume CTA switches its target between `cv.pdf` and `cv-sr.pdf` with the language. The document's `lang` attribute updates (`en` ↔ `sr`) so screen readers switch pronunciation and the browser offers correct spellcheck/hyphenation.
- **Layout resilience.** Serbian strings run longer than English on average; components must tolerate ±35% string length without truncation or overflow at every breakpoint. Translations are human-written, not machine-translated — the value proposition especially is rewritten, not word-swapped.
- **Toggle design**: a compact "EN / SR" control, both labels always visible (showing only the *other* language is a known usability trap), present in header and footer.
- Script decision: Latin vs. Cyrillic, chosen once (**assumption: Serbian Latin** for the tech-recruiting audience — open question #1).

**Edge cases**
- Missing translation key → build-time check fails or falls back to English with a logged warning; raw keys never render to users.
- JavaScript disabled or fails → the page renders fully in English (server-rendered default); the toggle simply doesn't appear. Serbian is unavailable without JS — accepted trade-off of the in-place approach.
- localStorage blocked (private browsing on some setups) → toggle still works for the session; preference just isn't remembered.
- Calendly/third-party embeds have their own language handling → configure Calendly event language to match where possible, or use language-neutral event names; the embed not switching with the toggle is acceptable if labeled.
- SR resume out of date vs. EN → both PDFs live in the same content-update checklist.
- SEO implication → Serbian text is injected client-side, so search engines index English only (see 5.3); this is accepted per the architecture decision in 3.1.

### FR-7: Analytics & Event Instrumentation — P0

**User story**: As the site owner, I want to know which sections and CTAs drive contact events, so I can iterate on evidence instead of vibes.

**Functional behavior**
- Privacy-friendly, cookieless analytics (Section 6). Named events: `cta_hero_resume`, `cta_hero_book`, `resume_download`, `form_submit_success`, `form_submit_error`, `calendly_open`, `calendly_booked` (via Calendly UTM/webhook where available), `lang_switch`, `case_study_open`, scroll-depth milestones.
- Outbound clicks (GitHub, LinkedIn) tracked.
- No consent banner required by design (no cookies, no PII in analytics).

**Edge cases**
- Ad-blockers block analytics (~30–40% of a technical audience) → accept undercounting; never let analytics failures affect page function.

---

## 5. Non-Functional Requirements

### 5.1 Performance — the site is a work sample

| Benchmark | Target |
|---|---|
| Lighthouse Performance (mobile, throttled) | ≥ 95 |
| Largest Contentful Paint (LCP) | ≤ 1.8s on 4G mobile |
| Interaction to Next Paint (INP) | ≤ 200ms |
| Cumulative Layout Shift (CLS) | ≤ 0.05 |
| Total JS shipped on home (compressed) | ≤ 100KB, excluding lazily-loaded Calendly |
| Time to first byte (CDN edge) | ≤ 200ms |

Tactics: static generation, system font stack or a single self-hosted variable font with `font-display: swap`, responsive images in AVIF/WebP with explicit dimensions, zero render-blocking third-party scripts, Calendly and any embeds lazy-loaded. Performance budget enforced in CI via Lighthouse CI — a regression fails the build.

### 5.2 Accessibility — WCAG 2.1 AA

- Full keyboard operability: logical tab order, visible focus states, skip-to-content link, no keyboard traps (Calendly embed must be reachable and escapable).
- Semantic HTML landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, sequential heading levels.
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components; contrast verified in both themes if dark mode ships.
- All images have meaningful `alt` text; decorative images `alt=""`. Form inputs have programmatic labels; errors are announced via `aria-live` and described with `aria-describedby`.
- `prefers-reduced-motion` respected for all animations, including timeline/scroll effects.
- Interactive skill filtering is a progressive enhancement; content is never gated behind interaction.
- Lighthouse accessibility asserted at 100 in CI (it runs axe internally) **plus** one manual screen-reader pass (VoiceOver or NVDA) before launch — automation catches roughly a third of real issues, and this project ships no e2e tests, so the manual pass is load-bearing.
- Accessibility applies equally to the SR pages, including correct `lang` attributes so screen readers switch pronunciation.

### 5.3 SEO

- Prerendered HTML for all content (no client-side-only rendering of primary content).
- Per-page unique `title` and `meta description` (English — the indexed language, per the single-URL i18n model in 3.1/FR-6); canonical URLs; XML sitemap; `robots.txt`. No `hreflang` needed since there are no per-language URLs.
- Structured data: `Person` schema (name, jobTitle, sameAs → GitHub/LinkedIn) on home; `Article`-style metadata on case studies.
- Open Graph + Twitter card metadata with a designed share image — case study links will be pasted into Slack and ATS notes; they should unfurl well.
- Primary SEO objective is **branded search** ("[Name]", "[Name] frontend developer"); do not chase generic keywords.

### 5.4 Responsive Design

| Breakpoint | Range | Notes |
|---|---|---|
| Mobile | 320–767px | Single column; stacked CTAs; sticky contact CTA; 44px minimum tap targets |
| Tablet | 768–1023px | Two-column where useful; timeline remains vertical |
| Desktop | 1024–1439px | Full layout |
| Large | ≥ 1440px | Max content width ~1200–1280px; no infinite line lengths |

Mobile-first CSS. Test on a real low-end Android device, not just DevTools emulation — executives and recruiters do open these links from phones.

### 5.5 Reliability, Security, Privacy

- Static-first architecture: the only runtime dependency is the form endpoint; everything else must work if every third party is down.
- HTTPS enforced, HSTS, sensible security headers (CSP allowing only the known third parties, X-Content-Type-Options, Referrer-Policy).
- Form data transmitted over HTTPS to a single processor; no PII stored client-side; a one-line privacy note near the form ("Your message goes straight to my inbox — no lists, no tracking").
- GDPR posture: cookieless analytics + form data used solely to respond = no consent banner needed; keep it that way.

### 5.6 Maintainability

All content (roles, bullets, skills, testimonials, translations) lives in structured content files (Markdown/JSON/YAML) separate from components. Adding a new job entry or fixing a typo in Serbian must not require touching component code. Target: full content update in ≤ 30 minutes including both languages.

---

## 6. Tech Stack & Integrations

Recommendations assume a solo builder who wants the stack itself to signal frontend competence, near-zero hosting cost, and minimal maintenance.

### 6.1 Recommended Stack (primary recommendation)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Astro** (with React islands where interactivity is needed) | Ships ~zero JS by default → trivially hits the performance budget; first-class content collections; static output; a small client-side island handles the in-place language toggle |
| Language | TypeScript | Table stakes for the target role; the repo may be read by hiring managers |
| Styling | Tailwind CSS (or vanilla CSS with custom properties) | Fast iteration; either choice is defensible — pick the one you'd happily discuss in an interview |
| Content | Markdown/MDX content collections in-repo | Version-controlled, no CMS to maintain, translations as parallel files |
| Hosting | **Vercel** or **Netlify** free tier (Cloudflare Pages as a strong alternative) | Global CDN, preview deploys per PR, custom domain + HTTPS included |
| CI | GitHub Actions: typecheck, lint, unit tests (Vitest, `src/lib/` only), i18n parity, font subset, link check (incl. PDF links), regex design lints, Lighthouse CI | Enforces the NFRs automatically. No Playwright / e2e in this project — journeys and cross-browser are manual (Implementation Plan §8.4–8.5) |

**Credible alternative**: Next.js (App Router, static export) if you want the site to double as evidence of the most in-demand framework, at the cost of more default JS and more framework churn. Both are correct answers; Astro wins on performance-per-effort, Next.js wins on résumé keyword alignment. A plain Vite + React SPA is **not** recommended (client-rendered content is worse for SEO and first paint).

### 6.2 Integrations

| Need | Recommendation | Notes |
|---|---|---|
| Scheduling | **Calendly** (free tier, 1 event type) or **Cal.com** (open-source, self-hostable — itself a nice signal) | Lazy-load embed; always render a fallback link |
| Contact form | **Formspree** / **Web3Forms** / a tiny serverless function → email | No backend to run; honeypot spam protection |
| Analytics | **Plausible**, **Fathom** (paid) or **Umami** (free, self-host/cloud) | Cookieless → no consent banner; custom events supported |
| Transactional feel | Email notification on form submit to your inbox | Respond within 24h — speed of reply is itself a signal |
| Domain | `firstnamelastname.com` (or .dev) | Own the branded search result; set up a professional email on the domain |
| Error monitoring | Optional: Sentry free tier | P2 — static sites rarely need it |

### 6.3 Repository Strategy

**Decision to make**: public vs. private repo. Recommendation: public, with a clean commit history and a README describing the architecture decisions — hiring managers do click through, and the repo becomes a second portfolio artifact. If public, keep content (testimonials with real names) reviewed for permission.

---

## 7. Out of Scope — V1

Excluded deliberately to protect a 4–6 week launch. Fast-follow candidates marked ↩.

1. **Blog / writing section** ↩ — high ongoing cost; a stale blog is negative signal. Add only with 3+ finished posts in hand.
2. **CMS integration** (Sanity, Contentful, Strapi) — in-repo content is faster and sufficient for a single editor.
3. **Dark mode** ↩ — pleasant, not conversion-relevant; ship after launch if desired (design tokens should not preclude it).
4. **Additional languages** beyond EN/SR.
5. **Custom scheduling backend** — Calendly/Cal.com solves it.
6. **Advanced animations / WebGL / 3D hero** — high effort, hurts performance budget, and evaluators are here to hire, not to be dazzled.
7. **Project demos hosted in-site** (interactive sandboxes, embedded apps) — link out to deployed projects/GitHub instead.
8. **Newsletter, RSS, comments** — wrong product.
9. **A/B testing infrastructure** — traffic volume won't reach significance; iterate on judgment + event data.
10. **PDF resume generated from site content** ↩ — elegant, but hand-maintained PDFs are fine for V1; automate later if drift becomes a problem.
11. **Chatbot / AI assistant on the site** — friction and gimmick risk; the CTA path is already 1–3 clicks.
12. **Full Cyrillic + Latin dual-script Serbian** — pick one script for V1 (assumed Latin); dual-script doubles i18n surface for marginal benefit.

---

## Appendix A — Open Questions (need your input)

1. **Serbian script**: Latin (assumed) or Cyrillic?
2. **Availability status**: publicly show "open to opportunities," or keep neutral (relevant if currently employed)?
3. **Case study candidates**: which 2–3 projects have the strongest metrics and no NDA blockers?
4. **Testimonial sources**: do 2–4 named references exist today, or does outreach need to start now (longest lead-time item)?
5. **Domain**: already owned, or to be purchased?
6. **Repo visibility**: public (recommended) or private?
7. **Calendly vs. Cal.com**: preference, and is a free tier sufficient (1 event type)?

## Appendix B — Suggested Launch Checklist (abbreviated)

Content complete in both languages → both PDFs finalized → Lighthouse ≥95 perf and 100 a11y mobile → manual journey walkthrough + manual screen-reader pass → all events firing in analytics → form tested end-to-end incl. failure state → Calendly booking tested from an incognito mobile session → OG images verified in a link-preview debugger → language toggle tested on every section incl. form errors and 404, persistence verified across pages and revisits, no layout breakage from longer SR strings → 404 page live → DNS + HTTPS + redirects (www → apex) confirmed.
