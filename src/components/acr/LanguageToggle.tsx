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
  },
  es: {
    label: "ES",
    title: "Cambiar a Español",
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
      "flex items-center gap-1 px-3 py-2 bg-acr-gray-100 rounded-lg border border-acr-gray-300",
      disabled && "opacity-50 cursor-not-allowed",
      className
    );

    const buttonClasses = (isActive: boolean) =>
      cn(
        // Base styles
        "px-3 py-1 text-sm font-medium rounded transition-all duration-200",

        // Active/inactive states
        isActive
          ? "bg-acr-red-600 text-white shadow-sm"
          : "text-acr-gray-600 hover:text-acr-gray-900",

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
              className={buttonClasses(isActive)}
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