// i18n types for ACR Automotive

export type Locale = "en" | "es";

// Industry standard translation keys with hierarchical namespacing
export interface TranslationKeys {
  // Admin Header
  "admin.header.title": string;
  "admin.header.admin": string;
  "admin.dashboard.title": string;
  "admin.header.languageToggle": string;
  "admin.header.publicSearch": string;
  "admin.header.documentation": string;
  "admin.header.settings": string;
  "admin.header.users": string;

  // Desktop nav short labels
  "admin.nav.search": string;
  "admin.nav.admin": string;
  "admin.nav.users": string;
  "admin.nav.settings": string;
  "admin.nav.portal": string;
  "admin.nav.docs": string;

  // Language names
  "common.language.en": string;
  "common.language.es": string;

  // Admin Users Management
  "admin.users.title": string;
  "admin.users.description": string;
  "admin.users.addUser": string;
  "admin.users.edit": string;
  "admin.users.deactivate": string;
  "admin.users.allUsers": string;
  "admin.users.activeAdmins": string;
  "admin.users.dataManagers": string;
  "admin.users.inactiveUsers": string;
  "admin.users.noName": string;
  "admin.users.joined": string;
  "admin.users.lastLogin": string;
  "admin.users.never": string;
  "admin.users.active": string;
  "admin.users.inactive": string;
  "admin.users.roleAdmin": string;
  "admin.users.roleDataManager": string;
  "admin.users.owner": string;
  "admin.users.confirmDeactivateTitle": string;
  "admin.users.confirmDeactivate": string;
  "admin.users.deactivateError": string;
  "admin.users.reactivate": string;
  "admin.users.reactivateError": string;
  "admin.users.delete": string;
  "admin.users.confirmDeleteTitle": string;
  "admin.users.confirmDelete": string;
  "admin.users.deleteError": string;
  "admin.users.loadError": string;
  "admin.users.errorTitle": string;
  // Add User Modal
  "admin.users.modal.title": string;
  "admin.users.modal.description": string;
  "admin.users.modal.email": string;
  "admin.users.modal.emailPlaceholder": string;
  "admin.users.modal.emailInvalid": string;
  "admin.users.modal.fullName": string;
  "admin.users.modal.fullNameOptional": string;
  "admin.users.modal.password": string;
  "admin.users.modal.passwordPlaceholder": string;
  "admin.users.modal.passwordTooShort": string;
  "admin.users.modal.confirmPassword": string;
  "admin.users.modal.confirmPasswordPlaceholder": string;
  "admin.users.modal.passwordMismatch": string;
  "admin.users.modal.role": string;
  "admin.users.modal.dataManagerTitle": string;
  "admin.users.modal.dataManagerDesc": string;
  "admin.users.modal.recommended": string;
  "admin.users.modal.adminTitle": string;
  "admin.users.modal.adminDesc": string;
  "admin.users.modal.createError": string;
  "admin.users.modal.cancel": string;
  "admin.users.modal.submit": string;
  "admin.users.modal.creating": string;
  // Edit User Modal
  "admin.users.editModal.title": string;
  "admin.users.editModal.fullName": string;
  "admin.users.editModal.fullNamePlaceholder": string;
  "admin.users.editModal.cancel": string;
  "admin.users.editModal.save": string;
  "admin.users.editModal.saving": string;
  "admin.users.editModal.updateError": string;

  // Admin Dashboard
  "admin.dashboard.totalParts": string;
  "admin.dashboard.applications": string;
  "admin.dashboard.catalogTitle": string;

  // Admin Import
  "admin.import.title": string;
  "admin.import.cardDescription": string;
  "admin.import.pageTitle": string;
  "admin.import.pageDescription": string;
  "admin.import.steps.upload": string;
  "admin.import.steps.validate": string;
  "admin.import.steps.preview": string;
  "admin.import.steps.reviewChanges": string;
  "admin.import.steps.confirm": string;
  "admin.import.steps.completed": string;
  "admin.import.steps.inProgress": string;
  "admin.import.steps.pending": string;
  "admin.import.buttons.next": string;
  "admin.import.buttons.back": string;
  "admin.import.buttons.cancel": string;
  "admin.import.buttons.import": string;
  "admin.import.buttons.done": string;
  "admin.import.buttons.startNew": string;
  "admin.import.buttons.returnToDashboard": string;
  "admin.import.upload.dragDrop": string;
  "admin.import.upload.orClickBrowse": string;
  "admin.import.upload.accepted": string;
  "admin.import.upload.chooseFile": string;
  "admin.import.upload.fileUploaded": string;
  "admin.import.upload.parsing": string;
  "admin.import.upload.parsed": string;
  "admin.import.upload.error": string;
  "admin.import.upload.errorOnlyXlsx": string;
  "admin.import.upload.errorFileSize": string;
  "admin.import.upload.requirements": string;
  "admin.import.upload.reqFileFormat": string;
  "admin.import.upload.reqMaxSize": string;
  "admin.import.upload.reqSheets": string;
  "admin.import.upload.reqTemplate": string;
  "admin.import.upload.uploadCorrectedFile": string;
  "admin.import.upload.issueFound": string;
  "admin.import.upload.issuesFound": string;
  "admin.import.upload.fixIssuesPrompt": string;

