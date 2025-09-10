/**
 * Internationalization (i18n) System - MVP Version
 *
 * Simple custom i18n solution for ACR Automotive.
 * Only includes essential functions needed for admin interface.
 */

import { Locale, TranslationKeys } from "@/lib/i18n/translation-keys";
import { translations } from "@/lib/i18n/translations";

/**
 * Translation Function
 *
 * Primary function for getting translated text.
 * Falls back to the key itself if translation is missing.
 */
export function t(key: keyof TranslationKeys, locale: Locale = "en"): string {
  const translation = translations[key]?.[locale];

  if (!translation) {
    console.warn(`Missing translation for key: ${key} (locale: ${locale})`);
    return key;
  }

  return translation;
}

// Export types and translations for Context usage
export type { Locale, TranslationKeys } from "@/lib/i18n/translation-keys";
export { translations } from "@/lib/i18n/translations";
