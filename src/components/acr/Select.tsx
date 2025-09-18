import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AcrSelectTriggerProps
  extends React.ComponentProps<typeof SelectTrigger> {
  /**
   * Visual variant of the select
   * @default "default"
   */
  variant?: "default" | "disabled";
}

/**
 * ACR-branded select trigger with consistent styling
 */
export const AcrSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  AcrSelectTriggerProps
>(({ className, variant = "default", ...props }, ref) => (
  <SelectTrigger
    className={cn(
      // ACR-specific styling overrides
      "pl-4 pr-3 py-3 h-auto", // ACR spacing standards
      "border-acr-gray-300 bg-white", // ACR colors
      "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent", // ACR focus states
      "transition-colors duration-200", // Smooth transitions
      "data-[placeholder]:text-acr-gray-400", // ACR placeholder color

      // Custom dropdown arrow styling
      "[&>svg]:w-4 [&>svg]:h-4 [&>svg]:opacity-60",

      // Variant styles
      variant === "disabled" &&
        "bg-acr-gray-50 text-acr-gray-500 cursor-not-allowed opacity-50",

      className
    )}
    ref={ref}
    {...props}
  />
));

AcrSelectTrigger.displayName = "AcrSelectTrigger";

/**
 * ACR-branded select content with consistent styling
 */
export const AcrSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  React.ComponentProps<typeof SelectContent>
>(({ className, ...props }, ref) => (
  <SelectContent
    className={cn(
      // ACR-specific content styling
      "border-acr-gray-200 bg-white",
      "shadow-lg",
      className
    )}
    ref={ref}
    {...props}
  />
));

AcrSelectContent.displayName = "AcrSelectContent";

/**
 * ACR-branded select item with consistent styling
 */
export const AcrSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  React.ComponentProps<typeof SelectItem>
>(({ className, ...props }, ref) => (
  <SelectItem
    className={cn(
      // ACR-specific item styling
      "text-acr-gray-900 focus:bg-acr-red-50 focus:text-acr-red-900",
      "cursor-pointer",
      className
    )}
    ref={ref}
    {...props}
  />
));

AcrSelectItem.displayName = "AcrSelectItem";

/**
 * Complete ACR Select component
 * Usage:
 * <AcrSelect.Root>
 *   <AcrSelect.Trigger><AcrSelect.Value /></AcrSelect.Trigger>
 *   <AcrSelect.Content>
 *     <AcrSelect.Item value="item1">Item 1</AcrSelect.Item>
 *   </AcrSelect.Content>
 * </AcrSelect.Root>
 */
export const AcrSelect = {
  Root: Select,
  Trigger: AcrSelectTrigger,
  Content: AcrSelectContent,
  Item: AcrSelectItem,
  Value: SelectValue,
} as const;
