"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, LucideIcon, MoreVertical, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { AcrLanguageToggle } from "./LanguageToggle";
import { Locale } from "@/lib/i18n";
import { useHomeLink } from "@/hooks";

export interface AcrHeaderAction {
  /**
   * Unique identifier for the action
   */
  id: string;

  /**
   * Action label/text
   */
  label: string;

  /**
   * Optional icon
   */
  icon?: LucideIcon;

  /**
   * Link href (for navigation actions)
   */
  href?: string;

  /**
   * Click handler (for button actions)
   */
  onClick?: () => void;

  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "primary" | "danger";

  /**
   * Whether this should render as a button instead of link
   */
  asButton?: boolean;

  /**
   * Custom className for the action
   */
  className?: string;

  /**
   * Accessibility title
   */
  title?: string;
}

export interface AcrHeaderProps {
  /**
   * Header title text
   */
  title: string;

  /**
   * Optional tagline/subtitle displayed below title on desktop
   */
  tagline?: string;

  /**
   * Current locale for language toggle
   * @optional - if not provided, language toggle will not be shown
   */
  locale?: Locale;

  /**
   * Locale change handler
   * @optional - if not provided, language toggle will not be shown
   */
  onLocaleChange?: (locale: Locale) => void;

  /**
   * Language toggle label text
   * @optional - if not provided, language toggle will not be shown
   */
  languageToggleLabel?: string;

  /**
   * Navigation actions for desktop/mobile
   */
  actions?: AcrHeaderAction[];

  /**
   * Utility menu actions (3-dot menu) - shown in dropdown on desktop
   * Typically includes: language switcher, logout, etc.
   * @optional - if not provided, utility menu will not be shown
   */
  utilityActions?: AcrHeaderAction[];

  /**
   * Custom className for the header
   */
  className?: string;

  /**
   * Border variant
   * @default "gray-200"
   */
  borderVariant?: "gray-200" | "gray-300";
}

const actionVariantClasses = {
  default: "text-acr-gray-600 hover:text-acr-blue-600 hover:bg-acr-gray-50",
  primary: "text-acr-blue-600 hover:text-acr-blue-800 hover:bg-acr-blue-50",
  danger: "text-red-600 hover:text-red-800 hover:bg-red-50",
} as const;

/**
 * ACR header component
 * Unified header component for both public and admin layouts
 */
export const AcrHeader = React.forwardRef<HTMLElement, AcrHeaderProps>(
  (
    {
      title,
      locale,
      onLocaleChange,
      languageToggleLabel,
      actions = [],
      utilityActions = [],
      className,
      borderVariant = "gray-200",
      ...props
    },
    ref
  ) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const homeLink = useHomeLink();

    const closeMenu = () => setIsMenuOpen(false);

    // Render menu item (for dropdown menu)
    const renderMenuItem = (action: AcrHeaderAction) => {
      const content = (
        <>
          {action.icon && <action.icon className="w-4 h-4" />}
          <span>{action.label}</span>
        </>
      );

      const baseClasses = cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        action.variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-acr-gray-700 hover:bg-acr-gray-50 hover:text-acr-red-600"
      );

      if (action.asButton || action.onClick) {
        return (
          <button
            key={action.id}
            onClick={() => {
              action.onClick?.();
              closeMenu();
            }}
            className={baseClasses}
            title={action.title}
          >
            {content}
          </button>
        );
      }

      if (action.href) {
        return (
          <Link
            key={action.id}
            href={action.href as any}
            onClick={closeMenu}
            className={baseClasses}
            title={action.title}
          >
            {content}
          </Link>
        );
      }

      return null;
    };

    return (
      <header
        ref={ref}
        className={cn(
          // Red accent line at top - brand signature (thicker 2px)
          "relative before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-acr-red-500",
          // Base styling with shadow instead of hard border
          "transition-colors shadow-md bg-white",
          className
        )}
        {...props}
      >
        <div className="px-4 py-3 max-w-md mx-auto lg:max-w-6xl lg:px-8 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
              <Link
                href={homeLink}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <AcrLogo className="h-14 md:h-12 lg:h-14" />
              </Link>
              {title && (
                <h1 className="acr-brand-heading-xl text-acr-gray-800 truncate hidden md:block">
                  {title}
                </h1>
              )}
            </div>

            {/* Unified Menu Button (hamburger menu) - Always visible when utilityActions provided */}
            {utilityActions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-center p-2 rounded-lg text-acr-gray-600 hover:text-acr-red-600 hover:bg-acr-gray-50 transition-colors"
                  aria-label="Menu"
                  title="Menu"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>

                {isMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={closeMenu} />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-acr-gray-200 py-1 z-20">
                      {/* Menu Items */}
                      {utilityActions.map((action) => renderMenuItem(action))}

                      {/* Divider before language switcher */}
                      {locale && onLocaleChange && languageToggleLabel && (
                        <div className="border-t border-acr-gray-200 my-1" />
                      )}

                      {/* Language Switcher (if provided) */}
                      {locale && onLocaleChange && languageToggleLabel && (
                        <div className="px-4 py-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-acr-gray-500 mb-2">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{languageToggleLabel}</span>
                          </div>
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                onLocaleChange("en");
                                closeMenu();
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded transition-colors",
                                locale === "en"
                                  ? "bg-acr-red-50 text-acr-red-600 font-medium"
                                  : "text-acr-gray-700 hover:bg-acr-gray-50"
                              )}
                            >
                              <span>English</span>
                              {locale === "en" && <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                onLocaleChange("es");
                                closeMenu();
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded transition-colors",
                                locale === "es"
                                  ? "bg-acr-red-50 text-acr-red-600 font-medium"
                                  : "text-acr-gray-700 hover:bg-acr-gray-50"
                              )}
                            >
                              <span>Español</span>
                              {locale === "es" && <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

AcrHeader.displayName = "AcrHeader";
