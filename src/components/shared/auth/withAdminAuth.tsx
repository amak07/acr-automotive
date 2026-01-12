"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPasswordModal } from "./AdminPasswordModal";
import { Preloader } from "@/components/ui/Preloader";

// Path to dotLottie animation in public folder
const GEAR_ANIMATION_SRC = "/animations/gear-loader.lottie";

export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
      null
    );
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

    // Show branded preloader while checking authentication
    if (isAuthenticated === null) {
      return <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />;
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
