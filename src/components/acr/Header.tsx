"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LucideIcon, Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AcrLogo } from "@/components/ui/AcrLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Locale } from "@/lib/i18n";
import { useHomeLink } from "@/hooks";

// Simplified flag SVGs — reliable cross-platform (emoji flags break on Windows)
const FlagUS = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-4 h-3 rounded-[2px] shrink-0", className)}
    viewBox="0 0 16 12"
  >
    <rect width="16" height="12" fill="#B22234" />
    <rect y="1" width="16" height="1" fill="white" />
    <rect y="3" width="16" height="1" fill="white" />
    <rect y="5" width="16" height="1" fill="white" />
    <rect y="7" width="16" height="1" fill="white" />
    <rect y="9" width="16" height="1" fill="white" />
    <rect y="11" width="16" height="1" fill="white" />
    <rect width="7" height="6" fill="#3C3B6E" />
  </svg>
);

const FlagMX = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-4 h-3 rounded-[2px] shrink-0", className)}
    viewBox="0 0 16 12"
  >
    <rect width="5.33" height="12" fill="#006847" />
    <rect x="5.33" width="5.34" height="12" fill="white" />
    <rect x="10.67" width="5.33" height="12" fill="#CE1126" />
  </svg>
);

const localeFlags = {
  en: { Flag: FlagUS, short: "EN" },
  es: { Flag: FlagMX, short: "ES" },
} as const;

export interface AcrHeaderAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  asButton?: boolean;
  className?: string;
  title?: string;
}

export interface AcrHeaderProps {
  title: string;
  tagline?: string;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  languageToggleLabel?: string;
  /** Translated language names, e.g. { en: "English", es: "Spanish" } */
  languageLabels?: Record<Locale, string>;
  /** Navigation actions — shown inline on desktop, in hamburger on mobile */
  actions?: AcrHeaderAction[];
  /** All menu items for mobile hamburger dropdown */
  utilityActions?: AcrHeaderAction[];
  /** Logout action — rendered separately on desktop with distinct styling */
  logoutAction?: AcrHeaderAction;
  /** Display name of the logged-in user (shown next to logout) */
  userDisplayName?: string;
  className?: string;
  borderVariant?: "gray-200" | "gray-300";
}

/**
 * ACR header component
 * Desktop: inline nav links + language dropdown + logout icon
 * Mobile/Tablet: hamburger dropdown with all items
 */
