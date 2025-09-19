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
  'admin.parts.dataRelations': string;
  'admin.parts.details': string;
  'admin.parts.pagination': string;
  'admin.dashboard.crossReferences': string;
  'common.actions.clearFilters': string;
  'common.actions.back': string;
  'common.actions.saving': string;
  'common.actions.discard': string;

  // Confirmation Dialogs
  'common.confirm.unsavedChanges.title': string;
  'common.confirm.unsavedChanges.description': string;

  // Common Actions
  'common.actions.view': string;
  'common.actions.edit': string;
  'common.actions.save': string;
  'common.actions.cancel': string;
  'common.actions.delete': string;
  'common.actions.search': string;
  'common.actions.all': string;
  
  // Common States
  'common.loading': string;
  'common.error': string;
  'common.error.generic': string;
  'common.error.title': string;
  'common.error.tryAgain': string;
  'common.success': string;
  'common.notAvailable': string;
  'common.notSpecified': string;
  
  // Part Types & Positions
  'parts.types.maza': string;
  'parts.types.disco': string;
  'parts.types.balero': string;
  'parts.types.amortiguador': string;
  'parts.types.birlos': string;
  'parts.positions.delantera': string;
  'parts.positions.delantero': string;
  'parts.positions.trasera': string;
  'parts.positions.trasero': string;
  
  // ABS Types
  'parts.abs.with': string;    // C/ABS -> Con ABS
  'parts.abs.without': string; // S/ABS -> Sin ABS
  
  // Drive Types  
  'parts.drive.4x2': string;
  'parts.drive.4x4': string;
  
  
  // Field labels for specs display
  'parts.labels.position': string;
  'parts.labels.abs': string;
  'parts.labels.drive': string;
  'parts.labels.bolts': string;
  'parts.labels.boltPattern': string;
  'parts.labels.noNotes': string;
  
  // Search (legacy - keeping for backward compatibility)
  'search.sku': string;
  'search.enterSKU': string;
  'search.noResults': string;
  'search.loading': string;

  // Part Details Page
  'partDetails.breadcrumb.parts': string;
  'partDetails.status.active': string;
  'partDetails.actions.preview': string;
  'partDetails.actions.saveChanges': string;
  'partDetails.actions.uploadImage': string;

  // Part Details Header
  'partDetails.header.partLabel': string;
  'partDetails.header.specifications': string;

  // Part Details Actions
  'partDetails.actions.saveSuccess': string;
  'partDetails.actions.saveError': string;
  'partDetails.empty.noApplications': string;
  'partDetails.empty.applicationsDescription': string;
  'partDetails.empty.addFirstApplication': string;
  'partDetails.empty.noCrossReferences': string;
  'partDetails.empty.crossReferencesDescription': string;
  'partDetails.empty.addFirstReference': string;
  'partDetails.quickStats.applications': string;
  'partDetails.quickStats.crossReferences': string;
  'partDetails.applications.title': string;
  'partDetails.applications.vehicles': string;
  'partDetails.applications.search': string;
  'partDetails.applications.add': string;
  'partDetails.applications.addFirst': string;
  'partDetails.applications.emptyTitle': string;
  'partDetails.applications.emptyDescription': string;
  'partDetails.crossReferences.title': string;
  'partDetails.crossReferences.references': string;
  'partDetails.crossReferences.search': string;
  'partDetails.crossReferences.add': string;
  'partDetails.crossReferences.addFirst': string;
  'partDetails.crossReferences.emptyTitle': string;
  'partDetails.crossReferences.emptyDescription': string;
  'partDetails.basicInfo.title': string;
  'partDetails.basicInfo.acrSku': string;
  'partDetails.basicInfo.description': string;
  'partDetails.basicInfo.type': string;
  'partDetails.basicInfo.drive': string;
  'partDetails.basicInfo.notes': string;
  'partDetails.basicInfo.notesPlaceholder': string;
  'partDetails.basicInfo.skuNote': string;
  'partDetails.basicInfo.partType': string;
  'partDetails.basicInfo.position': string;
  'partDetails.basicInfo.absType': string;
  'partDetails.basicInfo.boltPattern': string;
  'partDetails.basicInfo.driveType': string;
  'partDetails.basicInfo.additionalSpecs': string;
  'partDetails.basicInfo.productImage': string;
  'partDetails.basicInfo.imageUploadText': string;
  'partDetails.basicInfo.imageFormat': string;
  'partDetails.basicInfo.selectFile': string;
  'partDetails.vehicleApps.title': string;
  'partDetails.vehicleApps.applications': string;
  'partDetails.vehicleApps.addApplication': string;
  'partDetails.crossRefs.title': string;
  'partDetails.crossRefs.references': string;
  'partDetails.crossRefs.addReference': string;
  'partDetails.navigation.backToList': string;
  'partDetails.metadata.created': string;
  'partDetails.metadata.lastModified': string;
  'partDetails.metadata.separator': string;

  // Vehicle Applications Table
  'partDetails.vehicleApps.table.brand': string;
  'partDetails.vehicleApps.table.model': string;
  'partDetails.vehicleApps.table.yearRange': string;
  'partDetails.vehicleApps.table.actions': string;
  'partDetails.vehicleApps.mobile.brand': string;
  'partDetails.vehicleApps.mobile.model': string;
  'partDetails.vehicleApps.mobile.years': string;

  // Cross References Table
  'partDetails.crossRefs.table.competitorSku': string;
  'partDetails.crossRefs.table.brand': string;
  'partDetails.crossRefs.table.actions': string;
  'partDetails.crossRefs.mobile.brand': string;

  // Modal Labels
  'forms.labels.brand': string;
  'forms.labels.model': string;
  'forms.labels.startYear': string;
  'forms.labels.endYear': string;
  'forms.labels.competitorSku': string;
  'forms.labels.competitorBrand': string;
  'forms.placeholders.startYear': string;
  'forms.placeholders.endYear': string;
  'forms.placeholders.make': string;
  'forms.placeholders.model': string;
  'forms.placeholders.competitorSku': string;
  'forms.placeholders.competitorBrand': string;

  // Modal Titles and Descriptions
  'modals.editVehicleApplication.title': string;
  'modals.editVehicleApplication.description': string;
  'modals.addVehicleApplication.title': string;
  'modals.addVehicleApplication.description': string;
  'modals.editCrossReference.title': string;
  'modals.editCrossReference.description': string;
  'modals.addCrossReference.title': string;
  'modals.addCrossReference.description': string;
}