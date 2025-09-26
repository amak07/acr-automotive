/**
 * ACR Design System Components
 * 
 * This module exports all ACR-branded components that provide consistent
 * styling and behavior across the ACR Automotive application.
 * 
 * These components are built on top of shadcn/ui components but with
 * ACR-specific design standards, colors, and interactions.
 */

export { AcrButton, type AcrButtonProps, acrButtonVariants } from "./Button";
export { AcrCard, AcrCardHeader, AcrCardContent, type AcrCardProps, acrCardVariants } from "./Card";
export { AcrInput, type AcrInputProps } from "./Input";
export { AcrSelect, AcrSelectTrigger, AcrSelectContent, AcrSelectItem, type AcrSelectTriggerProps } from "./Select";
export { AcrComboBox, type AcrComboBoxProps, type AcrComboBoxOption } from "./ComboBox";
export { AcrTextarea, type AcrTextareaProps } from "./Textarea";
export { AcrLabel, type AcrLabelProps } from "./Label";
export { AcrModal, AcrModalFooter, AcrModalBody } from "./AcrModal";
export { ConfirmDialog } from "./ConfirmDialog";
export { AcrTooltip, type AcrTooltipProps } from "./Tooltip";
export { AcrTable, type AcrTableProps, type AcrTableColumn } from "./Table";
export { AcrDirtyIndicator, type AcrDirtyIndicatorProps } from "./DirtyIndicator";
export { AcrFormField, type AcrFormFieldProps } from "./FormField";
export { AcrPrefixInput, type AcrPrefixInputProps } from "./PrefixInput";
export { AcrImageUpload, type AcrImageUploadProps } from "./ImageUpload";

/**
 * Usage Examples:
 * 
 * @example Basic form with ACR components
 * ```tsx
 * import { AcrInput, AcrLabel, AcrButton, AcrSelect } from "@/components/acr";
 * 
 * function MyForm() {
 *   return (
 *     <div>
 *       <AcrLabel required>Part SKU</AcrLabel>
 *       <AcrInput placeholder="Enter SKU..." />
 *       
 *       <AcrLabel>Part Type</AcrLabel>
 *       <AcrSelect.Root>
 *         <AcrSelect.Trigger>
 *           <AcrSelect.Value placeholder="Select type..." />
 *         </AcrSelect.Trigger>
 *         <AcrSelect.Content>
 *           <AcrSelect.Item value="maza">MAZA</AcrSelect.Item>
 *           <AcrSelect.Item value="balero">Balero</AcrSelect.Item>
 *         </AcrSelect.Content>
 *       </AcrSelect.Root>
 *       
 *       <div className="flex gap-3">
 *         <AcrButton variant="secondary">Cancel</AcrButton>
 *         <AcrButton variant="primary">Save</AcrButton>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */