import * as React from "react";
import { cn } from "@/lib/utils";
import { Locale } from "@/lib/i18n/translation-keys";

export interface AcrLanguageToggleProps {
  /**
   * Current selected locale
   */
  locale: Locale;

  /**
   * Callback when locale changes
   */
  onLocaleChange: (locale: Locale) => void;

  /**
   * Visual variant of the toggle
   * @default "default"
   */
  variant?: "default" | "compact";

  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default";

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
}

const localeConfig = {
  en: {
    label: "EN",
    title: "Switch to English",
    activeColor: "text-acr-blue-600",
  },
  es: {
    label: "ES",
    title: "Cambiar a Español",
    activeColor: "text-acr-red-600",
  },
} as const;

/**
 * ACR language toggle component
 * Provides a consistent way to switch between English and Spanish
 */
export const AcrLanguageToggle = React.forwardRef<
  HTMLDivElement,
  AcrLanguageToggleProps
>(
  (
    {
      locale,
      onLocaleChange,
      variant = "default",
      size = "default",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const languages: Locale[] = ["en", "es"];

    const containerClasses = cn(
      "flex items-center bg-acr-gray-50 rounded-lg border",
      variant === "compact" ? "p-0.5" : "p-0.5 lg:p-1",
      disabled && "opacity-50 cursor-not-allowed",
      className
    );

    const buttonClasses = (isActive: boolean, lang: Locale) =>
      cn(
        // Base styles
        "font-medium rounded-md transition-all duration-200",

        // Size variants
        size === "sm"
          ? "px-2 py-1 text-xs min-h-[28px]"
          : "px-2 py-1 lg:px-3 lg:py-1.5 text-xs lg:text-sm min-h-[32px] lg:min-h-auto",

        // Active/inactive states
        isActive
          ? `bg-white shadow-sm ${localeConfig[lang].activeColor}`
          : "text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100",

        // Disabled state
        disabled && "cursor-not-allowed hover:bg-transparent hover:text-acr-gray-600"
      );

    const handleLocaleChange = (newLocale: Locale) => {
      if (!disabled && newLocale !== locale) {
        onLocaleChange(newLocale);
      }
    };

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {languages.map((lang) => {
          const config = localeConfig[lang];
          const isActive = locale === lang;

          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleLocaleChange(lang)}
              className={buttonClasses(isActive, lang)}
              title={config.title}
              disabled={disabled}
              aria-pressed={isActive}
              aria-label={config.title}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    );
  }
);

AcrLanguageToggle.displayName = "AcrLanguageToggle";