"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPasswordModal } from "./AdminPasswordModal";

export function withAdminAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function AdminProtectedComponent(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
      // Check if admin is already authenticated in this session
      const adminAuth = sessionStorage.getItem("admin-authenticated");

      if (adminAuth === "true") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
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

    // Render the protected component if authenticated
    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }

    // Fallback - should not reach here but redirect to home if it does
    router.push("/");
    return null;
  };
}