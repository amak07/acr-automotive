// i18n types for ACR Automotive

export type Locale = 'en' | 'es';

// Industry standard translation keys with hierarchical namespacing
export interface TranslationKeys {
  // Admin Header
  'admin.header.title': string;
  'admin.header.admin': string;
  'admin.header.languageToggle': string;
  'admin.header.viewPublic': string;
  'admin.header.settings': string;
  
  // Admin Dashboard
  'admin.dashboard.totalParts': string;
  'admin.dashboard.applications': string;
  'admin.dashboard.catalogTitle': string;
  
  // Admin Search & Filters
  'admin.search.placeholder': string;
  'admin.search.partType': string;
  'admin.search.position': string;
  
  // Admin Parts List
  'admin.parts.newButton': string;
  'admin.parts.sku': string;
  'admin.parts.actions': string;
  'admin.parts.abs': string;
  'admin.parts.specifications': string;
  'admin.parts.applications': string;
  'admin.parts.crossReferences': string;
  'admin.parts.vehicles': string;
  'admin.parts.vehicle': string;
  'admin.parts.references': string;
  'admin.parts.reference': string;
  'admin.parts.vehicleApplications': string;
  'admin.parts.dataRelations': string;
  'admin.parts.details': string;
  'admin.parts.pagination': string;
  'admin.parts.noVehicleApplications': string;
  'admin.parts.addVehicleApplication': string;
  'admin.parts.noCrossReferences': string;
  'admin.parts.addCrossReference': string;
  'admin.parts.deleteVehicleApplicationError': string;
  'admin.parts.deleteCrossReferenceError': string;
  'common.actions.clearFilters': string;
  'common.actions.back': string;
  'common.actions.saving': string;
  'common.actions.discard': string;
  'common.actions.select': string;
  'common.actions.creating': string;
  'common.actions.createPart': string;
  'common.search': string;

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
  'common.actions.searchBy': string;
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

  // ComboBox Component
  'comboBox.noResults': string;
  'comboBox.noMatchesAddNew': string;
  'comboBox.addValue': string;

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
  'partDetails.navigation.backToList': string;
  'partDetails.metadata.created': string;
  'partDetails.metadata.lastModified': string;
  'partDetails.metadata.separator': string;

  // Part Images Section
  'partDetails.images.title': string;
  'partDetails.images.uploadButton': string;
  'partDetails.images.uploading': string;
  'partDetails.images.emptyTitle': string;
  'partDetails.images.emptyDescription': string;
  'partDetails.images.uploadFirst': string;
  'partDetails.images.limitReached': string;
  'partDetails.images.limitDescription': string;
  'partDetails.images.tooMany': string;
  'partDetails.images.remainingSlots': string;
  'partDetails.images.filesSkipped': string;
  'partDetails.images.uploadSuccess': string;
  'partDetails.images.uploadFailed': string;
  'partDetails.images.deleteSuccess': string;
  'partDetails.images.deleteFailed': string;
  'partDetails.images.setPrimarySuccess': string;
  'partDetails.images.setPrimaryFailed': string;
  'partDetails.images.updateFailed': string;
  'partDetails.images.reorderFailed': string;
  'partDetails.images.primary': string;
  'partDetails.images.captionPlaceholder': string;
  'partDetails.images.deleteConfirm': string;
  'partDetails.images.setPrimaryTooltip': string;
  'partDetails.images.deleteTooltip': string;
  'partDetails.images.dragTipLabel': string;
  'partDetails.images.dragTip': string;

  // Table Headers for Vehicle Applications
  'partDetails.vehicleApps.table.brand': string;
  'partDetails.vehicleApps.table.model': string;
  'partDetails.vehicleApps.table.yearRange': string;
  'partDetails.vehicleApps.table.actions': string;
  'partDetails.vehicleApps.mobile.model': string;
  'partDetails.vehicleApps.mobile.years': string;

  // Table Headers for Cross References
  'partDetails.crossRefs.table.competitorSku': string;
  'partDetails.crossRefs.table.brand': string;
  'partDetails.crossRefs.table.actions': string;
  'partDetails.crossRefs.mobile.brand': string;

  // Dashboard Cross References (legacy)
  'admin.dashboard.crossReferences': string;

  // Pagination
  'pagination.previous': string;
  'pagination.next': string;
  'pagination.previousShort': string;
  'pagination.nextShort': string;

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

