// i18n types for ACR Automotive

export type Locale = 'en' | 'es';

// Industry standard translation keys with hierarchical namespacing
export interface TranslationKeys {
  // Admin Header
  'admin.header.title': string;
  'admin.header.languageToggle': string;
  
  // Admin Dashboard
  'admin.dashboard.totalParts': string;
  'admin.dashboard.applications': string;
  'admin.dashboard.catalogTitle': string;
  
  // Admin Search & Filters
  'admin.search.placeholder': string;
  'admin.search.partType': string;
  'admin.search.position': string;
  'admin.search.button': string;
  
  // Admin Parts List
  'admin.parts.newButton': string;
  'admin.parts.sku': string;
  'admin.parts.actions': string;
  'admin.parts.abs': string;
  'admin.parts.specifications': string;
  'admin.parts.applications': string;
  'admin.parts.vehicles': string;
  'admin.parts.vehicle': string;
  'admin.parts.references': string;
  'admin.parts.reference': string;
  'admin.parts.vehicleApplications': string;
  'admin.parts.crossReferences': string;
  'admin.parts.pagination': string;
  
  // Common Actions
  'common.actions.view': string;
  'common.actions.edit': string;
  'common.actions.save': string;
  'common.actions.cancel': string;
  'common.actions.delete': string;
  'common.actions.search': string;
  
  // Common States
  'common.loading': string;
  'common.error': string;
  'common.error.generic': string;
  'common.error.tryAgain': string;
  'common.success': string;
  
  // Part Types & Positions
  'parts.types.maza': string;
  'parts.types.disco': string;
  'parts.types.balero': string;
  'parts.types.amortiguador': string;
  'parts.positions.delantero': string;
  'parts.positions.trasero': string;
  
  // Search (legacy - keeping for backward compatibility)
  'search.sku': string;
  'search.enterSKU': string;
  'search.noResults': string;
  'search.loading': string;
}