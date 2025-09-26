/**
 * Complete Translation Dictionary
 *
 * All UI text for ACR Automotive admin interface.
 * Spanish text taken from UX screenshots and Mexican auto parts industry standards.
 * English equivalents for development and international use.
 */

import { Locale, TranslationKeys } from "./translation-keys";

export const translations: Record<
  keyof TranslationKeys,
  Record<Locale, string>
> = {
  // Admin Header
  "admin.header.title": {
    en: "Admin Management",
    es: "Administración",
  },
  "admin.header.languageToggle": {
    en: "Language",
    es: "Idioma",
  },
  "admin.header.viewPublic": {
    en: "View Public Site",
    es: "Ver Sitio Público",
  },

  // Admin Dashboard
  "admin.dashboard.totalParts": {
    en: "Total Parts",
    es: "Total Piezas",
  },
  "admin.dashboard.catalogTitle": {
    en: "Parts Catalog",
    es: "Catálogo de Piezas",
  },

  // Admin Search & Filters
  "admin.search.placeholder": {
    en: "Search by ACR SKU...",
    es: "Buscar por SKU ACR...",
  },
  "admin.search.partType": {
    en: "Part Type",
    es: "Tipo de Pieza",
  },
  "admin.search.position": {
    en: "Position",
    es: "Posición",
  },

  // Admin Parts List
  "admin.parts.newButton": {
    en: "New Part",
    es: "Nueva Pieza",
  },
  "admin.parts.sku": {
    en: "SKU",
    es: "SKU",
  },
  "admin.parts.actions": {
    en: "Actions",
    es: "Acciones",
  },
  "admin.parts.abs": {
    en: "ABS",
    es: "ABS",
  },
  "admin.parts.specifications": {
    en: "Specifications",
    es: "Especificaciones",
  },
  "admin.parts.applications": {
    en: "Applications",
    es: "Aplicaciones",
  },
  "admin.parts.crossReferences": {
    en: "Cross References",
    es: "Referencias Cruzadas",
  },
  "admin.parts.vehicles": {
    en: "vehicles",
    es: "vehículos",
  },
  "admin.parts.vehicle": {
    en: "vehicle",
    es: "vehículo",
  },
  "admin.parts.references": {
    en: "references",
    es: "referencias",
  },
  "admin.parts.reference": {
    en: "reference",
    es: "referencia",
  },
  "admin.parts.vehicleApplications": {
    en: "Vehicle Applications",
    es: "Aplicaciones de Vehículos",
  },
  "admin.parts.dataRelations": {
    en: "Data & Relations",
    es: "Datos y Relaciones",
  },
  "admin.parts.details": {
    en: "Details",
    es: "Detalles",
  },
  "admin.parts.pagination": {
    en: "Showing {{start}}-{{end}} of {{total}} parts",
    es: "Mostrando {{start}}-{{end}} de {{total}} piezas",
  },
  "admin.parts.noVehicleApplications": {
    en: "No vehicle applications",
    es: "Sin aplicaciones vehiculares",
  },
  "admin.parts.addVehicleApplication": {
    en: "Add Vehicle Application",
    es: "Agregar Aplicación Vehicular",
  },
  "admin.parts.noCrossReferences": {
    en: "No cross references",
    es: "Sin referencias cruzadas",
  },
  "admin.parts.addCrossReference": {
    en: "Add Cross Reference",
    es: "Agregar Referencia Cruzada",
  },
  "admin.parts.deleteVehicleApplicationError": {
    en: "Failed to delete vehicle application",
    es: "Error al eliminar aplicación vehicular",
  },
  "admin.parts.deleteCrossReferenceError": {
    en: "Failed to delete cross reference",
    es: "Error al eliminar referencia cruzada",
  },

  // Common Actions
  "common.actions.view": {
    en: "See Details",
    es: "Ver Detalles",
  },
  "common.actions.edit": {
    en: "Edit",
    es: "Editar",
  },
  "common.actions.save": {
    en: "Save",
    es: "Guardar",
  },
  "common.actions.cancel": {
    en: "Cancel",
    es: "Cancelar",
  },
  "common.actions.delete": {
    en: "Delete",
    es: "Eliminar",
  },
  "common.actions.search": {
    en: "Search",
    es: "Buscar",
  },
  "common.actions.all": {
    en: "All",
    es: "Todos",
  },
  "common.actions.clearFilters": {
    en: "Clear Filters",
    es: "Limpiar Filtros",
  },
  "common.actions.back": {
    en: "Back to List",
    es: "Volver a la Lista",
  },
  "common.actions.saving": {
    en: "Saving...",
    es: "Guardando...",
  },
  "common.actions.discard": {
    en: "Discard Changes",
    es: "Descartar Cambios",
  },
  "common.actions.select": {
    en: "Select...",
    es: "Seleccionar...",
  },
  "common.actions.creating": {
    en: "Creating...",
    es: "Creando...",
  },
  "common.actions.createPart": {
    en: "Create Part",
    es: "Crear Pieza",
  },
  "common.search": {
    en: "Search...",
    es: "Buscar...",
  },

  // Confirmation Dialogs
  "common.confirm.unsavedChanges.title": {
    en: "Unsaved Changes",
    es: "Cambios No Guardados",
  },
  "common.confirm.unsavedChanges.description": {
    en: "You have unsaved changes. Are you sure you want to close without saving?",
    es: "Tienes cambios no guardados. ¿Estás seguro de que quieres cerrar sin guardar?",
  },

  // Common States
  "common.loading": {
    en: "Loading...",
    es: "Cargando...",
  },
  "common.error": {
    en: "Error",
    es: "Error",
  },
  "common.error.generic": {
    en: "Something went wrong",
    es: "Algo salió mal",
  },
  "common.error.tryAgain": {
    en: "Please try again",
    es: "Por favor, inténtalo de nuevo",
  },
  "common.error.title": {
    en: "Error",
    es: "Error",
  },
  "common.success": {
    en: "Success",
    es: "Éxito",
  },
  "common.notAvailable": {
    en: "N/A",
    es: "N/D",
  },
  "common.notSpecified": {
    en: "Not Specified",
    es: "No Especificado",
  },

  // ComboBox Component
  "comboBox.noResults": {
    en: "No results found.",
    es: "No se encontraron resultados.",
  },
  "comboBox.noMatchesAddNew": {
    en: "No matches found. Type to add \"{{value}}\"",
    es: "No se encontraron coincidencias. Escriba para agregar \"{{value}}\"",
  },
  "comboBox.addValue": {
    en: "Add \"{{value}}\"",
    es: "Agregar \"{{value}}\"",
  },

  // Part Types (Technical terms - keep Spanish originals)
  "parts.types.maza": {
    en: "Wheel Hub/Bearing", // Technical translation
    es: "MAZA", // Original Spanish term used in industry
  },
  "parts.types.disco": {
    en: "Brake Disc",
    es: "Disco de Freno",
  },
  "parts.types.balero": {
    en: "Bearing",
    es: "Balero",
  },
  "parts.types.amortiguador": {
    en: "Shock Absorber",
    es: "Amortiguador",
  },
  "parts.types.birlos": {
    en: "Wheel Studs",
    es: "Birlos",
  },

  // Part Positions
  "parts.positions.delantera": {
    en: "Front",
    es: "Delantera",
  },
  "parts.positions.delantero": {
    en: "Front",
    es: "Delantero",
  },
  "parts.positions.trasera": {
    en: "Rear", 
    es: "Trasera",
  },
  "parts.positions.trasero": {
    en: "Rear",
    es: "Trasero",
  },
  
  // ABS Types
  "parts.abs.with": {
    en: "With ABS",
    es: "Con ABS",
  },
  "parts.abs.without": {
    en: "Without ABS",
    es: "Sin ABS",
  },
  
  // Drive Types
  "parts.drive.4x2": {
    en: "4x2",
    es: "4x2",
  },
  "parts.drive.4x4": {
    en: "4x4", 
    es: "4x4",
  },
  
  
  // Field labels for specs display
  "parts.labels.position": {
    en: "Position",
    es: "Posición",
  },
  "parts.labels.abs": {
    en: "ABS",
    es: "ABS",
  },
  "parts.labels.drive": {
    en: "Drive",
    es: "Tracción",
  },
  "parts.labels.bolts": {
    en: "Bolts",
    es: "Pernos",
  },
  "parts.labels.boltPattern": {
    en: "Bolt Pattern",
    es: "Patrón de Tornillos",
  },
  "parts.labels.noNotes": {
    en: "No specifications",
    es: "Sin especificaciones",
  },


  // Part Details Page
  "partDetails.breadcrumb.parts": {
    en: "Parts",
    es: "Piezas",
  },
  "partDetails.status.active": {
    en: "Active",
    es: "Activo",
  },
  "partDetails.actions.preview": {
    en: "Preview",
    es: "Vista Previa",
  },
  "partDetails.actions.saveChanges": {
    en: "Save Changes",
    es: "Guardar Cambios",
  },
  "partDetails.actions.uploadImage": {
    en: "Upload Image",
    es: "Subir Imagen",
  },
  "partDetails.header.partLabel": {
    en: "Part",
    es: "Pieza",
  },
  "partDetails.header.specifications": {
    en: "Part Specifications",
    es: "Especificaciones de la Pieza",
  },
  "partDetails.actions.saveSuccess": {
    en: "Part updated successfully",
    es: "Pieza actualizada exitosamente",
  },
  "partDetails.actions.saveError": {
    en: "Failed to update part. Please try again.",
    es: "Error al actualizar la pieza. Inténtalo de nuevo.",
  },
  "partDetails.empty.noApplications": {
    en: "No vehicle applications",
    es: "Sin aplicaciones vehiculares",
  },
  "partDetails.empty.applicationsDescription": {
    en: "Add vehicle compatibility information for this part",
    es: "Agregue información de compatibilidad vehicular para esta pieza",
  },
  "partDetails.empty.addFirstApplication": {
    en: "Add First Application",
    es: "Agregar Primera Aplicación",
  },
  "partDetails.empty.noCrossReferences": {
    en: "No cross references",
    es: "Sin referencias cruzadas",
  },
  "partDetails.empty.crossReferencesDescription": {
    en: "Add competitor SKU mappings for this part",
    es: "Agregue mapeos de SKU de competidores para esta pieza",
  },
  "partDetails.empty.addFirstReference": {
    en: "Add First Reference",
    es: "Agregar Primera Referencia",
  },
  "partDetails.quickStats.applications": {
    en: "applications",
    es: "aplicaciones",
  },
  "partDetails.quickStats.crossReferences": {
    en: "cross references",
    es: "referencias cruzadas",
  },
  "partDetails.applications.title": {
    en: "Vehicle Applications",
    es: "Aplicaciones Vehiculares",
  },
  "partDetails.applications.vehicles": {
    en: "vehicles",
    es: "vehículos",
  },
  "partDetails.applications.search": {
    en: "Search applications",
    es: "Buscar aplicaciones",
  },
  "partDetails.applications.add": {
    en: "Add Application",
    es: "Agregar Aplicación",
  },
  "partDetails.applications.addFirst": {
    en: "Add First Application",
    es: "Agregar Primera Aplicación",
  },
  "partDetails.applications.emptyTitle": {
    en: "No vehicle applications",
    es: "Sin aplicaciones vehiculares",
  },
  "partDetails.applications.emptyDescription": {
    en: "Add vehicle compatibility information for this part",
    es: "Agregue información de compatibilidad vehicular para esta pieza",
  },
  "partDetails.crossReferences.title": {
    en: "Cross References",
    es: "Referencias Cruzadas",
  },
  "partDetails.crossReferences.references": {
    en: "references",
    es: "referencias",
  },
  "partDetails.crossReferences.search": {
    en: "Search references",
    es: "Buscar referencias",
  },
  "partDetails.crossReferences.add": {
    en: "Add Reference",
    es: "Agregar Referencia",
  },
  "partDetails.crossReferences.addFirst": {
    en: "Add First Reference",
    es: "Agregar Primera Referencia",
  },
  "partDetails.crossReferences.emptyTitle": {
    en: "No cross references",
    es: "Sin referencias cruzadas",
  },
  "partDetails.crossReferences.emptyDescription": {
    en: "Add competitor SKU mappings for this part",
    es: "Agregue mapeos de SKU de competidores para esta pieza",
  },
  "partDetails.basicInfo.title": {
    en: "Basic Information",
    es: "Información Básica",
  },
  "partDetails.basicInfo.acrSku": {
    en: "ACR SKU",
    es: "SKU ACR",
  },
  "partDetails.basicInfo.description": {
    en: "Description",
    es: "Descripción",
  },
  "partDetails.basicInfo.type": {
    en: "Type",
    es: "Tipo",
  },
  "partDetails.basicInfo.drive": {
    en: "Drive",
    es: "Tracción",
  },
  "partDetails.basicInfo.notes": {
    en: "Notes",
    es: "Notas",
  },
  "partDetails.basicInfo.notesPlaceholder": {
    en: "Add any additional notes about this part...",
    es: "Agregue cualquier nota adicional sobre esta pieza...",
  },
  "partDetails.basicInfo.skuNote": {
    en: "SKU cannot be modified after creation",
    es: "El SKU no puede modificarse después de la creación",
  },
  "partDetails.basicInfo.partType": {
    en: "Part Type",
    es: "Tipo de Pieza",
  },
  "partDetails.basicInfo.position": {
    en: "Position",
    es: "Posición",
  },
  "partDetails.basicInfo.absType": {
    en: "ABS Type",
    es: "Tipo ABS",
  },
  "partDetails.basicInfo.boltPattern": {
    en: "Bolt Pattern",
    es: "Patrón de Tornillos",
  },
  "partDetails.basicInfo.driveType": {
    en: "Drive Type",
    es: "Tipo de Tracción",
  },
  "partDetails.basicInfo.additionalSpecs": {
    en: "Additional Specifications",
    es: "Especificaciones Adicionales",
  },
  "partDetails.basicInfo.productImage": {
    en: "Product Image",
    es: "Imagen del Producto",
  },
  "partDetails.basicInfo.imageUploadText": {
    en: "Click to upload or drag here",
    es: "Haga clic para subir o arrastre aquí",
  },
  "partDetails.basicInfo.imageFormat": {
    en: "PNG, JPG up to 10MB",
    es: "PNG, JPG hasta 10MB",
  },
  "partDetails.basicInfo.selectFile": {
    en: "Select File",
    es: "Seleccionar Archivo",
  },
  "partDetails.navigation.backToList": {
    en: "Back to List",
    es: "Volver a la Lista",
  },
  "partDetails.metadata.created": {
    en: "Created on",
    es: "Creado el",
  },
  "partDetails.metadata.lastModified": {
    en: "Last modified",
    es: "Última modificación",
  },
  "partDetails.metadata.separator": {
    en: "•",
    es: "•",
  },

  // Table Headers for Vehicle Applications
  "partDetails.vehicleApps.table.brand": {
    en: "BRAND",
    es: "MARCA",
  },
  "partDetails.vehicleApps.table.model": {
    en: "MODEL",
    es: "MODELO",
  },
  "partDetails.vehicleApps.table.yearRange": {
    en: "YEAR RANGE",
    es: "RANGO DE AÑOS",
  },
  "partDetails.vehicleApps.table.actions": {
    en: "ACTIONS",
    es: "ACCIONES",
  },
  "partDetails.vehicleApps.mobile.model": {
    en: "Model:",
    es: "Modelo:",
  },
  "partDetails.vehicleApps.mobile.years": {
    en: "Years:",
    es: "Años:",
  },

  // Table Headers for Cross References
  "partDetails.crossRefs.table.competitorSku": {
    en: "COMPETITOR SKU",
    es: "SKU COMPETIDOR",
  },
  "partDetails.crossRefs.table.brand": {
    en: "BRAND",
    es: "MARCA",
  },
  "partDetails.crossRefs.table.actions": {
    en: "ACTIONS",
    es: "ACCIONES",
  },
  "partDetails.crossRefs.mobile.brand": {
    en: "Brand:",
    es: "Marca:",
  },

  // Dashboard Cross References (legacy)
  "admin.dashboard.crossReferences": {
    en: "Cross References",
    es: "Referencias Cruzadas",
  },

  // Pagination
  "pagination.previous": {
    en: "Previous",
    es: "Anterior",
  },
  "pagination.next": {
    en: "Next",
    es: "Siguiente",
  },
  "pagination.previousShort": {
    en: "← Prev",
    es: "← Ant",
  },
  "pagination.nextShort": {
    en: "Next →",
    es: "Sig →",
  },


  // Modal Labels
  "forms.labels.brand": {
    en: "Brand",
    es: "Marca",
  },
  "forms.labels.model": {
    en: "Model",
    es: "Modelo",
  },
  "forms.labels.startYear": {
    en: "Start Year",
    es: "Año Inicial",
  },
  "forms.labels.endYear": {
    en: "End Year",
    es: "Año Final",
  },
  "forms.labels.competitorSku": {
    en: "Competitor SKU",
    es: "SKU Competidor",
  },
  "forms.labels.competitorBrand": {
    en: "Competitor Brand",
    es: "Marca Competidor",
  },
  "forms.placeholders.startYear": {
    en: "2015",
    es: "2015",
  },
  "forms.placeholders.endYear": {
    en: "2020",
    es: "2020",
  },
  "forms.placeholders.make": {
    en: "Enter vehicle make (e.g., TOYOTA, HONDA)",
    es: "Ingrese marca del vehículo (ej., TOYOTA, HONDA)",
  },
  "forms.placeholders.model": {
    en: "Enter vehicle model (e.g., CAMRY, CIVIC)",
    es: "Ingrese modelo del vehículo (ej., CAMRY, CIVIC)",
  },
  "forms.placeholders.competitorSku": {
    en: "Enter competitor part number (e.g., 12345-ABC)",
    es: "Ingrese número de pieza del competidor (ej., 12345-ABC)",
  },
  "forms.placeholders.competitorBrand": {
    en: "Enter competitor brand (optional)",
    es: "Ingrese marca del competidor (opcional)",
  },

  // Modal Titles and Descriptions
  "modals.editVehicleApplication.title": {
    en: "Edit Vehicle Application",
    es: "Editar Aplicación Vehicular",
  },
  "modals.editVehicleApplication.description": {
    en: "Update the vehicle compatibility information for this part",
    es: "Actualice la información de compatibilidad vehicular para esta pieza",
  },
  "modals.addVehicleApplication.title": {
    en: "Add Vehicle Application",
    es: "Agregar Aplicación Vehicular",
  },
  "modals.addVehicleApplication.description": {
    en: "Add vehicle compatibility information for this part",
    es: "Agregue información de compatibilidad vehicular para esta pieza",
  },
  "modals.editCrossReference.title": {
    en: "Edit Cross Reference",
    es: "Editar Referencia Cruzada",
  },
  "modals.editCrossReference.description": {
    en: "Update the competitor SKU mapping for this part",
    es: "Actualice el mapeo de SKU del competidor para esta pieza",
  },
  "modals.addCrossReference.title": {
    en: "Add Cross Reference",
    es: "Agregar Referencia Cruzada",
  },
  "modals.addCrossReference.description": {
    en: "Add competitor SKU mapping for this part",
    es: "Agregue mapeo de SKU del competidor para esta pieza",
  },

  // Public Interface
  "public.header.title": {
    en: "Product Catalogue",
    es: "Catálogo de Productos",
  },
  "public.header.admin": {
    en: "Admin",
    es: "Admin",
  },

  // Public Search
  "public.search.make": {
    en: "Select Make",
    es: "Seleccionar Marca",
  },
  "public.search.model": {
    en: "Select Model",
    es: "Seleccionar Modelo",
  },
  "public.search.year": {
    en: "Select Year",
    es: "Seleccionar Año",
  },
  "public.search.skuPlaceholder": {
    en: "Enter part number (e.g., MOC-123, DEL-456)",
    es: "Ingrese número de parte (ej: MOC-123, DEL-456)",
  },
  "public.search.vehicleSearchTitle": {
    en: "Vehicle Search",
    es: "Búsqueda por Vehículo",
  },
  "public.search.skuSearchTitle": {
    en: "Part Number Search",
    es: "Búsqueda por Número de Parte",
  },
  "public.search.advancedFilters": {
    en: "Advanced Filters",
    es: "Filtros Avanzados",
  },
  "public.search.showAdvanced": {
    en: "Or search by part number",
    es: "O buscar por número de parte",
  },
  "public.search.hideAdvanced": {
    en: "Hide part number search",
    es: "Ocultar búsqueda por número",
  },
  "public.search.selectMakeFirst": {
    en: "Please select a make first",
    es: "Primero seleccione una marca",
  },
  "public.search.selectModelFirst": {
    en: "Please select a model first",
    es: "Primero seleccione un modelo",
  },
  "public.search.noModelsAvailable": {
    en: "No models available for this make",
    es: "No hay modelos disponibles para esta marca",
  },
  "public.search.noYearsAvailable": {
    en: "No years available for this model",
    es: "No hay años disponibles para este modelo",
  },
  "public.search.loadingOptions": {
    en: "Loading options...",
    es: "Cargando opciones...",
  },
  "public.search.errorTitle": {
    en: "Unable to Load Vehicle Options",
    es: "No se Pueden Cargar las Opciones de Vehículos",
  },
  "public.search.errorMessage": {
    en: "Please try refreshing the page or contact support if the problem persists.",
    es: "Intente actualizar la página o contacte al soporte si el problema persiste.",
  },
  "public.search.searchMakes": {
    en: "Search makes...",
    es: "Buscar marcas...",
  },
  "public.search.searchModels": {
    en: "Search models...",
    es: "Buscar modelos...",
  },
  "public.search.searchYears": {
    en: "Search years...",
    es: "Buscar años...",
  },

  // Public Parts List
  "public.parts.showingRange": {
    en: "Showing {{start}}-{{end}} of {{total}} parts",
    es: "Mostrando {{start}}-{{end}} de {{total}} refacciones",
  },
  "public.parts.showingRangeSingle": {
    en: "Showing {{start}}-{{end}} of {{total}} part",
    es: "Mostrando {{start}}-{{end}} de {{total}} refacción",
  },
  "public.parts.noResults": {
    en: "No parts found",
    es: "No se encontraron refacciones",
  },
  "public.parts.viewDetails": {
    en: "View details",
    es: "Ver detalles",
  },
  "public.parts.brand": {
    en: "ACR Automotive",
    es: "Automotriz ACR",
  },
  "public.parts.errorTitle": {
    en: "Unable to Load Parts",
    es: "No se Pueden Cargar las Refacciones",
  },
  "public.parts.errorMessage": {
    en: "There was an error searching for parts. Please try again or contact support if the problem persists.",
    es: "Hubo un error al buscar refacciones. Intente nuevamente o contacte al soporte si el problema persiste.",
  },

  // Public Part Details
  "public.partDetails.errorTitle": {
    en: "Part Not Found",
    es: "Refacción No Encontrada",
  },
  "public.partDetails.errorMessage": {
    en: "The part you're looking for could not be found or may have been removed.",
    es: "La refacción que busca no se pudo encontrar o puede haber sido eliminada.",
  },
  "public.partDetails.backToSearch": {
    en: "Back to Search",
    es: "Volver a Búsqueda",
  },
  "public.partDetails.backToAdmin": {
    en: "Back to Admin",
    es: "Volver a Admin",
  },
  "public.partDetails.notFound": {
    en: "Part Not Found",
    es: "Refacción No Encontrada",
  },
  "public.partDetails.notFoundMessage": {
    en: "We couldn't find a part with that SKU. Please check the part number and try again.",
    es: "No pudimos encontrar una refacción con ese SKU. Verifique el número de parte e intente nuevamente.",
  },
  "public.partDetails.specifications": {
    en: "Specifications",
    es: "Especificaciones",
  },
  "public.partDetails.brand": {
    en: "Brand",
    es: "Marca",
  },
  "public.partDetails.position": {
    en: "Position",
    es: "Posición",
  },
  "public.partDetails.abs": {
    en: "ABS",
    es: "ABS",
  },
  "public.partDetails.drive": {
    en: "Drive",
    es: "Tracción",
  },
  "public.partDetails.bolts": {
    en: "Bolt Pattern",
    es: "Patrón de Tornillos",
  },
  "public.partDetails.applications": {
    en: "Vehicle Applications",
    es: "Aplicaciones Vehiculares",
  },
  "public.partDetails.applicationsPlaceholder": {
    en: "Vehicle compatibility information will be displayed here when available.",
    es: "La información de compatibilidad vehicular se mostrará aquí cuando esté disponible.",
  },
  "public.partDetails.references": {
    en: "Cross References",
    es: "Referencias Cruzadas",
  },
  "public.partDetails.referencesPlaceholder": {
    en: "Competitor part number cross-references will be displayed here when available.",
    es: "Las referencias cruzadas de números de parte de competidores se mostrarán aquí cuando estén disponibles.",
  },
};
