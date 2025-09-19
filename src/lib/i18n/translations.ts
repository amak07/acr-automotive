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

  // Admin Dashboard
  "admin.dashboard.totalParts": {
    en: "Total Parts",
    es: "Total Piezas",
  },
  "admin.dashboard.applications": {
    en: "Applications",
    es: "Aplicaciones",
  },
  "admin.dashboard.crossReferences": {
    en: "Cross References",
    es: "Referencias Cruzadas",
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
  "admin.search.button": {
    en: "Search",
    es: "Buscar",
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
  "admin.parts.crossReferences": {
    en: "Cross References",
    es: "Referencias Cruzadas",
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

  // Search (legacy - keeping for backward compatibility)
  "search.sku": {
    en: "Search by SKU",
    es: "Búsqueda por SKU",
  },
  "search.enterSKU": {
    en: "Enter part number or SKU",
    es: "Ingrese número de pieza o SKU",
  },
  "search.noResults": {
    en: "No parts found",
    es: "No se encontraron piezas",
  },
  "search.loading": {
    en: "Searching...",
    es: "Buscando...",
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
  "partDetails.vehicleApps.title": {
    en: "Vehicle Applications",
    es: "Aplicaciones Vehiculares",
  },
  "partDetails.vehicleApps.applications": {
    en: "applications",
    es: "aplicaciones",
  },
  "partDetails.vehicleApps.addApplication": {
    en: "Add Application",
    es: "Agregar Aplicación",
  },
  "partDetails.crossRefs.title": {
    en: "Cross References",
    es: "Referencias Cruzadas",
  },
  "partDetails.crossRefs.references": {
    en: "references",
    es: "referencias",
  },
  "partDetails.crossRefs.addReference": {
    en: "Add Reference",
    es: "Agregar Referencia",
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
};
