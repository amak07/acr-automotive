import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface AcrNavLinkProps {
  /**
   * The destination URL
   */
  href: string;

  /**
   * Icon to display (Lucide icon component)
   */
  icon?: LucideIcon;

  /**
   * Link content
   */
  children: React.ReactNode;

  /**
   * Visual variant of the link
   * @default "default"
   */
  variant?: "default" | "danger" | "primary";

  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Whether this is an external link
   * @default false
   */
  external?: boolean;

  /**
   * Custom onClick handler (for button-like behavior)
   */
  onClick?: () => void;

  /**
   * Whether the link is disabled
   */
  disabled?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Whether to render as a button instead of Link
   * Useful for logout buttons, etc.
   */
  asButton?: boolean;

  /**
   * Button type when asButton is true
   */
  type?: "button" | "submit" | "reset";

  /**
   * Accessibility title
   */
  title?: string;
}

const variantClasses = {
  default: "text-acr-gray-600 hover:text-acr-blue-600 hover:bg-acr-gray-50",
  primary: "text-acr-blue-600 hover:text-acr-blue-800 hover:bg-acr-blue-50",
  danger: "text-red-600 hover:text-red-800 hover:bg-red-50",
} as const;

const sizeClasses = {
  sm: "px-2 py-1 acr-caption gap-1",
  default: "px-3 py-2 acr-body-small gap-2",
  lg: "px-4 py-3 acr-body gap-3",
} as const;

/**
 * ACR navigation link component
 * Provides consistent styling for navigation links with optional icons
 */
export const AcrNavLink = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  AcrNavLinkProps
>(
  (
    {
      href,
      icon: Icon,
      children,
      variant = "default",
      size = "default",
      external = false,
      onClick,
      disabled = false,
      className,
      asButton = false,
      type = "button",
      title,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      "flex items-center acr-body-small rounded-md transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-acr-blue-500 focus:ring-offset-2",
      sizeClasses[size],
      variantClasses[variant],
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    const content = (
      <>
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        {children}
      </>
    );

    if (asButton) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={baseClasses}
          title={title}
          {...props}
        >
          {content}
        </button>
      );
    }

    if (external) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={baseClasses}
          onClick={onClick}
          title={title}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href as any} className={baseClasses} onClick={onClick} title={title}>
        {content}
      </Link>
    );
  }
);

AcrNavLink.displayName = "AcrNavLink";