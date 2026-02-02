/**
 * SAM i18n System
 *
 * Lazy-loading translation system with English fallback.
 * Locales are cached in memory after first load.
 *
 * Usage:
 *   getTranslation('mode.general-assistant.greeting', 'es')
 *   getTranslation('system.error.generic', 'en')
 *   getTranslation('some.key', 'fr', 'Fallback text')
 */

import type { TranslationDictionary } from './types';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './types';

// Locale cache: loaded once and kept in memory
const localeCache = new Map<SupportedLocale, TranslationDictionary>();

/**
 * Lazy-load a locale dictionary.
 * Returns null if the locale file doesn't exist or fails to load.
 */
async function loadLocale(locale: SupportedLocale): Promise<TranslationDictionary | null> {
  if (localeCache.has(locale)) {
    return localeCache.get(locale)!;
  }

  try {
    let dictionary: TranslationDictionary;

    switch (locale) {
      case 'en': {
        const mod = await import('./locales/en');
        dictionary = mod.default;
        break;
      }
      case 'es': {
        const mod = await import('./locales/es');
        dictionary = mod.default;
        break;
      }
      default:
        // Locale not yet implemented
        return null;
    }

    localeCache.set(locale, dictionary);
    return dictionary;
  } catch {
    return null;
  }
}

/**
 * Synchronous locale access (returns from cache only).
 * Use after ensureLocaleLoaded() or when the locale might already be cached.
 */
function getLocaleSync(locale: SupportedLocale): TranslationDictionary | null {
  return localeCache.get(locale) ?? null;
}

/**
 * Ensure a locale is loaded into the cache.
 * Call this at app startup or before a session if you need synchronous access later.
 */
export async function ensureLocaleLoaded(locale: string): Promise<void> {
  if (!isSupportedLocale(locale)) return;
  await loadLocale(locale);
}

/**
 * Get a translation string.
 *
 * Resolution order:
 * 1. Target locale (if loaded and key exists)
 * 2. English fallback (if loaded and key exists)
 * 3. Provided fallback string
 * 4. The key itself
 *
 * This function is synchronous for performance. Locales should be
 * pre-loaded via ensureLocaleLoaded() or getTranslationAsync().
 */
export function getTranslation(
  key: string,
  locale: string = DEFAULT_LOCALE,
  fallback?: string,
): string {
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  // Try target locale
  const targetDict = getLocaleSync(resolvedLocale);
  if (targetDict?.[key]) {
    return targetDict[key];
  }

  // Try English fallback (if target wasn't English)
  if (resolvedLocale !== 'en') {
    const enDict = getLocaleSync('en');
    if (enDict?.[key]) {
      return enDict[key];
    }
  }

  // Use provided fallback or return the key
  return fallback ?? key;
}

/**
 * Async version that lazy-loads locales before translating.
 * Use this when the locale might not be cached yet.
 */
export async function getTranslationAsync(
  key: string,
  locale: string = DEFAULT_LOCALE,
  fallback?: string,
): Promise<string> {
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  // Load target locale
  const targetDict = await loadLocale(resolvedLocale);
  if (targetDict?.[key]) {
    return targetDict[key];
  }

  // Load English fallback
  if (resolvedLocale !== 'en') {
    const enDict = await loadLocale('en');
    if (enDict?.[key]) {
      return enDict[key];
    }
  }

  return fallback ?? key;
}

/**
 * Get all translations for a locale (merged with English fallback).
 * Missing keys in the target locale will use the English value.
 */
export async function getFullDictionary(locale: string): Promise<TranslationDictionary> {
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  const enDict = (await loadLocale('en')) ?? {};
  if (resolvedLocale === 'en') return { ...enDict };

  const targetDict = (await loadLocale(resolvedLocale)) ?? {};
  return { ...enDict, ...targetDict };
}

/**
 * Clear the locale cache (useful for testing or hot-reloading).
 */
export function clearLocaleCache(): void {
  localeCache.clear();
}

// Re-export types for convenience
export type { SupportedLocale, TranslationDictionary } from './types';
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from './types';