export const AcrHeader = React.forwardRef<HTMLElement, AcrHeaderProps>(
  (
    {
      title,
      locale,
      onLocaleChange,
      languageToggleLabel,
      languageLabels,
      actions = [],
      utilityActions = [],
      logoutAction,
      userDisplayName,
      className,
      borderVariant = "gray-200",
      ...props
    },
    ref
  ) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const homeLink = useHomeLink();
    const pathname = usePathname();

    const closeMenu = () => setIsMenuOpen(false);

    const isActive = (href: string | undefined): boolean => {
      if (!href) return false;
      if (pathname === href) return true;
      // Prefix match for non-root paths (e.g., /admin matches /admin/users)
      if (href !== "/" && pathname.startsWith(href + "/")) return true;
      // Search (/) stays active on public part detail pages (/parts/*)
      if (href === "/" && pathname.startsWith("/parts/")) return true;
      return false;
    };

    // Desktop inline nav item — text-only, underline active state
    const renderDesktopNavItem = (action: AcrHeaderAction) => {
      const active = isActive(action.href);
      const classes = cn(
        "px-2 py-1 text-[13px] font-medium transition-colors border-b-2",
        active
          ? "text-acr-red-600 border-acr-red-500"
          : "text-acr-gray-500 border-transparent hover:text-acr-gray-800 hover:border-acr-gray-300"
      );

      if (action.href) {
        return (
          <Link
            key={action.id}
            href={action.href as any}
            className={classes}
            title={action.title || action.label}
          >
            {action.label}
          </Link>
        );
      }
      return null;
    };

    // Mobile dropdown menu item
    const renderMenuItem = (action: AcrHeaderAction) => {
      const active = isActive(action.href);

      const content = (
        <>
          {action.icon && <action.icon className="w-4 h-4" />}
          <span>{action.label}</span>
          {active && <Check className="w-4 h-4 ml-auto" />}
        </>
      );

      const baseClasses = cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        action.variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : active
            ? "bg-acr-red-50 text-acr-red-600 font-medium"
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

    // Current locale flag for the dropdown trigger
    const currentLocale = locale ? localeFlags[locale] : null;
    const currentLocaleLabel = locale && languageLabels ? languageLabels[locale] : null;

    return (
      <header
        ref={ref}
        className={cn(
          "relative before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-acr-red-500",
          "transition-colors shadow-md bg-white",
          className
        )}
        {...props}
      >
        <div className="px-4 py-3 max-w-md mx-auto lg:max-w-6xl lg:px-8 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
              <Link
                href={homeLink}
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <AcrLogo className="h-14 md:h-12 lg:h-14" />
              </Link>
              {title && (
                <h1
                  className={cn(
                    "acr-brand-heading-xl text-acr-gray-800 truncate hidden md:block",
                    actions.length > 0 && "lg:hidden"
                  )}
                >
                  {title}
                </h1>
              )}
            </div>

            {/* Desktop Nav - visible on lg+ screens */}
            {actions.length > 0 && (
              <nav className="hidden lg:flex items-center gap-2">
                {actions.map((action) => renderDesktopNavItem(action))}

                {/* Language dropdown — Google-style pill */}
                {locale && onLocaleChange && currentLocale && (
                  <>
                    <div className="ml-2 mr-1 h-4 w-px bg-acr-gray-200" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-acr-gray-500 hover:text-acr-gray-700 border border-acr-gray-300 rounded-full hover:bg-acr-gray-50 transition-colors"
                          title={languageToggleLabel}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{currentLocaleLabel}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs text-acr-gray-500">
                          {languageToggleLabel}
                        </DropdownMenuLabel>
                        {(["en", "es"] as Locale[]).map((lang) => {
                          const { Flag } = localeFlags[lang];
                          const label = languageLabels?.[lang] ?? lang;
                          const isSelected = locale === lang;
                          return (
                            <DropdownMenuItem
                              key={lang}
                              onClick={() => onLocaleChange(lang)}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                isSelected && "bg-acr-red-50"
                              )}
                            >
                              <Flag />
                              <span
                                className={cn(
                                  isSelected &&
                                    "text-acr-red-600 font-medium"
                                )}
                              >
                                {label}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 ml-auto text-acr-red-600" />
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {/* User display name + Logout */}
                {logoutAction && (
                  <>
                    <div className="ml-1.5 mr-1 h-4 w-px bg-acr-gray-200" />
                    {userDisplayName && (
                      <span className="text-xs font-semibold text-acr-gray-500 truncate max-w-35">
                        {userDisplayName}
                      </span>
                    )}
                    <button
                      onClick={logoutAction.onClick}
                      className="p-1.5 rounded-md text-acr-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={logoutAction.title || logoutAction.label}
                      aria-label={logoutAction.label}
                    >
                      {logoutAction.icon && (
                        <logoutAction.icon className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}
              </nav>
            )}

            {/* Mobile Hamburger Menu - hidden on lg+ */}
            {utilityActions.length > 0 && (
              <div className="relative lg:hidden">
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
                    <div className="fixed inset-0 z-10" onClick={closeMenu} />

                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-acr-gray-200 py-1 z-20">
                      {userDisplayName && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-acr-gray-500 truncate">
                            {userDisplayName}
                          </div>
                          <div className="border-t border-acr-gray-200 my-1" />
                        </>
                      )}
                      {utilityActions.map((action) => renderMenuItem(action))}

                      {locale && onLocaleChange && languageToggleLabel && (
                        <div className="border-t border-acr-gray-200 my-1" />
                      )}

                      {locale && onLocaleChange && languageToggleLabel && (
                        <div className="px-4 py-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-acr-gray-500 mb-2">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{languageToggleLabel}</span>
                          </div>
                          <div className="space-y-1">
                            {(["en", "es"] as Locale[]).map((lang) => {
                              const { Flag } = localeFlags[lang];
                              const label = languageLabels?.[lang] ?? lang;
                              const isSelected = locale === lang;
                              return (
                                <button
                                  key={lang}
                                  onClick={() => {
                                    onLocaleChange(lang);
                                    closeMenu();
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded transition-colors",
                                    isSelected
                                      ? "bg-acr-red-50 text-acr-red-600 font-medium"
                                      : "text-acr-gray-700 hover:bg-acr-gray-50"
                                  )}
                                >
                                  <Flag />
                                  <span>{label}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 ml-auto" />
                                  )}
                                </button>
                              );
                            })}
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
