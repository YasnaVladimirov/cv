/**
 * React bridge to the language store.
 *
 * Only for islands whose strings appear conditionally at runtime — form
 * validation errors, the toast, the Calendly failure state. Static text uses
 * the <T> component and CSS instead, which needs no JS at all.
 *
 * No context provider: the store is module-scope and every island subscribes
 * directly, so islands stay independently hydratable. Astro renders each
 * island as its own root, and a shared provider would mean wrapping each one.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { getLanguage, subscribe, t, type Lang } from './i18n';

/** Server render always uses the default; the client corrects on hydration. */
const getServerSnapshot = (): Lang => 'en';

export function useLanguage(): Lang {
  return useSyncExternalStore(subscribe, getLanguage, getServerSnapshot);
}

export function useI18n() {
  const lang = useLanguage();
  const translate = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(key, lang, vars),
    [lang],
  );
  return { lang, t: translate };
}
