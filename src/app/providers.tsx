"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootProvider } from "fumadocs-ui/provider/next";
import { useState } from "react";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RootProvider
        theme={{
          enabled: false, // Disable dark mode completely
        }}
      >
        <AuthProvider>
          <SettingsProvider>
            <LocaleProvider>{children}</LocaleProvider>
          </SettingsProvider>
        </AuthProvider>
      </RootProvider>
    </QueryClientProvider>
  );
}