  // Validation Error Messages (E1-E19)
  "admin.import.errors.e1": string;
  "admin.import.errors.e2": string;
  "admin.import.errors.e3": string;
  "admin.import.errors.e4": string;
  "admin.import.errors.e5.vehicle": string;
  "admin.import.errors.e5.crossref": string;
  "admin.import.errors.e6": string;
  "admin.import.errors.e7": string;
  "admin.import.errors.e8": string;
  "admin.import.errors.e9": string;
  "admin.import.errors.e10": string;
  "admin.import.errors.e11": string;
  "admin.import.errors.e12": string;
  "admin.import.errors.e13": string;
  "admin.import.errors.e14": string;
  "admin.import.errors.e15": string;
  "admin.import.errors.e16": string;
  "admin.import.errors.e17": string;
  "admin.import.errors.e18": string;
  "admin.import.errors.e19": string;

  "admin.import.validation.validating": string;
  "admin.import.validation.failed": string;
  "admin.import.validation.errorsFound": string;
  "admin.import.validation.warningsFound": string;
  "admin.import.validation.fix": string;
  "admin.import.validation.acknowledge": string;
  "admin.import.validation.errorsBySheet": string;
  "admin.import.validation.warningsBySheet": string;
  "admin.import.validation.success": string;
  "admin.import.validation.successDesc": string;
  "admin.import.validation.error": string;
  "admin.import.validation.warning": string;
  "admin.import.validation.errors": string;
  "admin.import.validation.warnings": string;
  "admin.import.validation.reviewWarnings": string;
  "admin.import.preview.added": string;
  "admin.import.preview.updated": string;
  "admin.import.preview.deleted": string;
  "admin.import.preview.parts": string;
  "admin.import.preview.totalChanges": string;
  "admin.import.preview.warningDeletes": string;
  "admin.import.preview.calculating": string;
  "admin.import.preview.new": string;
  "admin.import.preview.systemUpdates": string;
  "admin.import.preview.partChanges": string;
  "admin.import.preview.newParts": string;
  "admin.import.preview.updatedParts": string;
  "admin.import.preview.deletedParts": string;
  "admin.import.preview.loadMore": string;
  "admin.import.preview.showAll": string;
  "admin.import.preview.cascadeWarning": string;
  "admin.import.preview.cascadeDesc": string;
  "admin.import.preview.cascadeAck": string;
  "admin.import.preview.dataWarnings": string;
  "admin.import.preview.dataWarningsAck": string;
  "admin.import.preview.systemUpdatesDesc": string;
  "admin.import.preview.vaMetadata": string;
  "admin.import.preview.crMetadata": string;
  "admin.import.preview.routineMaintenance": string;
  "admin.import.preview.willRemove": string;
  "admin.import.preview.willRemoveItems": string;
  "admin.import.preview.andCrossRefs": string;
  "admin.import.confirm.ready": string;
  "admin.import.confirm.changesWillBeApplied": string;
  "admin.import.confirm.partsAdded": string;
  "admin.import.confirm.partsUpdated": string;
  "admin.import.confirm.partsDeleted": string;
  "admin.import.confirm.vehicleAppsAdded": string;
  "admin.import.confirm.crossRefsUpdated": string;
  "admin.import.confirm.snapshotCreated": string;
  "admin.import.confirm.importing": string;
  "admin.import.confirm.creatingSnapshot": string;
  "admin.import.confirm.validatingData": string;
  "admin.import.confirm.applyingChanges": string;
  "admin.import.confirm.savingHistory": string;
  "admin.import.confirm.pleaseWait": string;
  "admin.import.confirm.doNotClose": string;
  "admin.import.success.title": string;
  "admin.import.success.importId": string;
  "admin.import.success.completed": string;
  "admin.import.success.changesApplied": string;
  "admin.import.success.snapshotSaved": string;
  "admin.import.success.executionTime": string;
  "admin.import.success.completedDesc": string;
  "admin.import.success.importIdLabel": string;
  "admin.import.success.executionTimeLabel": string;
  "admin.import.success.viewDetails": string;
  "admin.import.success.hideDetails": string;
  "admin.import.success.partsLabel": string;
  "admin.import.success.partsAdded": string;
  "admin.import.success.partsUpdated": string;
  "admin.import.success.partsDeleted": string;
  "admin.import.success.morePartsNotShown": string;
  "admin.import.success.snapshotInfo": string;
  "admin.import.success.snapshotDesc": string;
  "admin.import.error.title": string;
  "admin.import.error.duplicateParts": string;
  "admin.import.error.duplicateDesc": string;
  "admin.import.error.duplicateSuggestion": string;
  "admin.import.error.foreignKey": string;
  "admin.import.error.foreignKeyDesc": string;
  "admin.import.error.foreignKeySuggestion": string;
  "admin.import.error.missingRequired": string;
  "admin.import.error.missingRequiredDesc": string;
  "admin.import.error.missingRequiredSuggestion": string;
  "admin.import.error.timeout": string;
  "admin.import.error.timeoutDesc": string;
  "admin.import.error.timeoutSuggestion": string;
  "admin.import.error.generic": string;
  "admin.import.error.genericSuggestion": string;
  "admin.import.error.technicalDetails": string;
  "admin.import.error.tryAgain": string;
  "admin.import.error.suggestionLabel": string;
  "admin.import.rollback.confirm": string;
  "admin.import.rollback.desc": string;
  "admin.import.rollback.addedRemoved": string;
  "admin.import.rollback.addedRemovedDesc": string;
  "admin.import.rollback.updatedReverted": string;
  "admin.import.rollback.updatedRevertedDesc": string;
  "admin.import.rollback.deletedRestored": string;
  "admin.import.rollback.deletedRestoredDesc": string;
  "admin.import.rollback.warning": string;
  "admin.import.rollback.cancel": string;
  "admin.import.rollback.confirm.button": string;
  "admin.import.rollback.inProgress": string;
  "admin.import.rollback.button": string;
  "admin.import.rollback.record": string;
  "admin.import.rollback.records": string;
  "admin.import.processing": string;

