import { TranslationKeys } from "./translation-keys";

/**
 * Translation helpers for part data values
 * Maps raw database values to translation keys
 */

// Translation function type
type TranslateFn = (key: keyof TranslationKeys) => string;

/**
 * Translate part type from database value to localized string
 */
export function translatePartType(partType: string | null | undefined, t: TranslateFn): string {
  if (!partType) return "";
  
  const typeKey = partType.toLowerCase();
  
  switch (typeKey) {
    case "maza":
      return t("parts.types.maza");
    case "disco":
      return t("parts.types.disco");
    case "balero":
      return t("parts.types.balero");
    case "amortiguador":
      return t("parts.types.amortiguador");
    case "birlos":
      return t("parts.types.birlos");
    default:
      return partType; // Fallback to original value
  }
}

/**
 * Translate position type from database value to localized string
 */
export function translatePosition(position: string | null | undefined, t: TranslateFn): string {
  if (!position) return "";
  
  const positionKey = position.toLowerCase();
  
  switch (positionKey) {
    case "delantera":
      return t("parts.positions.delantera");
    case "delantero":
      return t("parts.positions.delantero");
    case "trasera":
      return t("parts.positions.trasera");
    case "trasero":
      return t("parts.positions.trasero");
    default:
      return position; // Fallback to original value
  }
}

/**
 * Translate ABS type from database value to localized string
 */
export function translateAbsType(absType: string | null | undefined, t: TranslateFn): string {
  if (!absType) return "";
  
  const absKey = absType.toLowerCase();
  
  switch (absKey) {
    case "c/abs":
      return t("parts.abs.with");
    case "s/abs":
      return t("parts.abs.without");
    default:
      return absType; // Fallback to original value
  }
}

/**
 * Translate drive type from database value to localized string
 */
export function translateDriveType(driveType: string | null | undefined, t: TranslateFn): string {
  if (!driveType) return "";
  
  const driveKey = driveType.toLowerCase();
  
  switch (driveKey) {
    case "4x2":
      return t("parts.drive.4x2");
    case "4x4":
      return t("parts.drive.4x4");
    default:
      return driveType; // Fallback to original value
  }
}