  // Public Interface
  'public.header.title': string;
  'public.header.admin': string;

  // Public Search
  'public.search.make': string;
  'public.search.model': string;
  'public.search.year': string;
  'public.search.skuPlaceholder': string;
  'public.search.vehicleSearchTitle': string;
  'public.search.vehicleTabShort': string;
  'public.search.skuSearchTitle': string;
  'public.search.skuTabShort': string;
  'public.search.advancedFilters': string;
  'public.search.showAdvanced': string;
  'public.search.hideAdvanced': string;
  'public.search.selectMakeFirst': string;
  'public.search.selectModelFirst': string;
  'public.search.noModelsAvailable': string;
  'public.search.noYearsAvailable': string;
  'public.search.loadingOptions': string;
  'public.search.errorTitle': string;
  'public.search.errorMessage': string;
  'public.search.searchMakes': string;
  'public.search.searchModels': string;
  'public.search.searchYears': string;

  // Public Parts List
  'public.parts.showingRange': string;
  'public.parts.showingRangeSingle': string;
  'public.parts.noResults': string;
  'public.parts.viewDetails': string;
  'public.parts.brand': string;
  'public.parts.errorTitle': string;
  'public.parts.errorMessage': string;

  // Public Part Details
  'public.partDetails.errorTitle': string;
  'public.partDetails.errorMessage': string;
  'public.partDetails.backToSearch': string;
  'public.partDetails.backToAdmin': string;
  'public.partDetails.notFound': string;
  'public.partDetails.notFoundMessage': string;
  'public.partDetails.sku': string;
  'public.partDetails.specifications': string;
  'public.partDetails.brand': string;
  'public.partDetails.type': string;
  'public.partDetails.position': string;
  'public.partDetails.abs': string;
  'public.partDetails.drive': string;
  'public.partDetails.bolts': string;
  'public.partDetails.applications': string;
  'public.partDetails.applicationsPlaceholder': string;
  'public.partDetails.references': string;
  'public.partDetails.referencesPlaceholder': string;

  // Admin Settings Page
  'admin.settings.title': string;
  'admin.settings.description': string;
  'admin.settings.language': string;
  'admin.settings.logout': string;
  'admin.settings.contactInfo.title': string;
  'admin.settings.contactInfo.email': string;
  'admin.settings.contactInfo.emailPlaceholder': string;
  'admin.settings.contactInfo.phone': string;
  'admin.settings.contactInfo.phonePlaceholder': string;
  'admin.settings.contactInfo.whatsapp': string;
  'admin.settings.contactInfo.whatsappPlaceholder': string;
  'admin.settings.contactInfo.address': string;
  'admin.settings.contactInfo.addressPlaceholder': string;
  'admin.settings.contactInfo.updated': string;
  'admin.settings.contactInfo.success': string;
  'admin.settings.contactInfo.error': string;
  'admin.settings.branding.title': string;
  'admin.settings.branding.companyName': string;
  'admin.settings.branding.companyNamePlaceholder': string;
  'admin.settings.branding.logo': string;
  'admin.settings.branding.uploadLogo': string;
  'admin.settings.branding.uploading': string;
  'admin.settings.branding.logoFormat': string;
  'admin.settings.branding.favicon': string;
  'admin.settings.branding.uploadFavicon': string;
  'admin.settings.branding.faviconFormat': string;
  'admin.settings.branding.banner': string;
  'admin.settings.branding.uploadBanner': string;
  'admin.settings.branding.bannerFormat': string;
  'admin.settings.branding.uploadSuccess': string;
  'admin.settings.branding.uploadFailed': string;
  'admin.settings.branding.updated': string;
  'admin.settings.branding.success': string;
  'admin.settings.branding.error': string;
  'admin.settings.actions.save': string;
  'admin.settings.actions.saving': string;

  // Contact FABs (Floating Action Buttons)
  'contactFabs.ariaLabel': string;
  'contactFabs.whatsapp.ariaLabel': string;
  'contactFabs.whatsapp.tooltip': string;
  'contactFabs.email.ariaLabel': string;
  'contactFabs.email.tooltip': string;

  // Footer
  'footer.contact.whatsapp': string;
  'footer.contact.email': string;
  'footer.contact.location': string;
  'footer.copyright': string;
}