  // Import Upload — Guidance Panel & Upload Improvements
  "admin.import.upload.downloadCatalog": string;
  "admin.import.upload.downloadCatalogDesc": string;
  "admin.import.upload.downloadingCatalog": string;
  "admin.import.upload.formatGuide": string;
  "admin.import.upload.requiredSheets": string;
  "admin.import.upload.optionalSheets": string;
  "admin.import.upload.lastImport": string;
  "admin.import.upload.lastImportAgo": string;
  "admin.import.upload.fileContents": string;
  "admin.import.upload.partsRows": string;
  "admin.import.upload.vehicleAppRows": string;
  "admin.import.upload.crossRefRows": string;
  "admin.import.upload.aliasRows": string;
  "admin.import.upload.rows": string;

  // Import Upload — Multi-Phase Progress
  "admin.import.upload.phaseUploading": string;
  "admin.import.upload.phaseValidating": string;
  "admin.import.upload.phasePreview": string;

  // Import Upload — Error Report Download
  "admin.import.upload.downloadErrors": string;
  "admin.import.upload.downloadErrorsDesc": string;
  "admin.import.upload.errorsBySheet": string;
  "admin.import.upload.showAllErrors": string;
  "admin.import.upload.showLessErrors": string;

  // Import Preview — Entity Change Preview Tabs
  "admin.import.preview.vehicleAppChanges": string;
  "admin.import.preview.crossRefChanges": string;
  "admin.import.preview.aliasChanges": string;
  "admin.import.preview.newVehicleApps": string;
  "admin.import.preview.deletedVehicleApps": string;
  "admin.import.preview.updatedVehicleApps": string;
  "admin.import.preview.newCrossRefs": string;
  "admin.import.preview.deletedCrossRefs": string;
  "admin.import.preview.noChanges": string;
  "admin.import.preview.noChangesDesc": string;
  "admin.import.preview.newRecords": string;
  "admin.import.preview.toUpdate": string;
  "admin.import.preview.toDelete": string;
  "admin.import.preview.unchangedRecords": string;
  "admin.import.preview.changes": string;

  // Import History Panel
  "admin.import.history.recentImports": string;
  "admin.import.history.viewAll": string;
  "admin.import.history.noHistory": string;
  "admin.import.history.showHistory": string;
  "admin.import.history.hideHistory": string;

  // Import Success Enhancements
  "admin.import.success.viewParts": string;
  "admin.import.success.whatNext": string;
  "admin.import.success.inlineSummary": string;
  "admin.import.success.rollbackHint": string;

  // Import History Panel — inline labels
  "admin.import.history.added": string;
  "admin.import.history.updated": string;
  "admin.import.history.deleted": string;
  "admin.import.history.noChanges": string;

