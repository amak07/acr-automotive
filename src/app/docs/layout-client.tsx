"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { filterEnrichedTreeByRole, type EnrichedPageTree } from "@/lib/docs-utils";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from "react";

interface DocsLayoutClientProps {
  children: ReactNode;
  pageTree: EnrichedPageTree;
}

export function DocsLayoutClient({ children, pageTree }: DocsLayoutClientProps) {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Filter page tree based on user role
  const filteredTree = useMemo(() => {
    if (!profile) return pageTree;
    return filterEnrichedTreeByRole(pageTree, profile.role);
  }, [pageTree, profile]);

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

  // Render the docs with role-appropriate header and filtered sidebar
  // Cast to any for DocsLayout since the enriched tree is compatible
  return (
    <>
      <AppHeader variant={isAdmin ? "admin" : "data-portal"} />
      <DocsLayout tree={filteredTree as unknown as Parameters<typeof DocsLayout>[0]["tree"]} {...baseOptions()}>
        {children}
      </DocsLayout>
    </>
  );
}
