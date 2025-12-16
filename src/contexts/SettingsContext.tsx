"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@/types/domain/settings";

interface SettingsContextValue {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: Error | null;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Fetch settings from public API
  const { data, isLoading, error } = useQuery({
    queryKey: ["public", "settings"],
    queryFn: async () => {
      const response = await fetch("/api/public/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      return data.settings as SiteSettings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  return (
    <SettingsContext.Provider
      value={{
        settings: data || null,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