  // Import Upload — inline labels
  "admin.import.upload.row": string;
  "admin.import.upload.value": string;
  "admin.import.upload.justNow": string;
  "admin.import.upload.minutesAgo": string;
  "admin.import.upload.hoursAgo": string;
  "admin.import.upload.daysAgo": string;

  // Import Preview — diff labels
  "admin.import.preview.fieldAdded": string;
  "admin.import.preview.fieldRemoved": string;
  "admin.import.preview.fieldWas": string;
  "admin.import.preview.fieldNow": string;
  "admin.import.preview.row": string;

  // Import Toast Messages
  "admin.import.toast.validationErrorTitle": string;
  "admin.import.toast.validationErrorDesc": string;
  "admin.import.toast.previewErrorTitle": string;
  "admin.import.toast.previewErrorDesc": string;
  "admin.import.toast.importSuccessTitle": string;
  "admin.import.toast.importSuccessDesc": string;
  "admin.import.toast.importFailedTitle": string;
  "admin.import.toast.importFailedDesc": string;
  "admin.import.toast.rollbackSuccessTitle": string;
  "admin.import.toast.rollbackSuccessDesc": string;
  "admin.import.toast.rollbackFailedTitle": string;
  "admin.import.toast.rollbackFailedDesc": string;

  // Admin Dashboard Quick Actions
  "admin.dashboard.quickActions": string;
  "admin.dashboard.quickActionsDescription": string;
  "admin.quickActions.import": string;
  "admin.quickActions.importDescription": string;
  "admin.quickActions.addPart": string;
  "admin.quickActions.addPartDescription": string;
  "admin.quickActions.uploadImages": string;
  "admin.quickActions.uploadImagesDescription": string;
  "admin.quickActions.settings": string;
  "admin.quickActions.settingsDescription": string;
  "admin.quickActions.export": string;
  "admin.quickActions.exportDescription": string;

  // Admin Filters
  "admin.filters.toggle": string;
  "admin.filters.active": string;
  "admin.filters.showFilters": string;
  "admin.filters.hideFilters": string;
  "admin.filters.applyFilters": string;
  "admin.filters.clearFilters": string;
  "admin.filters.activeFilters": string;

  // Admin Search & Filters
  "admin.search.placeholder": string;
  "admin.search.partType": string;
  "admin.search.position": string;

  // Admin Parts List
  "admin.parts.newButton": string;
  "admin.parts.sku": string;
  "admin.parts.actions": string;
  "admin.parts.abs": string;
  "admin.parts.specifications": string;
  "admin.parts.applications": string;
  "admin.parts.crossReferences": string;
  "admin.parts.vehicles": string;
  "admin.parts.vehicle": string;
  "admin.parts.references": string;
  "admin.parts.reference": string;
  "admin.parts.vehicleApplications": string;
  "admin.parts.dataRelations": string;
  "admin.parts.details": string;
  "admin.parts.pagination": string;
  "admin.parts.noVehicleApplications": string;
  "admin.parts.addVehicleApplication": string;
  "admin.parts.noCrossReferences": string;
  "admin.parts.addCrossReference": string;
  "admin.parts.deleteVehicleApplicationError": string;
  "admin.parts.deleteCrossReferenceError": string;
  "common.actions.clearFilters": string;
  "common.actions.back": string;
  "common.actions.saving": string;
  "common.actions.discard": string;
  "common.actions.select": string;
  "common.actions.creating": string;
  "common.actions.createPart": string;
  "common.search": string;

  // Confirmation Dialogs
  "common.confirm.unsavedChanges.title": string;
  "common.confirm.unsavedChanges.description": string;

  // Common Actions
  "common.actions.view": string;
  "common.actions.edit": string;
  "common.actions.save": string;
  "common.actions.cancel": string;
  "common.actions.delete": string;
  "common.actions.search": string;
  "common.actions.searchBy": string;
  "common.actions.all": string;

  // Common States
  "common.loading": string;
  "common.error": string;
  "common.error.generic": string;
  "common.error.title": string;
  "common.error.tryAgain": string;
  "common.success": string;
  "common.notAvailable": string;
  "common.notSpecified": string;
  "common.readOnly": string;

  // ComboBox Component
  "comboBox.noResults": string;
  "comboBox.noMatchesAddNew": string;
  "comboBox.addValue": string;

  // Part Types & Positions
  "parts.types.maza": string;
  "parts.types.disco": string;
  "parts.types.balero": string;
  "parts.types.amortiguador": string;
  "parts.types.birlos": string;
  "parts.positions.delantera": string;
  "parts.positions.delantero": string;
  "parts.positions.trasera": string;
  "parts.positions.trasero": string;

  // ABS Types
  "parts.abs.with": string; // C/ABS -> Con ABS
  "parts.abs.without": string; // S/ABS -> Sin ABS

