"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { AdminPasswordModal } from "@/components/shared/auth/AdminPasswordModal";
import type { ReactNode } from "react";

export function DocsLayoutClient({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    // Initialize state from sessionStorage
    if (typeof window === "undefined") return null;
    const adminAuth = sessionStorage.getItem("admin-authenticated");
    return adminAuth === "true";
  });
  const [showPasswordModal, setShowPasswordModal] = useState(() => {
    // Show modal if not authenticated
    if (typeof window === "undefined") return false;
    const adminAuth = sessionStorage.getItem("admin-authenticated");
    return adminAuth !== "true";
  });
  const router = useRouter();

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordModal(false);
  };

  const handleAuthCancel = () => {
    setShowPasswordModal(false);
    router.push("/");
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-acr-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-acr-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-acr-gray-600">Checking access...</span>
        </div>
      </div>
    );
  }

  // Show password modal if not authenticated
  if (!isAuthenticated && showPasswordModal) {
    return (
      <AdminPasswordModal
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
      />
    );
  }

  // Render the docs with header if authenticated
  if (isAuthenticated) {
    return (
      <>
        <AppHeader variant="admin" />
        {children}
      </>
    );
  }

  // Fallback - should not reach here but redirect to home if it does
  router.push("/");
  return null;
}
