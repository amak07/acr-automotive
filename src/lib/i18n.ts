/**
 * Internationalization (i18n) System
 * 
 * Simple custom i18n solution for ACR Automotive.
 * Supports English (development) and Spanish (production).
 */

import { Locale, TranslationKeys } from '@/types/parts'

/**
 * Translation Dictionary
 * 
 * All UI text is defined here with English and Spanish translations.
 * Add new keys as needed throughout development.
 */
const translations: Record<keyof TranslationKeys, Record<Locale, string>> = {
  // Search interface
  'search.vehicle': {
    en: 'Search by Vehicle',
    es: 'Búsqueda por Vehículo'
  },
  'search.sku': {
    en: 'Search by SKU',
    es: 'Búsqueda por SKU'
  },
  'search.make': {
    en: 'Make',
    es: 'Marca'
  },
  'search.model': {
    en: 'Model',
    es: 'Modelo'
  },
  'search.year': {
    en: 'Year',
    es: 'Año'
  },
  'search.partType': {
    en: 'Part Type',
    es: 'Tipo de Pieza'
  },
  'search.enterSKU': {
    en: 'Enter part number or SKU',
    es: 'Ingrese número de pieza o SKU'
  },
  'search.noResults': {
    en: 'No parts found',
    es: 'No se encontraron piezas'
  },
  'search.loading': {
    en: 'Searching...',
    es: 'Buscando...'
  },
  
  // Part details
  'part.details': {
    en: 'Part Details',
    es: 'Detalles de Pieza'
  },
  'part.sku': {
    en: 'SKU',
    es: 'SKU'
  },
  'part.type': {
    en: 'Type',
    es: 'Tipo'
  },
  'part.position': {
    en: 'Position',
    es: 'Posición'
  },
  'part.abs': {
    en: 'ABS',
    es: 'ABS'
  },
  'part.bolts': {
    en: 'Bolt Pattern',
    es: 'Patrón de Tornillos'
  },
  'part.drive': {
    en: 'Drive Type',
    es: 'Tipo de Tracción'
  },
  'part.specs': {
    en: 'Specifications',
    es: 'Especificaciones'
  },
  'part.applications': {
    en: 'Vehicle Applications',
    es: 'Aplicaciones de Vehículos'
  },
  'part.crossReference': {
    en: 'Cross Reference',
    es: 'Referencia Cruzada'
  },
  
  // Admin interface
  'admin.upload': {
    en: 'Upload Excel File',
    es: 'Subir Archivo Excel'
  },
  'admin.import': {
    en: 'Import Data',
    es: 'Importar Datos'
  },
  'admin.preview': {
    en: 'Preview Import',
    es: 'Previsualizar Importación'
  },
  'admin.confirm': {
    en: 'Confirm Import',
    es: 'Confirmar Importación'
  },
  'admin.errors': {
    en: 'Validation Errors',
    es: 'Errores de Validación'
  },
  
  // Common
  'common.search': {
    en: 'Search',
    es: 'Buscar'
  },
  'common.clear': {
    en: 'Clear',
    es: 'Limpiar'
  },
  'common.loading': {
    en: 'Loading...',
    es: 'Cargando...'
  },
  'common.error': {
    en: 'Error',
    es: 'Error'
  },
  'common.success': {
    en: 'Success',
    es: 'Éxito'
  }
}

/**
 * Translation Function
 * 
 * Primary function for getting translated text.
 * Falls back to the key itself if translation is missing.
 */
export function t(key: keyof TranslationKeys, locale: Locale = 'en'): string {
  const translation = translations[key]?.[locale]
  
  if (!translation) {
    console.warn(`Missing translation for key: ${key} (locale: ${locale})`)
    return key
  }
  
  return translation
}

/**
 * Get Current Locale
 * 
 * Determines the current locale based on environment and user preferences.
 * Development: English, Production: Spanish
 */
export function getCurrentLocale(): Locale {
  // In development, always use English
  if (process.env.NODE_ENV === 'development') {
    return 'en'
  }
  
  // In production, use Spanish for Mexican market
  // Could be enhanced with user preference detection
  return 'es'
}

/**
 * Format Date for Locale
 * 
 * Formats dates according to the current locale.
 */
export function formatDate(date: Date | string, locale: Locale = getCurrentLocale()): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (locale === 'es') {
    return dateObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format Number for Locale
 * 
 * Formats numbers according to the current locale.
 */
export function formatNumber(number: number, locale: Locale = getCurrentLocale()): string {
  if (locale === 'es') {
    return number.toLocaleString('es-MX')
  }
  
  return number.toLocaleString('en-US')
}

/**
 * Get Available Locales
 * 
 * Returns list of supported locales.
 */
export function getAvailableLocales(): Locale[] {
  return ['en', 'es']
}

/**
 * Validate Translation Keys
 * 
 * Development utility to check for missing translations.
 */
export function validateTranslations(): { 
  missingKeys: string[]
  incompleteKeys: string[] 
} {
  const locales = getAvailableLocales()
  const missingKeys: string[] = []
  const incompleteKeys: string[] = []
  
  Object.keys(translations).forEach(key => {
    const translation = translations[key as keyof TranslationKeys]
    
    if (!translation) {
      missingKeys.push(key)
      return
    }
    
    const hasAllLocales = locales.every(locale => translation[locale])
    if (!hasAllLocales) {
      incompleteKeys.push(key)
    }
  })
  
  return { missingKeys, incompleteKeys }
}

/**
 * Translation Hook for React Components
 * 
 * Custom hook that provides translation function and current locale.
 */
export function useTranslation() {
  const locale = getCurrentLocale()
  
  return {
    t: (key: keyof TranslationKeys) => t(key, locale),
    locale,
    formatDate: (date: Date | string) => formatDate(date, locale),
    formatNumber: (number: number) => formatNumber(number, locale)
  }
}