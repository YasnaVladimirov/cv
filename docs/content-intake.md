# Content intake — Phase 9

Fill this in and I turn it into the site. **Nothing here is optional prose** —
every field maps to a real slot in the content collections or the i18n
dictionaries, and the build fails while any of it is still a placeholder
(`pnpm verify:no-fixtures`).

Rules that apply to everything below, from the specs:

- **Serbian is written, not translated.** A literal translation of an English
  sentence reads as machine output to a Serbian reader. Write the thought
  again in Serbian. If you would rather I draft the Serbian and you correct
  it, say so — I will mark every string I drafted so you can review them as a
  set.
- **Every bullet leads with an outcome**, and carries a metric where the metric
  is honest (PRD FR-2). "Reduced X by N%" beats "Responsible for X".
- **Never invent a number.** An unmeasured bullet with no metric is fine. A
  made-up metric is the one thing that ends a hiring conversation.
- Anything you leave blank stays blank — I will flag it, not fill it.

---

## 1. Hero

|                    | English | Serbian |
| ------------------ | ------- | ------- |
| Name               |         |         |
| Title line         |         |         |
| Value prop (1–2 sentences, outcome-focused) | | |

**Availability pill** — currently off. Turn on? ☐ yes ☐ no
If yes: text (EN / SR), e.g. "Open to opportunities · Sofia / Remote".

## 2. Contact and links

| Field | Value |
| ----- | ----- |
| Contact email (mailto fallback) | |
| GitHub URL | |
| LinkedIn URL | |
| CV filename, EN (`firstname-lastname-cv.pdf`) | |
| CV filename, SR | |

## 3. Roles

**One block per job, all employment.** Copy the block as many times as needed.

```
Company:
Role (EN):
Role (SR):
Start (yyyy-mm):
End (yyyy-mm, or "present"):
Location (EN):
Location (SR):
Stack: (list — these drive the skill filter, so spell them exactly as in §5)
Bullets (EN):
  -
  -
  -
Bullets (SR):
  -
  -
  -
Links to a case study? (which one, or none)
```

## 4. Case studies — 1 to 3, whatever is ready

One is enough to launch; the layout adapts (1 → spotlight, 3 → grid).
Each needs, **in both languages**:

```
Title:
Outcome line (one sentence, leads with the result):
Metrics (up to 3): value + label      e.g.  -42%  |  render time
Stack:
Hero image: (file, or say "none" and I will use a token-built panel)
Image alt text:
Date published:
```

and the body, in this exact order (PRD FR-2 — the section headings are fixed
and already wired to their eyebrows):

1. **Context** — where, what product, what scale
2. **Problem** — what was actually wrong
3. **My role** — what *you* did, distinct from the team
4. **Approach** — the decisions, and what you traded away
5. **Outcome** — the measured result
6. **Stack** — what you used
7. **What I'd do differently** — this section is the one evaluators read
   closest. Do not skip it and do not make it fake-humble.

## 5. Skills

Grouped by category. For each skill, **which roles used it** — that is what the
filter highlights, so it has to be true.

```
Category (EN / SR):
  - Skill name → used in: [company, company]
  - Skill name → used in: []        ← empty is fine; renders as plain text,
                                      not a clickable filter
```

Current categories are Languages / Frameworks & libraries / Tooling / Practices.
Rename, reorder, add or drop any of them.

## 6. Proof strip (employer logos)

Currently **off**. It only goes on with permission.

- Turn on? ☐ yes ☐ no
- Companies whose logos may appear:
- Logo files (SVG preferred, PNG fine):
- Confirmed you have permission to display each: ☐

## 7. CV PDFs

Two files: `public/cv.pdf` and `public/cv-sr.pdf`. The current ones are
193-byte stubs. The hero CTA and the 404 page both link to them, and the
language toggle swaps between them.

## 8. Photo — optional

The hero has no portrait right now and does not need one. If you want one:
a real photo, not a stock image (Design System §2 forbids stock).

## 9. Testimonials — optional, post-launch

Section is absent while empty, by design. Each needs a quote (EN + SR), the
author's name, their role and company, an avatar, and **named permission to
publish the quote**.

## 10. Small strings still on placeholder

| Key | English | Serbian |
| --- | ------- | ------- |
| `meta.default.title` (≤60 chars) | | |
| `meta.default.description` (≤155 chars) | | |
| `notFound.subtext` — one line, shown on the 404 | | |
| `footer.tagline` — one line | | |
