"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

export function DocsLayoutClient({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent("/docs")}`);
    }
  }, [isLoading, user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-acr-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-acr-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-acr-gray-600">Checking access...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user || !profile?.is_active) {
    return null;
  }

  // Render the docs with header if authenticated
  return (
    <>
      <AppHeader variant="admin" />
      {children}
    </>
  );
}
