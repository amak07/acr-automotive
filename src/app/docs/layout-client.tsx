"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { AdminPasswordModal } from "@/components/shared/auth/AdminPasswordModal";
import type { ReactNode } from "react";

export function DocsLayoutClient({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication after component mounts (client-side only)
    const adminAuth = sessionStorage.getItem("admin-authenticated");
    const isAuthed = adminAuth === "true";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(isAuthed);
    if (!isAuthed) {
      setShowPasswordModal(true);
    }
  }, []);

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
