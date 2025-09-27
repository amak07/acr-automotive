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
  // No variants - single consistent styling
}

/**
 * ACR-branded select trigger with consistent styling
 */
export const AcrSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  AcrSelectTriggerProps
>(({ className, ...props }, ref) => (
  <SelectTrigger
    className={cn(
      // ACR-specific styling overrides
      "pl-4 pr-3 py-3 h-auto", // ACR spacing standards

      // Base styles
      "transition-colors duration-200",

      // Coca-Cola chunky style - matches inputs
      "!border-black !border !bg-white !text-black",
      "hover:!border-gray-600 hover:!shadow-[0_0_0_2px_rgba(0,0,0,0.24)]", // Coca-Cola hover
      "!px-6 !py-4", // Extra padding but keep normal radius
      "!font-medium", // Slightly bolder text

      // Focus state - matches Coca-Cola (force override all focus styles)
      "!focus:outline-2 !focus:outline-black !focus:outline-offset-2 !focus:border-black !focus:ring-0",
      "!focus-visible:outline-2 !focus-visible:outline-black !focus-visible:outline-offset-2 !focus-visible:border-black !focus-visible:ring-0",
      "focus:!outline focus-visible:!outline", // Force outline to be visible
      // Override any red focus styles
      "focus:!border-black focus-visible:!border-black focus:!ring-black focus-visible:!ring-black",
      "focus:!ring-offset-0 focus-visible:!ring-offset-0",

      // Placeholder styling
      "data-[placeholder]:!text-acr-gray-500",

      // Custom dropdown arrow styling - black to match Coca-Cola style
      "[&>*[data-radix-select-icon]]:!text-black [&>*[data-radix-select-icon]]:!opacity-100",
      "[&_svg]:!text-black [&_svg]:!opacity-100",
      // Move arrow closer to right border
      "[&>*[data-radix-select-icon]]:!mr-1",

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
