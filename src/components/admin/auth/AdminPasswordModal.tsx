"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, X } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrSpinner, AcrButton, AcrInput } from "@/components/acr";

interface AdminPasswordModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminPasswordModal({ onSuccess, onCancel }: AdminPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLocale();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      // Check password against environment variable via API
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Store admin session in sessionStorage for MVP
        sessionStorage.setItem("admin-authenticated", "true");
        onSuccess();
      } else {
        setError("Invalid password. Please try again.");
        setPassword("");
      }
    } catch (error) {
      setError("Authentication failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onCancel();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-acr-red-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-acr-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Access Required
              </h2>
              <p className="text-sm text-gray-600">
                Enter admin password to continue
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-acr-red-500"
                placeholder="Enter admin password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <AcrButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </AcrButton>
            <AcrButton
              type="submit"
              variant="primary"
              disabled={isVerifying || !password.trim()}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <AcrSpinner size="sm" color="white" />
                  Verifying...
                </>
              ) : (
                "Access Admin"
              )}
            </AcrButton>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            This is a temporary authentication system for MVP. Contact administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}