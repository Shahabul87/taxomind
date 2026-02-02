/**
 * SAM i18n Type Definitions
 *
 * Type system for SAM's multi-language support.
 */

/** Supported locales. Add new locales here as translations are added. */
export type SupportedLocale = 'en' | 'es' | 'fr' | 'ar' | 'bn';

/** Flat key-value translation dictionary */
export interface TranslationDictionary {
  [key: string]: string;
}

/**
 * Translation key patterns:
 *
 * Mode greetings:   `mode.{modeId}.greeting`
 * Degraded messages: `degraded.{intent}`
 * System messages:   `system.{key}`
 * UI labels:         `ui.{key}`
 */
export type TranslationKey = string;

/** Default locale when no locale is specified */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** All supported locales for validation */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'es', 'fr', 'ar', 'bn'];

/** Check if a string is a supported locale */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
