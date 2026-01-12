/**
 * Centralized type exports for ACR Design System components
 *
 * This file re-exports all component prop types for easier consumption.
 * Use these types when you need to reference component props without
 * importing the actual component.
 *
 * @example
 * // Type-only import (doesn't import component code)
 * import type { AcrButtonProps, AcrCardProps } from '@/components/acr/types';
 *
 * // Use in your own component props
 * interface MyComponentProps {
 *   buttonProps?: AcrButtonProps;
 *   cardVariant?: AcrCardProps['variant'];
 * }
 *
 * // Extend ACR component props
 * interface CustomButtonProps extends Omit<AcrButtonProps, 'variant'> {
 *   customVariant: 'special' | 'unique';
 * }
 */

// Alert
export type { AcrAlertProps } from "./Alert";

// Button
export type { AcrButtonProps } from "./Button";

// Card
export type { AcrCardProps } from "./Card";
// Note: AcrCardContent doesn't export props separately

// ComboBox
export type { AcrComboBoxProps } from "./ComboBox";

// ConfirmDialog
// Note: ConfirmDialog doesn't export its props interface

// DirtyIndicator
export type { AcrDirtyIndicatorProps } from "./DirtyIndicator";

// FormField
export type { AcrFormFieldProps } from "./FormField";

// Header
export type { AcrHeaderProps } from "./Header";

// ImageUpload
export type { AcrImageUploadProps } from "./ImageUpload";

// Input
export type { AcrInputProps } from "./Input";

// Label
export type { AcrLabelProps } from "./Label";

// LanguageToggle
export type { AcrLanguageToggleProps } from "./LanguageToggle";

// Modal
// Note: AcrModal doesn't export its props interface

// NavLink
export type { AcrNavLinkProps } from "./NavLink";

// Pagination
export type { AcrPaginationProps } from "./Pagination";

// PrefixInput
export type { AcrPrefixInputProps } from "./PrefixInput";

// SearchInput
export type { AcrSearchInputProps } from "./SearchInput";

// Select
export type { AcrSelectRootProps, AcrSelectTriggerProps } from "./Select";

// Spinner
export type { AcrSpinnerProps, AcrLoadingOverlayProps } from "./Spinner";

// Table
export type { AcrTableProps } from "./Table";

// Tabs
// Note: Tabs components don't export prop interfaces separately

// Textarea
export type { AcrTextareaProps } from "./Textarea";

// Tooltip
export type { AcrTooltipProps } from "./Tooltip";
