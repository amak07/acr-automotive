"use client";

import { useAuth } from "@/contexts/AuthContext";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

interface DocsAccessCheckProps {
  children: ReactNode;
  allowedRoles: string[];
}

/**
 * Client-side role check for docs pages.
 * Prevents direct URL access to restricted pages.
 * Returns 404 for unauthorized access (doesn't reveal page existence).
 */
export function DocsAccessCheck({ children, allowedRoles }: DocsAccessCheckProps) {
  const { profile, isLoading } = useAuth();

  // Still loading - show nothing (layout shows spinner)
  if (isLoading) return null;

  // Check if user's role is allowed
  if (!profile || !allowedRoles.includes(profile.role)) {
    notFound(); // Returns 404 for unauthorized access
  }

  return <>{children}</>;
}
