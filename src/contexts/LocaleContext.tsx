"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useCallback,
  ReactNode,
} from "react";
import { Locale, TranslationKeys } from "@/lib/i18n/translation-keys";
import { t as translateFn } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

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

// Get the default locale for SSR and initial hydration
// IMPORTANT: This must return the same value on server and client to avoid hydration mismatch
function getDefaultLocale(isDevMode: boolean): Locale {
  // In dev, default to English; in production, default to Spanish
  return isDevMode ? "en" : "es";
}

// Subscribe to storage events for locale changes
function subscribeToLocale(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  // Also listen to custom events for same-tab updates
  window.addEventListener("locale-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("locale-changed", callback);
  };
}

// Read locale from localStorage (client snapshot)
function getLocaleSnapshot(isDevMode: boolean): Locale {
  if (typeof window === "undefined") return getDefaultLocale(isDevMode);
  const savedLocale = localStorage.getItem("acr-locale") as Locale;
  if (savedLocale === "en" || savedLocale === "es") {
    return savedLocale;
  }
  return getDefaultLocale(isDevMode);
}

// Server snapshot - always returns default locale
function getLocaleServerSnapshot(isDevMode: boolean): Locale {
  return getDefaultLocale(isDevMode);
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  // Check if we're in development mode
  const isDevMode = process.env.NODE_ENV === "development";
  const { profile } = useAuth();

  // Use useSyncExternalStore to read locale from localStorage
  // This avoids hydration mismatches and setState-in-effect issues
  const locale = useSyncExternalStore(
    subscribeToLocale,
    () => getLocaleSnapshot(isDevMode),
    () => getLocaleServerSnapshot(isDevMode)
  );

  // Sync locale from user profile on login (database is source of truth)
  useEffect(() => {
    if (profile?.preferred_locale && profile.preferred_locale !== locale) {
      localStorage.setItem("acr-locale", profile.preferred_locale);
      window.dispatchEvent(new Event("locale-changed"));
    }
    // Intentionally omitting `locale` to avoid re-sync loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferred_locale]);

  // Function to handle locale changes — also persists to database
  const handleSetLocale = useCallback(
    (newLocale: Locale) => {
      // 1. Update localStorage immediately (instant UI response)
      localStorage.setItem("acr-locale", newLocale);
      window.dispatchEvent(new Event("locale-changed"));

      // 2. Fire-and-forget save to database (if authenticated)
      if (profile?.id) {
        fetch("/api/auth/profile/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferred_locale: newLocale }),
        }).catch((err) => {
          console.warn("Failed to persist locale preference:", err);
        });
      }
    },
    [profile?.id]
  );

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
