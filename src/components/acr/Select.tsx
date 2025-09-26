import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
      "border-acr-gray-400 bg-white hover:border-acr-red-300 hover:bg-transparent", // ACR colors with hover
      "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent", // ACR focus states
      "transition-colors duration-200", // Smooth transitions
      "data-[placeholder]:text-acr-gray-500", // ACR placeholder color - darker

      // Custom dropdown arrow styling - force darker color with higher specificity
      "[&>*[data-radix-select-icon]]:!text-acr-gray-500 [&>*[data-radix-select-icon]]:!opacity-100",
      "[&_svg]:!text-acr-gray-500 [&_svg]:!opacity-100",

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

export interface AcrSelectRootProps
  extends React.ComponentProps<typeof Select> {
  /**
   * Show loading skeleton instead of select
   * @default false
   */
  isLoading?: boolean;
  /**
   * Custom skeleton height
   * @default "h-12"
   */
  skeletonHeight?: string;
}

/**
 * Enhanced ACR Select Root with loading state support
 */
export const AcrSelectRoot: React.FC<AcrSelectRootProps> = ({
  isLoading = false,
  skeletonHeight = "h-12",
  children,
  ...props
}) => {
  if (isLoading) {
    return <Skeleton className={cn("w-full", skeletonHeight)} />;
  }

  return (
    <Select {...props}>
      {children}
    </Select>
  );
};

/**
 * Complete ACR Select component with loading support
 *
 * Usage:
 * <AcrSelect.Root isLoading={isLoadingOptions}>
 *   <AcrSelect.Trigger><AcrSelect.Value /></AcrSelect.Trigger>
 *   <AcrSelect.Content>
 *     <AcrSelect.Item value="item1">Item 1</AcrSelect.Item>
 *   </AcrSelect.Content>
 * </AcrSelect.Root>
 */
export const AcrSelect = {
  Root: AcrSelectRoot,
  Trigger: AcrSelectTrigger,
  Content: AcrSelectContent,
  Item: AcrSelectItem,
  Value: SelectValue,
} as const;
