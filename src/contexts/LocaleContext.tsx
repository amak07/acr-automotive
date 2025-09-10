"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Locale, TranslationKeys } from "@/lib/i18n/translation-keys";
import { t as translateFn } from "@/lib/i18n";

// Step 1: Define what data the Context will provide
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isDevMode: boolean;
  t: (key: keyof TranslationKeys) => string;
}

// Step 2: Create the Context with default values
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Step 3: Create the Provider Component
interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  // State to track current locale
  const [locale, setLocale] = useState<Locale>("en");

  // Check if we're in development mode
  const isDevMode = process.env.NODE_ENV === "development";

  // Initialize locale based on environment
  useEffect(() => {
    if (isDevMode) {
      // In development, check localStorage for saved preference
      const savedLocale = localStorage.getItem("acr-locale") as Locale;
      if (savedLocale === "en" || savedLocale === "es") {
        setLocale(savedLocale);
      } else {
        setLocale("en"); // Default to English in dev
      }
    } else {
      // In production, always Spanish
      setLocale("es");
    }
  }, [isDevMode]);

  // Function to handle locale changes
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);

    // Save preference in development
    if (isDevMode) {
      localStorage.setItem("acr-locale", newLocale);
    }
  };

  // Translation function that uses current locale
  const t = (key: keyof TranslationKeys) => translateFn(key, locale);

  // Context value object
  const contextValue: LocaleContextType = {
    locale,
    setLocale: handleSetLocale,
    isDevMode,
    t,
  };

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

// Step 4: Custom Hook to use the Context
export function useLocale() {
  const context = useContext(LocaleContext);

  // Error handling - ensure Context is used within Provider
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}

// Step 5: Export Context for advanced usage (rare)
export { LocaleContext };
