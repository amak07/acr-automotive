import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * ACR Card variants with brand-specific styling
 */
const acrCardVariants = cva(
  "bg-white rounded-xl border overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-acr-gray-200 shadow-sm hover:shadow-md",
        elevated: "border-acr-gray-200 shadow-lg hover:shadow-xl",
        outlined: "border-acr-gray-300 shadow-none hover:shadow-sm hover:border-acr-gray-400",
        featured: "border-acr-red-200 bg-gradient-to-br from-white to-acr-red-50/30 shadow-md hover:shadow-lg",
      },
      padding: {
        none: "",
        sm: "p-5",
        default: "p-6 lg:p-7",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface AcrCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof acrCardVariants> {}

/**
 * ACR-branded card component with consistent styling
 * Built with ACR design standards for consistent spacing and borders
 *
 * @example
 * <AcrCard variant="elevated" padding="lg">
 *   <AcrCardHeader>
 *     <h2>Card Title</h2>
 *   </AcrCardHeader>
 *   <AcrCardContent>
 *     Card content here
 *   </AcrCardContent>
 * </AcrCard>
 */
export const AcrCard = React.forwardRef<HTMLDivElement, AcrCardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        className={cn(acrCardVariants({ variant, padding }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

AcrCard.displayName = "AcrCard";

/**
 * Card header with consistent styling
 */
export const AcrCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-7", className)}
    {...props}
  />
));

AcrCardHeader.displayName = "AcrCardHeader";

/**
 * Card content with consistent styling
 */
export const AcrCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
));

AcrCardContent.displayName = "AcrCardContent";

export { acrCardVariants };