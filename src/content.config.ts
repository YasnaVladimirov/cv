/**
 * Content collections — the content model for the whole site.
 *
 * Everything a visitor reads lives here, not in components: adding a job or
 * fixing a Serbian typo must never require touching component code
 * (PRD 5.6). Bilingual fields are parallel `_en` / `_sr` pairs, because the
 * language toggle swaps strings in place from a single set of URLs (FR-6).
 *
 * Long-form case study prose is the one exception: it lives in the MDX body
 * as two language blocks rather than as frontmatter fields. See plan 2.5.
 */
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
// Imported directly rather than via astro:content, whose re-export of `z` is
// deprecated in Astro 7.
import { z } from 'zod';

/** A metric callout: a real measured outcome, never a vanity number (DS 6.4). */
const metric = z.object({
  /** Always carries unit and direction, e.g. "-58%" not "58 faster" (DS 8.7). */
  value: z.string().min(1),
  label_en: z.string().min(1),
  label_sr: z.string().min(1),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      /** Controls both the on-page order and the prev/next sequence on S2. */
      order: z.number().int().nonnegative(),
      title_en: z.string().min(1),
      title_sr: z.string().min(1),
      /** One line, leads with the outcome. Shown on the card and under the H1. */
      outcome_en: z.string().min(1),
      outcome_sr: z.string().min(1),
      /** Up to three; the card renders at most three (DS 7.10). */
      metrics: z.array(metric).max(3),
      stack: z.array(z.string().min(1)).nonempty(),
      hero_image: image(),
      hero_image_alt_en: z.string().min(1),
      hero_image_alt_sr: z.string().min(1),
      /**
       * Publication date, for JSON-LD `datePublished` (plan §7.3).
       *
       * `coerce` because YAML parses an unquoted `2026-02-09` into a Date and
       * a quoted one into a string, and a content author should not have to
       * know which. Either is accepted; an unparseable value still fails.
       *
       * Optional: file mtime was the alternative and it is not stable across
       * a fresh checkout or a CI runner, so an absent date beats an invented
       * one — the property is simply omitted.
       */
      date_published: z.coerce.date().optional(),
      /**
       * Unpublished entries generate no route, so a request 404s to S3.
       * This is the switch that drives the 1/2/3-card layouts in App Flow 4.3.
       */
      published: z.boolean().default(false),
    }),
});

const roles = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/roles' }),
  schema: z.object({
    company: z.string().min(1),
    role_en: z.string().min(1),
    role_sr: z.string().min(1),
    /** ISO yyyy-mm. `end: null` means current — rendered as "Present"/"Sada". */
    start: z.string().regex(/^\d{4}-\d{2}$/, 'Use yyyy-mm'),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Use yyyy-mm')
      .nullable(),
    location_en: z.string().min(1),
    location_sr: z.string().min(1),
    /** Each bullet leads with an outcome, with a metric where honest (FR-2). */
    bullets_en: z.array(z.string().min(1)).nonempty(),
    bullets_sr: z.array(z.string().min(1)).nonempty(),
    /** Drives the skill-matrix filter: a skill matches a role via this list. */
    stack: z.array(z.string().min(1)).nonempty(),
    case_study: reference('caseStudies').optional(),
    /** Reverse-chronological display order; highest first. */
    order: z.number().int().nonnegative(),
  }),
});

/**
 * One entry per category. `file()` maps each array element to an entry, so
 * the JSON is an array of categories rather than a wrapper object.
 */
const skills = defineCollection({
  loader: file('./src/content/skills/skills.json'),
  schema: z.object({
    id: z.string().min(1),
    name_en: z.string().min(1),
    name_sr: z.string().min(1),
    order: z.number().int().nonnegative(),
    skills: z
      .array(
        z.object({
          name: z.string().min(1),
          /**
           * Role ids this skill was used in. An EMPTY list is meaningful:
           * the skill renders as plain text, not a button, so the
           * zero-results filter state cannot occur (App Flow 4.6).
           */
          timeline_matches: z.array(z.string()),
        }),
      )
      .nonempty(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/testimonials' }),
  schema: ({ image }) =>
    z.object({
      quote_en: z.string().min(1),
      quote_sr: z.string().min(1),
      author: z.string().min(1),
      role_en: z.string().min(1),
      role_sr: z.string().min(1),
      company: z.string().min(1),
      avatar: image(),
      linkedin_url: z.url().optional(),
      /** Empty at launch by decision — see src/content/testimonials/README.md. */
      published: z.boolean().default(false),
    }),
});

export const collections = { caseStudies, roles, skills, testimonials };
