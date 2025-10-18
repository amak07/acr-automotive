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
  "admin.header.admin": {
    en: "Admin",
    es: "Admin",
  },
  "admin.header.languageToggle": {
    en: "Language",
    es: "Idioma",
  },
  "admin.header.viewPublic": {
    en: "View Public Site",
    es: "Ver Sitio Público",
  },
  "admin.header.settings": {
    en: "Settings",
    es: "Configuración",
  },

  // Admin Dashboard
  "admin.dashboard.totalParts": {
    en: "Total Parts",
    es: "Total Piezas",
  },
  "admin.dashboard.applications": {
    en: "Vehicle Applications",
    es: "Aplicaciones Vehiculares",
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
  "common.actions.searchBy": {
    en: "Search By",
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

  // Part Images Section
  "partDetails.images.title": {
    en: "Part Images",
    es: "Imágenes de la Pieza",
  },
  "partDetails.images.uploadButton": {
    en: "Upload Images",
    es: "Subir Imágenes",
  },
  "partDetails.images.uploading": {
    en: "Uploading...",
    es: "Subiendo...",
  },
  "partDetails.images.emptyTitle": {
    en: "No images uploaded yet",
    es: "No hay imágenes subidas aún",
  },
  "partDetails.images.emptyDescription": {
    en: "Upload up to 6 images. Drag to reorder. Set primary image.",
    es: "Sube hasta 6 imágenes. Arrastra para reordenar. Establece imagen principal.",
  },
  "partDetails.images.uploadFirst": {
    en: "Upload First Image",
    es: "Subir Primera Imagen",
  },
  "partDetails.images.limitReached": {
    en: "Image limit reached",
    es: "Límite de imágenes alcanzado",
  },
  "partDetails.images.limitDescription": {
    en: "Maximum of 6 images allowed per part",
    es: "Máximo de 6 imágenes permitidas por pieza",
  },
  "partDetails.images.tooMany": {
    en: "Too many images",
    es: "Demasiadas imágenes",
  },
  "partDetails.images.remainingSlots": {
    en: "Can only upload {{count}} more image(s). Maximum 6 images per part.",
    es: "Solo puedes subir {{count}} imagen(es) más. Máximo 6 imágenes por pieza.",
  },
  "partDetails.images.filesSkipped": {
    en: "Some files were skipped",
    es: "Algunos archivos fueron omitidos",
  },
  "partDetails.images.uploadSuccess": {
    en: "Uploaded {{count}} image(s)",
    es: "{{count}} imagen(es) subida(s)",
  },
  "partDetails.images.uploadFailed": {
    en: "Upload failed",
    es: "Error al subir",
  },
  "partDetails.images.deleteSuccess": {
    en: "Image deleted",
    es: "Imagen eliminada",
  },
  "partDetails.images.deleteFailed": {
    en: "Delete failed",
    es: "Error al eliminar",
  },
  "partDetails.images.setPrimarySuccess": {
    en: "Primary image updated",
    es: "Imagen principal actualizada",
  },
  "partDetails.images.setPrimaryFailed": {
    en: "Failed to set primary",
    es: "Error al establecer principal",
  },
  "partDetails.images.updateFailed": {
    en: "Update failed",
    es: "Error al actualizar",
  },
  "partDetails.images.reorderFailed": {
    en: "Reorder failed",
    es: "Error al reordenar",
  },
  "partDetails.images.primary": {
    en: "Primary",
    es: "Principal",
  },
  "partDetails.images.captionPlaceholder": {
    en: "Add caption...",
    es: "Agregar descripción...",
  },
  "partDetails.images.deleteConfirm": {
    en: "Delete this image?",
    es: "¿Eliminar esta imagen?",
  },
  "partDetails.images.setPrimaryTooltip": {
    en: "Set as primary image",
    es: "Establecer como imagen principal",
  },
  "partDetails.images.deleteTooltip": {
    en: "Delete image",
    es: "Eliminar imagen",
  },
  "partDetails.images.dragTipLabel": {
    en: "Tip:",
    es: "Consejo:",
  },
  "partDetails.images.dragTip": {
    en: "The first image is your primary image. Click and hold any image to drag and reorder.",
    es: "La primera imagen es tu imagen principal. Haz clic y mantén presionada cualquier imagen para arrastrar y reordenar.",
  },

  // Part Media Tabs
  "partDetails.media.photosTab": {
    en: "Product Photos",
    es: "Fotos del Producto",
  },
  "partDetails.media.viewer360Tab": {
    en: "360° Viewer",
    es: "Visor 360°",
  },

  // 360° Viewer
  "partDetails.viewer360.title": {
    en: "360° Interactive Viewer",
    es: "Visor Interactivo 360°",
  },
  "partDetails.viewer360.frames": {
    en: "frames",
    es: "fotogramas",
  },
  "partDetails.viewer360.uploadButton": {
    en: "Upload Frames",
    es: "Subir Fotogramas",
  },
  "partDetails.viewer360.uploading": {
    en: "Uploading...",
    es: "Subiendo...",
  },
  "partDetails.viewer360.dragToUpload": {
    en: "Click to upload 12-48 frames or drag and drop",
    es: "Haz clic para subir 12-48 fotogramas o arrastra y suelta",
  },
  "partDetails.viewer360.imageRequirements": {
    en: "JPG or PNG, sequential rotation",
    es: "JPG o PNG, rotación secuencial",
  },
  "partDetails.viewer360.uploadSuccess": {
    en: "Successfully uploaded {{count}} frames",
    es: "Se subieron exitosamente {{count}} fotogramas",
  },
  "partDetails.viewer360.activeTitle": {
    en: "360° viewer active",
    es: "Visor 360° activo",
  },
  "partDetails.viewer360.activeDescription": {
    en: "{{count}} frames configured",
    es: "{{count}} fotogramas configurados",
  },
  "partDetails.viewer360.replaceButton": {
    en: "Replace All Frames",
    es: "Reemplazar Todos los Fotogramas",
  },
  "partDetails.viewer360.reorderInstructions": {
    en: "Reorder frames before upload",
    es: "Reordena los fotogramas antes de subir",
  },
  "partDetails.viewer360.dragToReorder": {
    en: "Drag frames to reorder. Frame #0 is the starting position.",
    es: "Arrastra fotogramas para reordenar. Fotograma #0 es la posición inicial.",
  },
  "partDetails.viewer360.confirmUpload": {
    en: "Upload Frames",
    es: "Subir Fotogramas",
  },
  "partDetails.viewer360.deleteButton": {
    en: "Delete Viewer",
    es: "Eliminar Visor",
  },
  "partDetails.viewer360.deleteConfirm": {
    en: "Are you sure you want to delete the 360° viewer? This will remove all frames.",
    es: "¿Estás seguro de que quieres eliminar el visor 360°? Esto eliminará todos los fotogramas.",
  },
  "partDetails.viewer360.deleteSuccess": {
    en: "360° viewer deleted",
    es: "Visor 360° eliminado",
  },
  "partDetails.viewer360.minFramesError": {
    en: "Minimum {{count}} frames required",
    es: "Se requieren mínimo {{count}} fotogramas",
  },
  "partDetails.viewer360.maxFramesError": {
    en: "Maximum {{count}} frames allowed",
    es: "Máximo {{count}} fotogramas permitidos",
  },
  "partDetails.viewer360.currentCount": {
    en: "You selected {{count}} files",
    es: "Seleccionaste {{count}} archivos",
  },
  "partDetails.viewer360.recommendedWarning": {
    en: "{{count}}+ frames recommended for smooth rotation",
    es: "Se recomiendan {{count}}+ fotogramas para rotación suave",
  },
  "partDetails.viewer360.proceedQuestion": {
    en: "Do you want to proceed anyway?",
    es: "¿Deseas continuar de todos modos?",
  },
  "partDetails.viewer360.invalidFileType": {
    en: "not an image",
    es: "no es una imagen",
  },
  "partDetails.viewer360.fileSizeError": {
    en: "too large (max 10MB)",
    es: "demasiado grande (máx. 10MB)",
  },
  "partDetails.viewer360.filesSkipped": {
    en: "Some files were skipped",
    es: "Algunos archivos fueron omitidos",
  },
  "partDetails.viewer360.processing": {
    en: "Processing images...",
    es: "Procesando imágenes...",
  },
  "partDetails.viewer360.processingFrames": {
    en: "Optimizing {{count}} frames with Sharp",
    es: "Optimizando {{count}} fotogramas con Sharp",
  },
  "partDetails.viewer360.requirementsTitle": {
    en: "Image Requirements:",
    es: "Requisitos de Imagen:",
  },
  "partDetails.viewer360.frameCountRequirement": {
    en: "{{min}}-{{max}} frames ({{recommended}} recommended for smooth rotation)",
    es: "{{min}}-{{max}} fotogramas ({{recommended}} recomendados para rotación suave)",
  },
  "partDetails.viewer360.fileTypeRequirement": {
    en: "JPG or PNG format only",
    es: "Solo formato JPG o PNG",
  },
  "partDetails.viewer360.fileSizeRequirement": {
    en: "Maximum 10MB per file",
    es: "Máximo 10MB por archivo",
  },
  "partDetails.viewer360.sequentialRequirement": {
    en: "Sequential rotation (15° per frame for 24 frames)",
    es: "Rotación secuencial (15° por fotograma para 24 fotogramas)",
  },
  "partDetails.viewer360.previewAlt": {
    en: "360° viewer preview",
    es: "Vista previa del visor 360°",
  },
  "partDetails.viewer360.loading": {
    en: "Loading 360° viewer...",
    es: "Cargando visor 360°...",
  },
  "partDetails.viewer360.dragToRotate": {
    en: "Drag to rotate",
    es: "Arrastra para rotar",
  },
  "partDetails.viewer360.validationError": {
    en: "Validation Error",
    es: "Error de validación",
  },
  "partDetails.viewer360.thumbnailAlt": {
    en: "360° interactive view",
    es: "Vista interactiva 360°",
  },
  "partDetails.viewer360.clickToView": {
    en: "Click to view 360° rotation",
    es: "Haz clic para ver la rotación 360°",
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
  "public.search.vehicleTabShort": {
    en: "Vehicle",
    es: "Vehículo",
  },
  "public.search.skuSearchTitle": {
    en: "Part Number Search",
    es: "Búsqueda por Número de Parte",
  },
  "public.search.skuTabShort": {
    en: "Part Number",
    es: "Número de Parte",
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
  "public.partDetails.sku": {
    en: "SKU",
    es: "SKU",
  },
  "public.partDetails.specifications": {
    en: "Specifications",
    es: "Especificaciones",
  },
  "public.partDetails.brand": {
    en: "Brand",
    es: "Marca",
  },
  "public.partDetails.type": {
    en: "Type",
    es: "Clase",
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

  // Admin Settings Page
  "admin.settings.title": {
    en: "Site Settings",
    es: "Configuración del Sitio",
  },
  "admin.settings.description": {
    en: "Manage contact information and branding assets",
    es: "Administrar información de contacto y recursos de marca",
  },
  "admin.settings.language": {
    en: "Language:",
    es: "Idioma:",
  },
  "admin.settings.logout": {
    en: "Logout",
    es: "Cerrar Sesión",
  },
  "admin.settings.backToAdmin": {
    en: "Back to Admin",
    es: "Volver a Admin",
  },
  "admin.settings.backToSearch": {
    en: "Back to Search",
    es: "Volver a Búsqueda",
  },
  "admin.settings.contactInfo.title": {
    en: "Contact Information",
    es: "Información de Contacto",
  },
  "admin.settings.contactInfo.email": {
    en: "Contact Email",
    es: "Email de Contacto",
  },
  "admin.settings.contactInfo.emailPlaceholder": {
    en: "contacto@acrautomotive.com",
    es: "contacto@acrautomotive.com",
  },
  "admin.settings.contactInfo.phone": {
    en: "Phone",
    es: "Teléfono",
  },
  "admin.settings.contactInfo.phonePlaceholder": {
    en: "+52 123 456 7890",
    es: "+52 123 456 7890",
  },
  "admin.settings.contactInfo.whatsapp": {
    en: "WhatsApp",
    es: "WhatsApp",
  },
  "admin.settings.contactInfo.whatsappPlaceholder": {
    en: "+52 123 456 7890",
    es: "+52 123 456 7890",
  },
  "admin.settings.contactInfo.address": {
    en: "Address",
    es: "Dirección",
  },
  "admin.settings.contactInfo.addressPlaceholder": {
    en: "Street, City, State, ZIP",
    es: "Calle, Ciudad, Estado, C.P.",
  },
  "admin.settings.contactInfo.updated": {
    en: "Contact info updated",
    es: "Información de contacto actualizada",
  },
  "admin.settings.contactInfo.success": {
    en: "Changes saved successfully",
    es: "Cambios guardados exitosamente",
  },
  "admin.settings.contactInfo.error": {
    en: "Update failed",
    es: "Error al actualizar",
  },
  "admin.settings.branding.companyName": {
    en: "Company Name",
    es: "Nombre de la Empresa",
  },
  "admin.settings.branding.companyNamePlaceholder": {
    en: "ACR Automotive",
    es: "ACR Automotive",
  },
  "admin.settings.branding.logo": {
    en: "Logo",
    es: "Logo",
  },
  "admin.settings.branding.uploadLogo": {
    en: "Upload Logo",
    es: "Subir Logo",
  },
  "admin.settings.branding.uploading": {
    en: "Uploading...",
    es: "Subiendo...",
  },
  "admin.settings.branding.logoFormat": {
    en: "PNG, JPG, or SVG (max 5MB)",
    es: "PNG, JPG, o SVG (máx 5MB)",
  },
  "admin.settings.branding.favicon": {
    en: "Favicon",
    es: "Favicon",
  },
  "admin.settings.branding.uploadFavicon": {
    en: "Upload Favicon",
    es: "Subir Favicon",
  },
  "admin.settings.branding.faviconFormat": {
    en: "ICO, PNG (16x16 or 32x32 recommended)",
    es: "ICO, PNG (16x16 o 32x32 recomendado)",
  },
  "admin.settings.branding.banner": {
    en: "Promotional Banner",
    es: "Banner Promocional",
  },
  "admin.settings.branding.uploadBanner": {
    en: "Upload Banner",
    es: "Subir Banner",
  },
  "admin.settings.branding.bannerFormat": {
    en: "Banner image for homepage (PNG, JPG - recommended 1200x300px, max 5MB)",
    es: "Imagen de banner para página principal (PNG, JPG - recomendado 1200x300px, máx 5MB)",
  },
  "admin.settings.branding.uploadSuccess": {
    en: "Upload successful",
    es: "Subida exitosa",
  },
  "admin.settings.branding.uploadFailed": {
    en: "Upload failed",
    es: "Error al subir",
  },
  "admin.settings.branding.updated": {
    en: "Branding updated",
    es: "Marca actualizada",
  },
  "admin.settings.branding.success": {
    en: "Changes saved successfully",
    es: "Cambios guardados exitosamente",
  },
  "admin.settings.branding.error": {
    en: "Update failed",
    es: "Error al actualizar",
  },
  "admin.settings.branding.banners": {
    en: "Banner Carousel",
    es: "Carrusel de Banners",
  },
  "admin.settings.branding.addBanner": {
    en: "Add Banner",
    es: "Agregar Banner",
  },
  "admin.settings.branding.addFirstBanner": {
    en: "Add First Banner",
    es: "Agregar Primer Banner",
  },
  "admin.settings.branding.noBanners": {
    en: "No banners yet",
    es: "No hay banners aún",
  },
  "admin.settings.branding.active": {
    en: "Active",
    es: "Activo",
  },
  "admin.settings.branding.untitled": {
    en: "Untitled Banner",
    es: "Banner Sin Título",
  },
  "admin.settings.branding.desktopImage": {
    en: "Desktop Image",
    es: "Imagen de Escritorio",
  },
  "admin.settings.branding.mobileImage": {
    en: "Mobile Image",
    es: "Imagen Móvil",
  },
  "admin.settings.branding.optional": {
    en: "optional",
    es: "opcional",
  },
  "admin.settings.branding.recommendedSize": {
    en: "Recommended size",
    es: "Tamaño recomendado",
  },
  "admin.settings.branding.title": {
    en: "Title",
    es: "Título",
  },
  "admin.settings.branding.titlePlaceholder": {
    en: "Enter banner title...",
    es: "Ingrese título del banner...",
  },
  "admin.settings.branding.subtitle": {
    en: "Subtitle",
    es: "Subtítulo",
  },
  "admin.settings.branding.subtitlePlaceholder": {
    en: "Enter banner subtitle...",
    es: "Ingrese subtítulo del banner...",
  },
  "admin.settings.branding.ctaText": {
    en: "CTA Button Text",
    es: "Texto del Botón CTA",
  },
  "admin.settings.branding.ctaTextPlaceholder": {
    en: "Learn More",
    es: "Más Información",
  },
  "admin.settings.branding.ctaLink": {
    en: "CTA Link URL",
    es: "URL del Enlace CTA",
  },
  "admin.settings.branding.ctaLinkPlaceholder": {
    en: "https://example.com/promo",
    es: "https://example.com/promo",
  },
  "admin.settings.branding.collapse": {
    en: "Collapse",
    es: "Contraer",
  },
  "admin.settings.branding.deleteBannerConfirm": {
    en: "Are you sure you want to delete this banner? This action cannot be undone.",
    es: "¿Está seguro de que desea eliminar este banner? Esta acción no se puede deshacer.",
  },
  "admin.settings.actions.save": {
    en: "Save",
    es: "Guardar",
  },
  "admin.settings.actions.saving": {
    en: "Saving...",
    es: "Guardando...",
  },

  // Contact FABs (Floating Action Buttons)
  "contactFabs.ariaLabel": {
    en: "Contact options",
    es: "Opciones de contacto",
  },
  "contactFabs.whatsapp.ariaLabel": {
    en: "Chat with us on WhatsApp",
    es: "Chatea con nosotros por WhatsApp",
  },
  "contactFabs.whatsapp.tooltip": {
    en: "Chat on WhatsApp",
    es: "Chatear por WhatsApp",
  },
  "contactFabs.email.ariaLabel": {
    en: "Send us an email",
    es: "Envíanos un correo",
  },
  "contactFabs.email.tooltip": {
    en: "Send Email",
    es: "Enviar Correo",
  },

  // Footer
  "footer.contact.whatsapp": {
    en: "WhatsApp",
    es: "WhatsApp",
  },
  "footer.contact.email": {
    en: "Email",
    es: "Email",
  },
  "footer.contact.location": {
    en: "Location",
    es: "Ubicación",
  },
  "footer.copyright": {
    en: "All rights reserved.",
    es: "Todos los derechos reservados.",
  },
};
