/**
 * Mock Translation Utilities for Testing
 *
 * Provides English translations for UI component tests.
 * Extracted from src/lib/i18n/translations.ts to avoid importing
 * the entire translation system in unit tests.
 */

import { translations } from '../../src/lib/i18n/translations';
import type { TranslationKeys } from '../../src/lib/i18n/translation-keys';

/**
 * Extract English translations from the translation dictionary
 */
const mockTranslations: Record<string, string> = Object.entries(translations).reduce(
  (acc, [key, value]) => {
    acc[key] = value.en;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Mock translation function that returns English values
 * Falls back to key if translation not found
 */
export function mockT(key: string): string {
  return mockTranslations[key] || key;
}

/**
 * Get all mock translations (for debugging)
 */
export function getAllMockTranslations(): Record<string, string> {
  return { ...mockTranslations };
}

/**
 * Check if a translation key exists
 */
export function hasMockTranslation(key: string): boolean {
  return key in mockTranslations;
}
