// i18n types for ACR Automotive

export type Locale = 'en' | 'es';

// Minimal translation keys - add as needed during development
export interface TranslationKeys {
  // Search (core functionality)
  'search.sku': string;
  'search.enterSKU': string;
  'search.noResults': string;
  'search.loading': string;
  
  // Common
  'common.search': string;
  'common.loading': string;
  'common.error': string;
}