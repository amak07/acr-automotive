"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { AcrLanguageToggle } from "./LanguageToggle";
import { Locale } from "@/lib/i18n";

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
   * Current locale for language toggle
   */
  locale: Locale;

  /**
   * Locale change handler
   */
  onLocaleChange: (locale: Locale) => void;

  /**
   * Language toggle label text
   */
  languageToggleLabel: string;

  /**
   * Navigation actions for desktop/mobile
   */
  actions?: AcrHeaderAction[];

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
      className,
      borderVariant = "gray-200",
      ...props
    },
    ref
  ) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const renderAction = (action: AcrHeaderAction, isMobile = false) => {
      const baseClasses = cn(
        "flex items-center gap-2 px-3 py-2 acr-body-small rounded-md transition-all duration-200",
        actionVariantClasses[action.variant || "default"],
        isMobile && "py-3",
        action.className
      );

      const content = (
        <>
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </>
      );

      if (action.asButton) {
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              action.onClick?.();
              if (isMobile) closeMobileMenu();
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
            onClick={isMobile ? closeMobileMenu : undefined}
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
          "transition-colors",
          `border-b border-acr-${borderVariant}`,
          isMobileMenuOpen ? "bg-acr-gray-50" : "bg-white",
          className
        )}
        {...props}
      >
        <div className="px-4 py-3 max-w-md mx-auto lg:max-w-6xl lg:px-8 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
              <AcrLogo className="h-7 lg:h-8 flex-shrink-0" />
              <h1 className="acr-heading-5 lg:acr-heading-4 text-acr-gray-800 truncate">
                {title}
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {/* Actions */}
              {actions.map((action) => renderAction(action))}

              {/* Language Toggle */}
              <AcrLanguageToggle
                locale={locale}
                onLocaleChange={onLocaleChange}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-acr-gray-200">
              <div className="space-y-3">
                {/* Mobile Actions */}
                {actions.map((action) => renderAction(action, true))}

                {/* Language Selection - Footer */}
                <div className="pt-3 mt-3 border-t border-acr-gray-200">
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="acr-body-small text-acr-gray-700">
                        {languageToggleLabel}
                      </span>
                    </div>
                    <AcrLanguageToggle
                      locale={locale}
                      onLocaleChange={(newLocale) => {
                        onLocaleChange(newLocale);
                        closeMobileMenu();
                      }}
                      size="sm"
                      className="w-fit"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }
);

AcrHeader.displayName = "AcrHeader";