/**
 * Locale-aware formatting (Design System §9.3).
 *
 * Nothing here hand-builds a date string. Serbian writes months differently
 * from English — different names, different abbreviation conventions, and a
 * different order in some patterns — so a template like `${month} ${year}`
 * would be an English assumption wearing a translation. `Intl` knows; we ask.
 *
 * Roles store dates as `yyyy-mm` because a role has no day, and a full ISO
 * timestamp would invite a timezone bug that moves March to February for
 * anyone west of UTC.
 */
import { LOCALE, t, type Lang } from './i18n';

/** Matches the `start` / `end` shape enforced by the roles schema. */
const YYYY_MM = /^(\d{4})-(\d{2})$/;

/**
 * "Mar 2024" / "mar 2024". Constructed at UTC noon: `new Date('2024-03')`
 * parses as UTC midnight, which any negative-offset locale renders as the
 * previous month.
 */
export function formatMonth(value: string, lang: Lang): string {
  const match = YYYY_MM.exec(value);
  if (!match) return value;

  const [, year, month] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1, 12));

  return new Intl.DateTimeFormat(LOCALE[lang], {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * "Mar 2024 – Present". `end: null` means the role is current, and the word
 * for that comes from the dictionary, not from here.
 *
 * The separator is an en dash with hairline spaces, which is the typographic
 * convention for a range in both languages.
 */
export function formatRange(start: string, end: string | null, lang: Lang): string {
  const from = formatMonth(start, lang);
  const to = end === null ? t('timeline.present', lang) : formatMonth(end, lang);
  return `${from} – ${to}`;
}