  // Drive Types
  "parts.drive.4x2": string;
  "parts.drive.4x4": string;

  // Workflow Status (Phase 5)
  "parts.status.label": string;
  "parts.status.active": string;
  "parts.status.inactive": string;
  "parts.status.delete": string;

  // Field labels for specs display
  "parts.labels.position": string;
  "parts.labels.abs": string;
  "parts.labels.drive": string;
  "parts.labels.bolts": string;
  "parts.labels.boltPattern": string;
  "parts.labels.noNotes": string;

  // Part Details Page
  "partDetails.breadcrumb.parts": string;
  "partDetails.status.active": string;

  // Part Completion Status
  "partDetails.completion.title": string;
  "partDetails.completion.basicInfo": string;
  "partDetails.completion.media": string;
  "partDetails.completion.applications": string;
  "partDetails.completion.crossReferences": string;
  "partDetails.completion.nextStep": string;

  // Part Details Sidebar
  "partDetails.sidebar.identity": string;
  "partDetails.sidebar.identitySubtitle": string;
  "partDetails.sidebar.quickStats": string;
  "partDetails.sidebar.completionSubtitle": string;
  "partDetails.sidebar.primaryActions": string;

  // Part Details Tabs
  "partDetails.tabs.basicInfo": string;
  "partDetails.tabs.applications": string;
  "partDetails.tabs.crossReferences": string;
  "partDetails.tabs.media": string;
  "partDetails.tabs.history": string;

  // Part Details Media
  "partDetails.media.productImages": string;
  "partDetails.media.viewer360": string;

  "partDetails.actions.preview": string;
  "partDetails.actions.saveChanges": string;
  "partDetails.actions.uploadImage": string;

  // Part Details Header
  "partDetails.header.partLabel": string;
  "partDetails.header.specifications": string;

  // Part Details Actions
  "partDetails.actions.saveSuccess": string;
  "partDetails.actions.saveError": string;
  "partDetails.empty.noApplications": string;
  "partDetails.empty.applicationsDescription": string;
  "partDetails.empty.addFirstApplication": string;
  "partDetails.empty.noCrossReferences": string;
  "partDetails.empty.crossReferencesDescription": string;
  "partDetails.empty.addFirstReference": string;
  "partDetails.quickStats.applications": string;
  "partDetails.quickStats.crossReferences": string;
  "partDetails.applications.title": string;
  "partDetails.applications.vehicles": string;
  "partDetails.applications.search": string;
  "partDetails.applications.add": string;
  "partDetails.applications.addFirst": string;
  "partDetails.applications.emptyTitle": string;
  "partDetails.applications.emptyDescription": string;
  "partDetails.crossReferences.title": string;
  "partDetails.crossReferences.references": string;
  "partDetails.crossReferences.search": string;
  "partDetails.crossReferences.add": string;
  "partDetails.crossReferences.addFirst": string;
  "partDetails.crossReferences.emptyTitle": string;
  "partDetails.crossReferences.emptyDescription": string;
  "partDetails.basicInfo.title": string;
  "partDetails.basicInfo.subtitle": string;
  "partDetails.basicInfo.primaryInfo": string;
  "partDetails.basicInfo.specifications": string;
  "partDetails.basicInfo.additionalInfo": string;
  "partDetails.basicInfo.acrSku": string;
  "partDetails.basicInfo.description": string;
  "partDetails.basicInfo.type": string;
  "partDetails.basicInfo.drive": string;
  "partDetails.basicInfo.notes": string;
  "partDetails.basicInfo.notesPlaceholder": string;
  "partDetails.basicInfo.skuNote": string;
  "partDetails.basicInfo.partType": string;
  "partDetails.basicInfo.position": string;
  "partDetails.basicInfo.absType": string;
  "partDetails.basicInfo.boltPattern": string;
  "partDetails.basicInfo.driveType": string;
  "partDetails.basicInfo.additionalSpecs": string;
  "partDetails.basicInfo.productImage": string;
  "partDetails.basicInfo.imageUploadText": string;
  "partDetails.basicInfo.imageFormat": string;
  "partDetails.basicInfo.selectFile": string;
  "partDetails.navigation.backToList": string;
  "partDetails.metadata.created": string;
  "partDetails.metadata.lastModified": string;
  "partDetails.metadata.separator": string;

