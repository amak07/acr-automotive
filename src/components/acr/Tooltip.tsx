import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export interface AcrTooltipProps {
  /**
   * The content to display in the tooltip
   */
  content: React.ReactNode;
  /**
   * The element that triggers the tooltip on hover
   */
  children: React.ReactNode;
  /**
   * Side where the tooltip should appear
   * @default "top"
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * How to align the tooltip relative to the trigger
   * @default "center"
   */
  align?: "start" | "center" | "end";
  /**
   * Custom className for the tooltip content
   */
  className?: string;
  /**
   * Delay before showing tooltip in milliseconds
   * @default 400
   */
  delayDuration?: number;
}

/**
 * ACR-branded tooltip component with consistent styling
 * Built on top of shadcn Tooltip with ACR design standards
 *
 * @example
 * <AcrTooltip content="This field cannot be modified">
 *   <button>Hover me</button>
 * </AcrTooltip>
 *
 * @example
 * <AcrTooltip.Info content="SKU cannot be modified after creation" />
 */
/**
 * Pre-built info icon tooltip for common use cases
 */
export const AcrTooltipInfo: React.FC<{
  content: React.ReactNode;
  side?: AcrTooltipProps["side"];
  className?: string;
}> = ({ content, side = "top", className }) => (
  <TooltipProvider delayDuration={400}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className={cn("w-4 h-4 text-acr-red-500 hover:text-acr-red-600 cursor-help transition-colors shrink-0", className)} />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align="center"
        className={cn(
          // ACR-specific styling
          "bg-acr-gray-900 text-white border-acr-gray-700",
          "acr-caption",
          "px-3 py-2",
          "max-w-xs",
          "shadow-lg"
        )}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const AcrTooltipComponent = React.forwardRef<
  React.ElementRef<typeof TooltipContent>,
  AcrTooltipProps
>(({ content, children, side = "top", align = "center", className, delayDuration = 400 }, ref) => (
  <TooltipProvider delayDuration={delayDuration}>
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        ref={ref}
        side={side}
        align={align}
        className={cn(
          // ACR-specific styling
          "bg-acr-gray-900 text-white border-acr-gray-700",
          "acr-caption",
          "px-3 py-2",
          "max-w-xs",
          "shadow-lg",
          className
        )}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

AcrTooltipComponent.displayName = "AcrTooltip";

// Create compound component with proper typing
export const AcrTooltip = Object.assign(AcrTooltipComponent, {
  Info: AcrTooltipInfo,
});