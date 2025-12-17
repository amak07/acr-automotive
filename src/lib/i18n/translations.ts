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

  // Admin Import
  "admin.import.title": {
    en: "Import Data",
    es: "Importar Datos",
  },
  "admin.import.cardDescription": {
    en: "Bulk upload parts catalog",
    es: "Cargar catálogo masivo",
  },
  "admin.import.pageTitle": {
    en: "Import Catalog Data",
    es: "Importar Datos del Catálogo",
  },
  "admin.import.pageDescription": {
    en: "Upload Excel file to bulk update your parts catalog",
    es: "Sube archivo Excel para actualizar el catálogo de piezas",
  },
  "admin.import.steps.upload": {
    en: "Upload",
    es: "Cargar",
  },
  "admin.import.steps.validate": {
    en: "Validate",
    es: "Validar",
  },
  "admin.import.steps.preview": {
    en: "Preview",
    es: "Vista Previa",
  },
  "admin.import.steps.reviewChanges": {
    en: "Review Changes",
    es: "Revisar Cambios",
  },
  "admin.import.steps.confirm": {
    en: "Confirm",
    es: "Confirmar",
  },
  "admin.import.steps.completed": {
    en: "Completed",
    es: "Completado",
  },
  "admin.import.steps.inProgress": {
    en: "In Progress",
    es: "En Progreso",
  },
  "admin.import.steps.pending": {
    en: "Pending",
    es: "Pendiente",
  },
  "admin.import.buttons.next": {
    en: "Next",
    es: "Siguiente",
  },
  "admin.import.buttons.back": {
    en: "Back",
    es: "Atrás",
  },
  "admin.import.buttons.cancel": {
    en: "Cancel",
    es: "Cancelar",
  },
  "admin.import.buttons.import": {
    en: "Execute Import",
    es: "Ejecutar Importación",
  },
  "admin.import.buttons.done": {
    en: "Done",
    es: "Listo",
  },
  "admin.import.buttons.startNew": {
    en: "Start New Import",
    es: "Nueva Importación",
  },
  "admin.import.buttons.returnToDashboard": {
    en: "Return to Dashboard",
    es: "Volver al Panel",
  },
  "admin.import.upload.dragDrop": {
    en: "Drag and drop Excel file here",
    es: "Arrastra y suelta el archivo Excel aquí",
  },
  "admin.import.upload.orClickBrowse": {
    en: "or click to browse",
    es: "o haz clic para buscar",
  },
  "admin.import.upload.accepted": {
    en: ".xlsx files up to 10MB",
    es: "Archivos .xlsx hasta 10MB",
  },
  "admin.import.upload.chooseFile": {
    en: "Choose File",
    es: "Seleccionar Archivo",
  },
  "admin.import.upload.fileUploaded": {
    en: "File uploaded",
    es: "Archivo cargado",
  },
  "admin.import.upload.parsing": {
    en: "Parsing file...",
    es: "Procesando archivo...",
  },
  "admin.import.upload.parsed": {
    en: "Parsed",
    es: "Procesado",
  },
  "admin.import.upload.error": {
    en: "Upload Error",
    es: "Error de Carga",
  },
  "admin.import.upload.errorOnlyXlsx": {
    en: "Only .xlsx files are supported",
    es: "Solo se admiten archivos .xlsx",
  },
  "admin.import.upload.errorFileSize": {
    en: "File size must be less than {maxSize}MB",
    es: "El tamaño del archivo debe ser menor a {maxSize}MB",
  },
  "admin.import.upload.requirements": {
    en: "Upload Requirements",
    es: "Requisitos de Carga",
  },
  "admin.import.upload.reqFileFormat": {
    en: "Excel format (.xlsx) only",
    es: "Solo formato Excel (.xlsx)",
  },
  "admin.import.upload.reqMaxSize": {
    en: "Maximum file size: {maxSize}MB",
    es: "Tamaño máximo: {maxSize}MB",
  },
  "admin.import.upload.reqSheets": {
    en: "Must contain Parts, Vehicle_Applications, and Cross_References sheets",
    es: "Debe contener hojas Parts, Vehicle_Applications y Cross_References",
  },
  "admin.import.upload.reqTemplate": {
    en: "Use the export format as a template",
    es: "Usa el formato de exportación como plantilla",
  },
  "admin.import.upload.uploadCorrectedFile": {
    en: "Upload Corrected File",
    es: "Subir Archivo Corregido",
  },
  "admin.import.upload.issueFound": {
    en: "Issue Found",
    es: "Problema Encontrado",
  },
  "admin.import.upload.issuesFound": {
    en: "Issues Found",
    es: "Problemas Encontrados",
  },
  "admin.import.upload.fixIssuesPrompt": {
    en: "Please fix these issues in your Excel file and upload again",
    es: "Por favor corrige estos problemas en tu archivo Excel y vuelve a subirlo",
  },

  // Validation Error Messages (E1-E19)
  "admin.import.errors.e1": {
    en: "Missing required hidden columns (_id, _created_at, _updated_at). Please use the official import template.",
    es: "Faltan columnas ocultas requeridas (_id, _created_at, _updated_at). Por favor usa la plantilla oficial de importación.",
  },
  "admin.import.errors.e2": {
    en: 'Duplicate ACR SKU "{value}". Each part must have a unique SKU within the file.',
    es: 'SKU ACR duplicado "{value}". Cada pieza debe tener un SKU único en el archivo.',
  },
  "admin.import.errors.e3": {
    en: 'Required field "{column}" is empty. All required fields must have values.',
    es: 'El campo requerido "{column}" está vacío. Todos los campos requeridos deben tener valores.',
  },
  "admin.import.errors.e4": {
    en: 'Invalid _id format. UUIDs must follow the standard format (e.g., "550e8400-e29b-41d4-a716-446655440000").',
    es: 'Formato de _id inválido. Los UUIDs deben seguir el formato estándar (ej., "550e8400-e29b-41d4-a716-446655440000").',
  },
  "admin.import.errors.e5.vehicle": {
    en: "This vehicle application references a part that doesn't exist. Check the ACR_SKU value.",
    es: "Esta aplicación vehicular referencia una pieza que no existe. Verifica el valor de ACR_SKU.",
  },
  "admin.import.errors.e5.crossref": {
    en: "This cross-reference references a part that doesn't exist. Check the ACR_SKU value.",
    es: "Esta referencia cruzada referencia una pieza que no existe. Verifica el valor de ACR_SKU.",
  },
  "admin.import.errors.e6": {
    en: "Year range is invalid. Start year must be less than or equal to end year.",
    es: "Rango de años inválido. El año inicial debe ser menor o igual al año final.",
  },
  "admin.import.errors.e7": {
    en: 'Text in "{column}" is too long (max 500 characters). Please shorten the text.',
    es: 'Texto en "{column}" es demasiado largo (máx 500 caracteres). Por favor acorta el texto.',
  },
  "admin.import.errors.e8": {
    en: 'Year "{value}" is out of acceptable range (1900-2100). Check Year_Start and Year_End columns.',
    es: 'Año "{value}" está fuera del rango aceptable (1900-2100). Verifica las columnas Year_Start y Year_End.',
  },
  "admin.import.errors.e9": {
    en: '"{value}" is not a valid number. Please enter numbers only (no text or special characters).',
    es: '"{value}" no es un número válido. Por favor ingresa solo números (sin texto o caracteres especiales).',
  },
  "admin.import.errors.e10": {
    en: 'Required worksheet "{sheet}" is missing. The file must contain Parts, Vehicle_Applications, and Cross_References sheets.',
    es: 'Falta la hoja requerida "{sheet}". El archivo debe contener las hojas Parts, Vehicle_Applications y Cross_References.',
  },
  "admin.import.errors.e11": {
    en: 'Column header "{column}" appears multiple times. Each column must have a unique name.',
    es: 'El encabezado de columna "{column}" aparece múltiples veces. Cada columna debe tener un nombre único.',
  },
  "admin.import.errors.e12": {
    en: 'Required column "{column}" is missing from the "{sheet}" sheet. Please use the official template.',
    es: 'Falta la columna requerida "{column}" en la hoja "{sheet}". Por favor usa la plantilla oficial.',
  },
  "admin.import.errors.e13": {
    en: 'Worksheet name "{sheet}" is incorrect. Valid sheet names are: Parts, Vehicle_Applications, Cross_References.',
    es: 'Nombre de hoja "{sheet}" incorrecto. Nombres válidos: Parts, Vehicle_Applications, Cross_References.',
  },
  "admin.import.errors.e14": {
    en: "File format is not valid. Please upload an .xlsx file (Excel 2007 or newer).",
    es: "Formato de archivo no válido. Por favor sube un archivo .xlsx (Excel 2007 o más reciente).",
  },
  "admin.import.errors.e15": {
    en: "File size exceeds the 10MB limit. Please reduce file size or split into smaller imports.",
    es: "El tamaño del archivo excede el límite de 10MB. Por favor reduce el tamaño o divide en importaciones más pequeñas.",
  },
  "admin.import.errors.e16": {
    en: "Excel file is corrupted or malformed. Try saving a fresh copy and uploading again.",
    es: "Archivo Excel está corrupto o malformado. Intenta guardar una copia nueva y subirla de nuevo.",
  },
  "admin.import.errors.e17": {
    en: "File encoding error. Please ensure the file is saved in UTF-8 format.",
    es: "Error de codificación de archivo. Por favor asegúrate de que el archivo esté guardado en formato UTF-8.",
  },
  "admin.import.errors.e18": {
    en: "Data integrity violation. This record references data that doesn't exist in the database.",
    es: "Violación de integridad de datos. Este registro referencia datos que no existen en la base de datos.",
  },
  "admin.import.errors.e19": {
    en: "Part with _id \"{value}\" doesn't exist in the database. Either remove the _id to add as new part, or use an existing part's _id.",
    es: 'La pieza con _id "{value}" no existe en la base de datos. Elimina el _id para agregar como pieza nueva, o usa el _id de una pieza existente.',
  },

  "admin.import.validation.validating": {
    en: "Validating data...",
    es: "Validando datos...",
  },
  "admin.import.validation.failed": {
    en: "Validation Failed",
    es: "Validación Fallida",
  },
  "admin.import.validation.errorsFound": {
    en: "errors found",
    es: "errores encontrados",
  },
  "admin.import.validation.warningsFound": {
    en: "warnings detected",
    es: "advertencias detectadas",
  },
  "admin.import.validation.fix": {
    en: "Fix these errors and re-upload the file",
    es: "Corrige estos errores y vuelve a cargar el archivo",
  },
  "admin.import.validation.acknowledge": {
    en: "I have reviewed the warnings and want to proceed",
    es: "He revisado las advertencias y quiero continuar",
  },
  "admin.import.validation.errorsBySheet": {
    en: "Errors by Sheet",
    es: "Errores por Hoja",
  },
  "admin.import.validation.warningsBySheet": {
    en: "Warnings by Sheet",
    es: "Advertencias por Hoja",
  },
  "admin.import.validation.success": {
    en: "Validation Successful",
    es: "Validación Exitosa",
  },
  "admin.import.validation.successDesc": {
    en: "All data is valid. Ready to preview changes.",
    es: "Todos los datos son válidos. Listo para vista previa.",
  },
  "admin.import.validation.error": {
    en: "error",
    es: "error",
  },
  "admin.import.validation.warning": {
    en: "warning",
    es: "advertencia",
  },
  "admin.import.validation.errors": {
    en: "errors",
    es: "errores",
  },
  "admin.import.validation.warnings": {
    en: "warnings",
    es: "advertencias",
  },
  "admin.import.validation.reviewWarnings": {
    en: "Review changes that may affect existing data",
    es: "Revisa cambios que pueden afectar datos existentes",
  },
  "admin.import.preview.added": {
    en: "Added",
    es: "Agregados",
  },
  "admin.import.preview.updated": {
    en: "Updated",
    es: "Actualizados",
  },
  "admin.import.preview.deleted": {
    en: "Deleted",
    es: "Eliminados",
  },
  "admin.import.preview.parts": {
    en: "parts",
    es: "piezas",
  },
  "admin.import.preview.totalChanges": {
    en: "Total changes across all sheets",
    es: "Cambios totales en todas las hojas",
  },
  "admin.import.preview.warningDeletes": {
    en: "Warning: Some items will be permanently deleted",
    es: "Advertencia: Algunos elementos se eliminarán permanentemente",
  },
  "admin.import.preview.calculating": {
    en: "Calculating changes...",
    es: "Calculando cambios...",
  },
  "admin.import.preview.new": {
    en: "new",
    es: "nuevos",
  },
  "admin.import.preview.systemUpdates": {
    en: "system updates",
    es: "actualizaciones del sistema",
  },
  "admin.import.preview.partChanges": {
    en: "Part Changes",
    es: "Cambios de Piezas",
  },
  "admin.import.preview.newParts": {
    en: "New Parts",
    es: "Piezas Nuevas",
  },
  "admin.import.preview.updatedParts": {
    en: "Updated Parts",
    es: "Piezas Actualizadas",
  },
  "admin.import.preview.deletedParts": {
    en: "Deleted Parts",
    es: "Piezas Eliminadas",
  },
  "admin.import.preview.loadMore": {
    en: "Load 20 more",
    es: "Cargar 20 más",
  },
  "admin.import.preview.showAll": {
    en: "Show all {count}",
    es: "Mostrar todos {count}",
  },
  "admin.import.preview.cascadeWarning": {
    en: "Cascade Delete Warning",
    es: "Advertencia de Eliminación en Cascada",
  },
  "admin.import.preview.cascadeDesc": {
    en: "Deleting {count} {type} will also remove {relatedCount} related {relatedType}. This keeps your database consistent.",
    es: "Eliminar {count} {type} también removerá {relatedCount} {relatedType} relacionados. Esto mantiene consistente tu base de datos.",
  },
  "admin.import.preview.cascadeAck": {
    en: "I understand these items will be permanently removed",
    es: "Entiendo que estos elementos serán removidos permanentemente",
  },
  "admin.import.preview.dataWarnings": {
    en: "Data Change Warnings ({count})",
    es: "Advertencias de Cambio de Datos ({count})",
  },
  "admin.import.preview.dataWarningsAck": {
    en: "I understand these changes and want to proceed",
    es: "Entiendo estos cambios y quiero continuar",
  },
  "admin.import.preview.systemUpdatesDesc": {
    en: "{count} system metadata updates (routine maintenance)",
    es: "{count} actualizaciones de metadatos del sistema (mantenimiento rutinario)",
  },
  "admin.import.preview.vaMetadata": {
    en: "{count} vehicle application metadata syncs",
    es: "{count} sincronizaciones de metadatos de aplicaciones vehiculares",
  },
  "admin.import.preview.crMetadata": {
    en: "{count} cross-reference metadata syncs",
    es: "{count} sincronizaciones de metadatos de referencias cruzadas",
  },
  "admin.import.preview.routineMaintenance": {
    en: "These updates maintain data integrity and don't modify business data.",
    es: "Estas actualizaciones mantienen la integridad de datos y no modifican datos de negocio.",
  },
  "admin.import.preview.willRemove": {
    en: "Will be removed from catalog",
    es: "Será removido del catálogo",
  },
  "admin.import.preview.willRemoveItems": {
    en: "Will also remove {count} vehicle {type}",
    es: "También removerá {count} {type} vehicular",
  },
  "admin.import.preview.andCrossRefs": {
    en: ", {count} cross-{type}",
    es: ", {count} {type} cruzada",
  },
  "admin.import.confirm.ready": {
    en: "Ready to Import",
    es: "Listo para Importar",
  },
  "admin.import.confirm.changesWillBeApplied": {
    en: "The following changes will be applied:",
    es: "Se aplicarán los siguientes cambios:",
  },
  "admin.import.confirm.partsAdded": {
    en: "parts will be added",
    es: "piezas serán agregadas",
  },
  "admin.import.confirm.partsUpdated": {
    en: "parts will be updated",
    es: "piezas serán actualizadas",
  },
  "admin.import.confirm.partsDeleted": {
    en: "parts will be deleted",
    es: "piezas serán eliminadas",
  },
  "admin.import.confirm.vehicleAppsAdded": {
    en: "vehicle applications will be added",
    es: "aplicaciones vehiculares serán agregadas",
  },
  "admin.import.confirm.crossRefsUpdated": {
    en: "cross references will be updated",
    es: "referencias cruzadas serán actualizadas",
  },
  "admin.import.confirm.snapshotCreated": {
    en: "A snapshot will be created for rollback",
    es: "Se creará una instantánea para revertir",
  },
  "admin.import.confirm.importing": {
    en: "Importing Changes...",
    es: "Importando Cambios...",
  },
  "admin.import.confirm.creatingSnapshot": {
    en: "Creating snapshot",
    es: "Creando instantánea",
  },
  "admin.import.confirm.validatingData": {
    en: "Validating data",
    es: "Validando datos",
  },
  "admin.import.confirm.applyingChanges": {
    en: "Applying changes",
    es: "Aplicando cambios",
  },
  "admin.import.confirm.savingHistory": {
    en: "Saving history",
    es: "Guardando historial",
  },
  "admin.import.confirm.pleaseWait": {
    en: "This may take up to 30 seconds",
    es: "Esto puede tardar hasta 30 segundos",
  },
  "admin.import.confirm.doNotClose": {
    en: "Please do not close this page",
    es: "Por favor no cierres esta página",
  },
  "admin.import.success.title": {
    en: "Import Successful!",
    es: "¡Importación Exitosa!",
  },
  "admin.import.success.importId": {
    en: "Import ID",
    es: "ID de Importación",
  },
  "admin.import.success.completed": {
    en: "Completed",
    es: "Completado",
  },
  "admin.import.success.changesApplied": {
    en: "Changes Applied",
    es: "Cambios Aplicados",
  },
  "admin.import.success.snapshotSaved": {
    en: "Snapshot saved for rollback",
    es: "Instantánea guardada para revertir",
  },
  "admin.import.success.executionTime": {
    en: "Execution time",
    es: "Tiempo de ejecución",
  },
  "admin.import.success.completedDesc": {
    en: "All changes have been applied successfully to your catalog",
    es: "Todos los cambios han sido aplicados exitosamente a tu catálogo",
  },
  "admin.import.success.importIdLabel": {
    en: "Import ID",
    es: "ID de Importación",
  },
  "admin.import.success.executionTimeLabel": {
    en: "Execution Time",
    es: "Tiempo de Ejecución",
  },
  "admin.import.success.viewDetails": {
    en: "View detailed part list",
    es: "Ver lista detallada de piezas",
  },
  "admin.import.success.hideDetails": {
    en: "Hide detailed part list",
    es: "Ocultar lista detallada de piezas",
  },
  "admin.import.success.partsLabel": {
    en: "parts",
    es: "piezas",
  },
  "admin.import.success.partsAdded": {
    en: "Parts Added",
    es: "Piezas Agregadas",
  },
  "admin.import.success.partsUpdated": {
    en: "Parts Updated",
    es: "Piezas Actualizadas",
  },
  "admin.import.success.partsDeleted": {
    en: "Parts Deleted",
    es: "Piezas Eliminadas",
  },
  "admin.import.success.morePartsNotShown": {
    en: "+ {count} more parts not shown",
    es: "+ {count} piezas más no mostradas",
  },
  "admin.import.success.snapshotInfo": {
    en: "Snapshot saved for rollback",
    es: "Instantánea guardada para revertir",
  },
  "admin.import.success.snapshotDesc": {
    en: "Import #{id} has been saved. You can rollback this import from Settings if needed.",
    es: "Importación #{id} ha sido guardada. Puedes revertir esta importación desde Configuración si es necesario.",
  },
  "admin.import.error.title": {
    en: "Import Failed",
    es: "Importación Fallida",
  },
  "admin.import.error.duplicateParts": {
    en: "Duplicate Parts Detected",
    es: "Piezas Duplicadas Detectadas",
  },
  "admin.import.error.duplicateDesc": {
    en: "Some parts in your file already exist in the database. This usually happens when you try to import the same file twice.",
    es: "Algunas piezas en tu archivo ya existen en la base de datos. Esto generalmente ocurre al importar el mismo archivo dos veces.",
  },
  "admin.import.error.duplicateSuggestion": {
    en: "Export a fresh file from the database and make your changes to that file, or remove the duplicate parts from your current file.",
    es: "Exporta un archivo actualizado de la base de datos y haz tus cambios en ese archivo, o remueve las piezas duplicadas de tu archivo actual.",
  },
  "admin.import.error.foreignKey": {
    en: "Data Relationship Error",
    es: "Error de Relación de Datos",
  },
  "admin.import.error.foreignKeyDesc": {
    en: "Some records reference parts that don't exist in the database.",
    es: "Algunos registros referencian piezas que no existen en la base de datos.",
  },
  "admin.import.error.foreignKeySuggestion": {
    en: "Make sure all vehicle applications and cross-references have valid ACR_SKU values that match existing parts.",
    es: "Asegúrate que todas las aplicaciones vehiculares y referencias cruzadas tengan valores ACR_SKU válidos que coincidan con piezas existentes.",
  },
  "admin.import.error.missingRequired": {
    en: "Missing Required Data",
    es: "Datos Requeridos Faltantes",
  },
  "admin.import.error.missingRequiredDesc": {
    en: "Some required fields are empty in your file.",
    es: "Algunos campos requeridos están vacíos en tu archivo.",
  },
  "admin.import.error.missingRequiredSuggestion": {
    en: "Check that all parts have ACR_SKU and Part_Type filled in, and all vehicle applications have Make, Model, and Year information.",
    es: "Verifica que todas las piezas tengan ACR_SKU y Part_Type completados, y todas las aplicaciones vehiculares tengan información de Marca, Modelo y Año.",
  },
  "admin.import.error.timeout": {
    en: "Connection Timeout",
    es: "Tiempo de Conexión Agotado",
  },
  "admin.import.error.timeoutDesc": {
    en: "The import took too long and the connection was lost.",
    es: "La importación tardó demasiado y la conexión se perdió.",
  },
  "admin.import.error.timeoutSuggestion": {
    en: "Try importing a smaller file, or check your internet connection and try again.",
    es: "Intenta importar un archivo más pequeño, o verifica tu conexión a internet e intenta nuevamente.",
  },
  "admin.import.error.generic": {
    en: "Import Failed",
    es: "Importación Fallida",
  },
  "admin.import.error.genericSuggestion": {
    en: "Check your file format and data, then try again. If the problem persists, contact support.",
    es: "Verifica el formato y datos de tu archivo, luego intenta nuevamente. Si el problema persiste, contacta soporte.",
  },
  "admin.import.error.technicalDetails": {
    en: "Technical Details",
    es: "Detalles Técnicos",
  },
  "admin.import.error.tryAgain": {
    en: "Try Again",
    es: "Intentar Nuevamente",
  },
  "admin.import.error.suggestionLabel": {
    en: "Suggestion:",
    es: "Sugerencia:",
  },
  "admin.import.rollback.confirm": {
    en: "Confirm Rollback",
    es: "Confirmar Reversión",
  },
  "admin.import.rollback.desc": {
    en: "This will undo the import and restore the database to its state before these changes:",
    es: "Esto revertirá la importación y restaurará la base de datos a su estado antes de estos cambios:",
  },
  "admin.import.rollback.addedRemoved": {
    en: "{count} Added {type} Will Be Removed",
    es: "{count} {type} Agregado(s) Será(n) Removido(s)",
  },
  "admin.import.rollback.addedRemovedDesc": {
    en: "All parts, vehicle applications, and cross-references added in this import will be deleted.",
    es: "Todas las piezas, aplicaciones vehiculares y referencias cruzadas agregadas en esta importación serán eliminadas.",
  },
  "admin.import.rollback.updatedReverted": {
    en: "{count} Updated {type} Will Revert",
    es: "{count} {type} Actualizado(s) Será(n) Revertido(s)",
  },
  "admin.import.rollback.updatedRevertedDesc": {
    en: "All modifications to existing records will be undone, restoring previous values.",
    es: "Todas las modificaciones a registros existentes serán deshechas, restaurando valores previos.",
  },
  "admin.import.rollback.deletedRestored": {
    en: "{count} Deleted {type} Will Be Restored",
    es: "{count} {type} Eliminado(s) Será(n) Restaurado(s)",
  },
  "admin.import.rollback.deletedRestoredDesc": {
    en: "All records deleted during this import will be brought back with their original data.",
    es: "Todos los registros eliminados durante esta importación serán recuperados con sus datos originales.",
  },
  "admin.import.rollback.warning": {
    en: "This action cannot be undone. The snapshot will be consumed and deleted.",
    es: "Esta acción no puede ser deshecha. La instantánea será consumida y eliminada.",
  },
  "admin.import.rollback.cancel": {
    en: "Cancel",
    es: "Cancelar",
  },
  "admin.import.rollback.confirm.button": {
    en: "Yes, Rollback Import",
    es: "Sí, Revertir Importación",
  },
  "admin.import.rollback.inProgress": {
    en: "Rolling back...",
    es: "Revirtiendo...",
  },
  "admin.import.rollback.button": {
    en: "Rollback Import",
    es: "Revertir Importación",
  },
  "admin.import.rollback.record": {
    en: "Record",
    es: "Registro",
  },
  "admin.import.rollback.records": {
    en: "Records",
    es: "Registros",
  },
  "admin.import.processing": {
    en: "Processing...",
    es: "Procesando...",
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
    en: 'No matches found. Type to add "{{value}}"',
    es: 'No se encontraron coincidencias. Escriba para agregar "{{value}}"',
  },
  "comboBox.addValue": {
    en: 'Add "{{value}}"',
    es: 'Agregar "{{value}}"',
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
    en: "Upload up to 10 images. Drag to reorder. Set primary image.",
    es: "Sube hasta 10 imágenes. Arrastra para reordenar. Establece imagen principal.",
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
    en: "Maximum of 10 images allowed per part",
    es: "Máximo de 10 imágenes permitidas por pieza",
  },
  "partDetails.images.tooMany": {
    en: "Too many images",
    es: "Demasiadas imágenes",
  },
  "partDetails.images.remainingSlots": {
    en: "Can only upload {{count}} more image(s). Maximum 10 images per part.",
    es: "Solo puedes subir {{count}} imagen(es) más. Máximo 10 imágenes por pieza.",
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
  "partDetails.media.loading": {
    en: "Loading...",
    es: "Cargando...",
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
  "admin.settings.back": {
    en: "Back",
    es: "Volver",
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

  // Admin Bulk Image Upload
  "admin.bulkUpload.title": {
    en: "Bulk Image Upload",
    es: "Carga Masiva de Imágenes",
  },
  "admin.bulkUpload.description": {
    en: "Upload folders of supplier photos to automatically map to parts",
    es: "Sube carpetas de fotos de proveedores para asignarlas automáticamente a piezas",
  },
  "admin.bulkUpload.button": {
    en: "Bulk Images",
    es: "Imágenes Masivas",
  },
  "admin.bulkUpload.uploadFolder": {
    en: "Upload Folder",
    es: "Subir Carpeta",
  },
  "admin.bulkUpload.back": {
    en: "Back",
    es: "Volver",
  },
  "admin.bulkUpload.noPartsFound": {
    en: "No parts found matching your filters.",
    es: "No se encontraron piezas que coincidan con tus filtros.",
  },
  "admin.bulkUpload.showingParts": {
    en: "Showing {{start}} to {{end}} of {{total}} parts",
    es: "Mostrando {{start}} a {{end}} de {{total}} piezas",
  },
  "admin.bulkUpload.pageOf": {
    en: "Page {current} of {total}",
    es: "Página {current} de {total}",
  },
  "admin.bulkUpload.thumb": {
    en: "Thumb",
    es: "Mini",
  },
  "admin.bulkUpload.part": {
    en: "Part",
    es: "Pieza",
  },
  "admin.bulkUpload.type": {
    en: "Type",
    es: "Tipo",
  },
  "admin.bulkUpload.images": {
    en: "Images",
    es: "Imágenes",
  },
  "admin.bulkUpload.viewer360": {
    en: "360° Viewer",
    es: "Visor 360°",
  },
  "admin.bulkUpload.filterImages": {
    en: "Filter by images",
    es: "Filtrar por imágenes",
  },
  "admin.bulkUpload.filter360": {
    en: "Filter by 360°",
    es: "Filtrar por 360°",
  },
  "admin.bulkUpload.allParts": {
    en: "All Parts",
    es: "Todas las Piezas",
  },
  "admin.bulkUpload.hasImages": {
    en: "Has Images",
    es: "Con Imágenes",
  },
  "admin.bulkUpload.noImages": {
    en: "No Images",
    es: "Sin Imágenes",
  },
  "admin.bulkUpload.has360": {
    en: "Has 360°",
    es: "Con 360°",
  },
  "admin.bulkUpload.no360": {
    en: "No 360°",
    es: "Sin 360°",
  },
  "admin.bulkUpload.searchPlaceholder": {
    en: "Search by SKU...",
    es: "Buscar por SKU...",
  },
  "admin.bulkUpload.modal.selectTitle": {
    en: "Select Files",
    es: "Seleccionar Archivos",
  },
  "admin.bulkUpload.modal.reviewTitle": {
    en: "Review & Confirm",
    es: "Revisar y Confirmar",
  },
  "admin.bulkUpload.modal.progressTitle": {
    en: "Upload Progress",
    es: "Progreso de Carga",
  },
  "admin.bulkUpload.dropHere": {
    en: "Drop files here...",
    es: "Suelta los archivos aquí...",
  },
  "admin.bulkUpload.dragDrop": {
    en: "Drag and drop folder or files here",
    es: "Arrastra y suelta carpeta o archivos aquí",
  },
  "admin.bulkUpload.orBrowse": {
    en: "or click to browse",
    es: "o haz clic para explorar",
  },
  "admin.bulkUpload.selectFiles": {
    en: "Select Files",
    es: "Seleccionar Archivos",
  },
  "admin.bulkUpload.filesSelected": {
    en: "{count} files selected",
    es: "{count} archivos seleccionados",
  },
  "admin.bulkUpload.productImages": {
    en: "Product Images",
    es: "Imágenes de Producto",
  },
  "admin.bulkUpload.frames360": {
    en: "360° Frames",
    es: "Cuadros 360°",
  },
  "admin.bulkUpload.unknown": {
    en: "Unknown",
    es: "Desconocido",
  },
  "admin.bulkUpload.uniqueSkus": {
    en: "Unique SKUs",
    es: "SKUs Únicos",
  },
  "admin.bulkUpload.filesSkipped": {
    en: "{count} files skipped (unsupported format)",
    es: "{count} archivos omitidos (formato no soportado)",
  },
  "admin.bulkUpload.analyzeFiles": {
    en: "Analyze Files",
    es: "Analizar Archivos",
  },
  "admin.bulkUpload.clear": {
    en: "Clear",
    es: "Limpiar",
  },
  "admin.bulkUpload.analyzing": {
    en: "Analyzing files...",
    es: "Analizando archivos...",
  },
  "admin.bulkUpload.matchingSkus": {
    en: "Matching SKUs to parts",
    es: "Emparejando SKUs con piezas",
  },
  "admin.bulkUpload.processingBatch": {
    en: "Processing batch {current} of {total}...",
    es: "Procesando lote {current} de {total}...",
  },
  "admin.bulkUpload.filesMatched": {
    en: "Files Matched",
    es: "Archivos Emparejados",
  },
  "admin.bulkUpload.newParts": {
    en: "New Parts",
    es: "Piezas Nuevas",
  },
  "admin.bulkUpload.partsToUpdate": {
    en: "Parts to Update",
    es: "Piezas a Actualizar",
  },
  "admin.bulkUpload.unmatched": {
    en: "Unmatched",
    es: "Sin Emparejar",
  },
  "admin.bulkUpload.new": {
    en: "NEW",
    es: "NUEVO",
  },
  "admin.bulkUpload.partsGettingImages": {
    en: "{count} parts getting images for the first time",
    es: "{count} piezas recibiendo imágenes por primera vez",
  },
  "admin.bulkUpload.updating": {
    en: "UPDATING",
    es: "ACTUALIZANDO",
  },
  "admin.bulkUpload.partsWithExisting": {
    en: "{count} parts with existing images",
    es: "{count} piezas con imágenes existentes",
  },
  "admin.bulkUpload.unmatchedFiles": {
    en: "Unmatched Files",
    es: "Archivos Sin Emparejar",
  },
  "admin.bulkUpload.unmatchedDescription": {
    en: "These files could not be matched to any part in the database.",
    es: "Estos archivos no pudieron emparejarse con ninguna pieza en la base de datos.",
  },
  "admin.bulkUpload.moreFiles": {
    en: "+{count} more",
    es: "+{count} más",
  },
  "admin.bulkUpload.startUpload": {
    en: "Start Upload",
    es: "Iniciar Carga",
  },
  "admin.bulkUpload.uploading": {
    en: "Uploading images...",
    es: "Subiendo imágenes...",
  },
  "admin.bulkUpload.processingFiles": {
    en: "Processing and uploading your files. This may take a few minutes.",
    es: "Procesando y subiendo tus archivos. Esto puede tomar unos minutos.",
  },
  "admin.bulkUpload.uploadComplete": {
    en: "Upload Complete!",
    es: "¡Carga Completa!",
  },
  "admin.bulkUpload.uploadPartial": {
    en: "Upload Partially Complete",
    es: "Carga Parcialmente Completa",
  },
  "admin.bulkUpload.partsSuccessful": {
    en: "Parts Successful",
    es: "Piezas Exitosas",
  },
  "admin.bulkUpload.imagesUploaded": {
    en: "Images Uploaded",
    es: "Imágenes Subidas",
  },
  "admin.bulkUpload.partsFailed": {
    en: "Parts Failed",
    es: "Piezas Fallidas",
  },
  "admin.bulkUpload.successfulUploads": {
    en: "Successful Uploads",
    es: "Cargas Exitosas",
  },
  "admin.bulkUpload.failedUploads": {
    en: "Failed Uploads",
    es: "Cargas Fallidas",
  },
  "admin.bulkUpload.uploadFailed": {
    en: "Upload Failed",
    es: "Carga Fallida",
  },
  "admin.bulkUpload.retry": {
    en: "Retry",
    es: "Reintentar",
  },
  "admin.bulkUpload.done": {
    en: "Done",
    es: "Listo",
  },
  "admin.bulkUpload.close": {
    en: "Close",
    es: "Cerrar",
  },
};