  // Part Images Section
  "partDetails.images.title": string;
  "partDetails.images.uploadButton": string;
  "partDetails.images.uploading": string;
  "partDetails.images.emptyTitle": string;
  "partDetails.images.emptyDescription": string;
  "partDetails.images.uploadFirst": string;
  "partDetails.images.limitReached": string;
  "partDetails.images.limitDescription": string;
  "partDetails.images.tooMany": string;
  "partDetails.images.remainingSlots": string;
  "partDetails.images.filesSkipped": string;
  "partDetails.images.uploadSuccess": string;
  "partDetails.images.uploadFailed": string;
  "partDetails.images.deleteSuccess": string;
  "partDetails.images.deleteFailed": string;
  "partDetails.images.setPrimarySuccess": string;
  "partDetails.images.setPrimaryFailed": string;
  "partDetails.images.updateFailed": string;
  "partDetails.images.reorderFailed": string;
  "partDetails.images.primary": string;
  "partDetails.images.captionPlaceholder": string;
  "partDetails.images.deleteConfirm": string;
  "partDetails.images.setPrimaryTooltip": string;
  "partDetails.images.deleteTooltip": string;
  "partDetails.images.dragTipLabel": string;
  "partDetails.images.dragTip": string;
  "partDetails.images.slotFront": string;
  "partDetails.images.slotBack": string;
  "partDetails.images.slotTop": string;
  "partDetails.images.slotOther": string;
  "partDetails.images.replaceImage": string;
  "partDetails.images.clickToUpload": string;

  // Part Media Tabs
  "partDetails.media.title": string;
  "partDetails.media.subtitle": string;
  "partDetails.media.photosTab": string;
  "partDetails.media.viewer360Tab": string;

  // 360° Viewer
  "partDetails.viewer360.title": string;
  "partDetails.viewer360.frames": string;
  "partDetails.viewer360.uploadButton": string;
  "partDetails.viewer360.uploading": string;
  "partDetails.viewer360.dragToUpload": string;
  "partDetails.viewer360.imageRequirements": string;
  "partDetails.viewer360.uploadSuccess": string;
  "partDetails.viewer360.activeTitle": string;
  "partDetails.viewer360.activeDescription": string;
  "partDetails.viewer360.replaceButton": string;
  "partDetails.viewer360.deleteButton": string;
  "partDetails.viewer360.deleteConfirm": string;
  "partDetails.viewer360.deleteSuccess": string;
  "partDetails.viewer360.minFramesError": string;
  "partDetails.viewer360.maxFramesError": string;
  "partDetails.viewer360.currentCount": string;
  "partDetails.viewer360.recommendedWarning": string;
  "partDetails.viewer360.proceedQuestion": string;
  "partDetails.viewer360.invalidFileType": string;
  "partDetails.viewer360.fileSizeError": string;
  "partDetails.viewer360.filesSkipped": string;
  "partDetails.viewer360.processing": string;
  "partDetails.viewer360.processingFrames": string;
  "partDetails.viewer360.reorderInstructions": string;
  "partDetails.viewer360.dragToReorder": string;
  "partDetails.viewer360.confirmUpload": string;
  "partDetails.viewer360.requirementsTitle": string;
  "partDetails.viewer360.frameCountRequirement": string;
  "partDetails.viewer360.fileTypeRequirement": string;
  "partDetails.viewer360.fileSizeRequirement": string;
  "partDetails.viewer360.sequentialRequirement": string;
  "partDetails.viewer360.previewAlt": string;
  "partDetails.viewer360.loading": string;
  "partDetails.media.loading": string;
  "partDetails.viewer360.dragToRotate": string;
  "partDetails.viewer360.validationError": string;
  "partDetails.viewer360.thumbnailAlt": string;
  "partDetails.viewer360.clickToView": string;

  // Table Headers for Vehicle Applications
  "partDetails.vehicleApps.table.brand": string;
  "partDetails.vehicleApps.table.model": string;
  "partDetails.vehicleApps.table.yearRange": string;
  "partDetails.vehicleApps.table.actions": string;
  "partDetails.vehicleApps.mobile.model": string;
  "partDetails.vehicleApps.mobile.years": string;

  // Table Headers for Cross References
  "partDetails.crossRefs.table.competitorSku": string;
  "partDetails.crossRefs.table.brand": string;
  "partDetails.crossRefs.table.actions": string;
  "partDetails.crossRefs.mobile.brand": string;

  // Dashboard Cross References (legacy)
  "admin.dashboard.crossReferences": string;

  // Pagination
  "pagination.previous": string;
  "pagination.next": string;
  "pagination.previousShort": string;
  "pagination.nextShort": string;

  // Modal Labels
  "forms.labels.brand": string;
  "forms.labels.model": string;
  "forms.labels.startYear": string;
  "forms.labels.endYear": string;
  "forms.labels.competitorSku": string;
  "forms.labels.competitorBrand": string;
  "forms.placeholders.startYear": string;
  "forms.placeholders.endYear": string;
  "forms.placeholders.make": string;
  "forms.placeholders.model": string;
  "forms.placeholders.competitorSku": string;
  "forms.placeholders.competitorBrand": string;

