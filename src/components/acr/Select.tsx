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
 * ACR-branded select trigger with crisp, consistent styling
 */
export const AcrSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  AcrSelectTriggerProps
>(({ className, ...props }, ref) => (
  <SelectTrigger
    className={cn(
      // Base layout
      "h-12 px-4 py-3",

      // Typography
      "text-sm font-medium",

      // Crisp borders & background
      "bg-white rounded-lg",
      "border-2 border-acr-gray-900",

      // Smooth transitions
      "transition-all duration-150 ease-out",

      // Hover state
      "hover:border-acr-gray-700 hover:bg-acr-gray-50/50",

      // Focus state - clean ring
      "focus:outline-none focus-visible:outline-none",
      "focus:ring-2 focus:ring-acr-gray-900 focus:ring-offset-2",

      // Placeholder styling
      "data-[placeholder]:text-acr-gray-500",

      // Arrow icon styling
      "[&_svg]:text-acr-gray-600 [&_svg]:transition-transform [&_svg]:duration-200",
      "[&[data-state=open]_svg]:rotate-180",

      className
    )}
    ref={ref}
    {...props}
  />
));

AcrSelectTrigger.displayName = "AcrSelectTrigger";

/**
 * ACR-branded select content with polished dropdown styling
 */
export const AcrSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  React.ComponentProps<typeof SelectContent>
>(({ className, ...props }, ref) => (
  <SelectContent
    className={cn(
      // Crisp dropdown styling
      "bg-white rounded-lg overflow-hidden",
      "border border-acr-gray-200",
      "shadow-lg shadow-acr-gray-900/10",
      className
    )}
    ref={ref}
    {...props}
  />
));

AcrSelectContent.displayName = "AcrSelectContent";

/**
 * ACR-branded select item with refined hover/focus states
 */
export const AcrSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  React.ComponentProps<typeof SelectItem>
>(({ className, ...props }, ref) => (
  <SelectItem
    className={cn(
      // Base item styling
      "px-3 py-2.5 mx-1 my-0.5 rounded-md",
      "text-sm text-acr-gray-900",
      "cursor-pointer select-none",

      // Smooth transitions
      "transition-colors duration-100",

      // Hover & focus states
      "hover:bg-acr-gray-50",
      "focus:bg-acr-gray-100 focus:text-acr-gray-900",

      // Selected state (via data attribute)
      "data-[state=checked]:bg-acr-red-50 data-[state=checked]:text-acr-red-900 data-[state=checked]:font-medium",

      // Checkmark styling
      "[&_span:first-child]:text-acr-red-600",

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

  return <Select {...props}>{children}</Select>;
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
