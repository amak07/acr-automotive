import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * ACR Tabs - Root component
 * Wrapper around Radix Tabs with ACR design system styling
 *
 * @example
 * <AcrTabs defaultValue="vehicle">
 *   <AcrTabsList>
 *     <AcrTabsTrigger value="vehicle">Search by Vehicle</AcrTabsTrigger>
 *     <AcrTabsTrigger value="sku">Search by SKU</AcrTabsTrigger>
 *   </AcrTabsList>
 *   <AcrTabsContent value="vehicle">Vehicle search form...</AcrTabsContent>
 *   <AcrTabsContent value="sku">SKU search form...</AcrTabsContent>
 * </AcrTabs>
 */
const AcrTabs = TabsPrimitive.Root;

/**
 * ACR Tabs List - Container for tab triggers
 * Mobile: Solid bordered card style
 * Desktop: Ghost/link style with clean separator
 */
const AcrTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Mobile: Solid bordered card style with background
      "inline-flex w-full items-center justify-start gap-1 rounded-lg border border-acr-gray-300 bg-acr-gray-50 p-1",
      // Desktop: Ghost/link style with bottom border separator
      "lg:w-auto lg:gap-6 lg:border-0 lg:bg-transparent lg:p-0 lg:border-b lg:border-acr-gray-200 lg:rounded-none",
      className
    )}
    {...props}
  />
));
AcrTabsList.displayName = "AcrTabsList";

/**
 * ACR Tabs Trigger - Individual tab button
 * Mobile: Solid button style with background fill
 * Desktop: Ghost/link style with bottom border for active state
 */
const AcrTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Mobile: Solid button style
      "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2",
      "text-xs font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Mobile inactive state - gray background
      "bg-transparent text-acr-gray-700",
      // Mobile active state - white background with red text
      "data-[state=active]:bg-white data-[state=active]:text-acr-red-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold",
      // Desktop: Ghost/link style with bottom border
      "lg:flex-initial lg:text-sm lg:px-1 lg:pb-3 lg:pt-1 lg:rounded-none lg:shadow-none",
      "lg:bg-transparent lg:border-b-2 lg:border-transparent lg:-mb-px",
      "lg:text-acr-gray-600 lg:hover:text-acr-red-600",
      "lg:data-[state=active]:bg-transparent lg:data-[state=active]:border-acr-red-600 lg:data-[state=active]:shadow-none",
      className
    )}
    {...props}
  />
));
AcrTabsTrigger.displayName = "AcrTabsTrigger";

/**
 * ACR Tabs Content - Container for tab panel content
 * Spacing optimized for ACR layouts
 */
const AcrTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-500 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
AcrTabsContent.displayName = "AcrTabsContent";

export { AcrTabs, AcrTabsList, AcrTabsTrigger, AcrTabsContent };