  // Modal Titles and Descriptions
  "modals.editVehicleApplication.title": string;
  "modals.editVehicleApplication.description": string;
  "modals.addVehicleApplication.title": string;
  "modals.addVehicleApplication.description": string;
  "modals.editCrossReference.title": string;
  "modals.editCrossReference.description": string;
  "modals.addCrossReference.title": string;
  "modals.addCrossReference.description": string;

  // Public Interface
  "public.header.title": string;
  "public.header.admin": string;

  // Public Search
  "public.search.make": string;
  "public.search.model": string;
  "public.search.year": string;
  "public.search.skuPlaceholder": string;
  "public.search.vehicleSearchTitle": string;
  "public.search.vehicleTabShort": string;
  "public.search.skuSearchTitle": string;
  "public.search.skuTabShort": string;
  "public.search.advancedFilters": string;
  "public.search.showAdvanced": string;
  "public.search.hideAdvanced": string;
  "public.search.selectMakeFirst": string;
  "public.search.selectModelFirst": string;
  "public.search.noModelsAvailable": string;
  "public.search.noYearsAvailable": string;
  "public.search.loadingOptions": string;
  "public.search.errorTitle": string;
  "public.search.errorMessage": string;
  "public.search.searchMakes": string;
  "public.search.searchModels": string;
  "public.search.searchYears": string;

  // Public Parts List
  "public.parts.showingRange": string;
  "public.parts.showingRangeSingle": string;
  "public.parts.noResults": string;
  "public.parts.noResultsTitle": string;
  "public.parts.noResultsMessage": string;
  "public.parts.noResultsSuggestion": string;
  "public.parts.clearSearch": string;
  "public.parts.viewDetails": string;
  "public.parts.brand": string;
  "public.parts.errorTitle": string;
  "public.parts.errorMessage": string;

  // Public Part Details
  "public.partDetails.errorTitle": string;
  "public.partDetails.errorMessage": string;
  "public.partDetails.backToSearch": string;
  "public.partDetails.backToAdmin": string;
  "public.partDetails.notFound": string;
  "public.partDetails.notFoundMessage": string;
  "public.partDetails.sku": string;
  "public.partDetails.specifications": string;
  "public.partDetails.brand": string;
  "public.partDetails.type": string;
  "public.partDetails.position": string;
  "public.partDetails.abs": string;
  "public.partDetails.drive": string;
  "public.partDetails.bolts": string;
  "public.partDetails.applications": string;
  "public.partDetails.applicationsPlaceholder": string;
  "public.partDetails.references": string;
  "public.partDetails.referencesPlaceholder": string;

  // Admin Settings Page
  "admin.settings.title": string;
  "admin.settings.description": string;
  "admin.settings.language": string;
  "admin.settings.logout": string;
  "admin.settings.back": string;
  "admin.settings.backToAdmin": string;
  "admin.settings.backToSearch": string;
  "admin.settings.tabs.contact": string;
  "admin.settings.tabs.branding": string;
  "admin.settings.tabs.history": string;
  "admin.settings.contactInfo.title": string;
  "admin.settings.contactInfo.sectionTitle": string;
  "admin.settings.contactInfo.email": string;
  "admin.settings.contactInfo.emailPlaceholder": string;
  "admin.settings.contactInfo.phone": string;
  "admin.settings.contactInfo.phonePlaceholder": string;
  "admin.settings.contactInfo.whatsapp": string;
  "admin.settings.contactInfo.whatsappPlaceholder": string;
  "admin.settings.contactInfo.address": string;
  "admin.settings.contactInfo.addressPlaceholder": string;
  "admin.settings.contactInfo.updated": string;
  "admin.settings.contactInfo.success": string;
  "admin.settings.contactInfo.error": string;
  "admin.settings.branding.identity": string;
  "admin.settings.branding.bannersSection": string;
  "admin.settings.branding.companyName": string;
  "admin.settings.branding.companyNamePlaceholder": string;
  "admin.settings.branding.logo": string;
  "admin.settings.branding.uploadLogo": string;
  "admin.settings.branding.uploading": string;
  "admin.settings.branding.logoFormat": string;
  "admin.settings.branding.favicon": string;
  "admin.settings.branding.uploadFavicon": string;
  "admin.settings.branding.faviconFormat": string;
  "admin.settings.branding.banner": string;
  "admin.settings.branding.uploadBanner": string;
  "admin.settings.branding.uploadImage": string;
  "admin.settings.branding.bannerFormat": string;
  "admin.settings.branding.uploadSuccess": string;
  "admin.settings.branding.uploadFailed": string;
  "admin.settings.branding.updated": string;
  "admin.settings.branding.success": string;
  "admin.settings.branding.error": string;
  "admin.settings.branding.banners": string;
  "admin.settings.branding.addBanner": string;
  "admin.settings.branding.addFirstBanner": string;
  "admin.settings.branding.noBanners": string;
  "admin.settings.branding.active": string;
  "admin.settings.branding.untitled": string;
  "admin.settings.branding.desktopImage": string;
  "admin.settings.branding.mobileImage": string;
  "admin.settings.branding.optional": string;
  "admin.settings.branding.recommendedSize": string;
  "admin.settings.branding.title": string;
  "admin.settings.branding.titlePlaceholder": string;
  "admin.settings.branding.subtitle": string;
  "admin.settings.branding.subtitlePlaceholder": string;
  "admin.settings.branding.ctaText": string;
  "admin.settings.branding.ctaTextPlaceholder": string;
  "admin.settings.branding.ctaLink": string;
  "admin.settings.branding.ctaLinkPlaceholder": string;
  "admin.settings.branding.collapse": string;
  "admin.settings.branding.deleteBannerConfirm": string;
  "admin.settings.importHistory.sectionTitle": string;
  "admin.settings.actions.save": string;
  "admin.settings.actions.saving": string;

