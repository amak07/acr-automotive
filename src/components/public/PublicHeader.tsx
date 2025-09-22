"use client";

import Link from "next/link";
import { AcrLogo } from "@/components/ui/AcrLogo";

export function PublicHeader() {
  return (
    <header className="bg-white border-b border-acr-gray-200">
      <div className="px-4 py-4 max-w-md mx-auto lg:max-w-6xl lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AcrLogo className="h-8" />
            <h1 className="text-xl font-semibold text-acr-gray-800">
              Product Catalogue
            </h1>
          </div>

          {/* Admin Access */}
          <Link
            href="/admin"
            className="text-sm text-acr-gray-600 hover:text-acr-red-600 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}