  // Contact FABs (Floating Action Buttons)
  "contactFabs.ariaLabel": string;
  "contactFabs.whatsapp.ariaLabel": string;
  "contactFabs.whatsapp.tooltip": string;
  "contactFabs.email.ariaLabel": string;
  "contactFabs.email.tooltip": string;

  // Footer
  "footer.contact.whatsapp": string;
  "footer.contact.email": string;
  "footer.contact.location": string;
  "footer.copyright": string;

  // Admin Upload Images Dashboard
  "admin.uploadImages.title": string;
  "admin.uploadImages.description": string;
  "admin.uploadImages.howItWorks": string;
  "admin.uploadImages.step1": string;
  "admin.uploadImages.step2": string;
  "admin.uploadImages.step3": string;
  "admin.uploadImages.dragDrop": string;
  "admin.uploadImages.supportedFormats": string;
  "admin.uploadImages.uploading": string;
  "admin.uploadImages.uploadedImages": string;
  "admin.uploadImages.sessionNote": string;
  "admin.uploadImages.copiedBadge": string;
  "admin.uploadImages.imageCount": string;
  "admin.uploadImages.copyUrl": string;
  "admin.uploadImages.copied": string;
  "admin.uploadImages.urlCopied": string;
  "admin.uploadImages.deleteImage": string;
  "admin.uploadImages.deleteNote": string;
  "admin.uploadImages.noImages": string;
  "admin.uploadImages.noImagesHint": string;
  "admin.uploadImages.errorInvalidType": string;
  "admin.uploadImages.errorTooLarge": string;
  "admin.uploadImages.errorUploadFailed": string;

  // Data Portal (for data managers)
  "portal.title": string;
  "portal.welcome": string;
  "portal.description": string;
  "portal.quickActions": string;
  "portal.import.title": string;
  "portal.import.description": string;
  "portal.export.title": string;
  "portal.export.description": string;
  "portal.docs.title": string;
  "portal.docs.description": string;
  "portal.docs.importing": string;
  "portal.docs.importingDesc": string;
  "portal.docs.exporting": string;
  "portal.docs.exportingDesc": string;
  "portal.docs.images": string;
  "portal.docs.imagesDesc": string;
  "portal.docs.viewAll": string;
  "portal.helpText": string;
  "portal.uploadImages.title": string;
  "portal.uploadImages.description": string;

  // 360° Viewer - Dashboard card
  "portal.viewer360.title": string;
  "portal.viewer360.description": string;

  // 360° Viewer - Overview page
  "admin.viewer360.title": string;
  "admin.viewer360.description": string;
  "admin.viewer360.howItWorks": string;
  "admin.viewer360.step1": string;
  "admin.viewer360.step2": string;
  "admin.viewer360.step3": string;
  "admin.viewer360.statsLabel": string;
  "admin.viewer360.filterAll": string;
  "admin.viewer360.filterMissing": string;
  "admin.viewer360.confirmed": string;
  "admin.viewer360.frames": string;
  "admin.viewer360.notUploaded": string;
  "admin.viewer360.viewPublicPage": string;
  "admin.viewer360.manageFrames": string;
  "admin.viewer360.emptyTitle": string;
  "admin.viewer360.emptyDescription": string;
  "admin.viewer360.searchPlaceholder": string;
  "admin.viewer360.pagination": string;
  "admin.viewer360.filterHas360": string;

  "portal.adminBanner.title": string;
  "portal.adminBanner.description": string;
}
