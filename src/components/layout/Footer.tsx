"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { useHomeLink } from "@/hooks";

export function Footer() {
  const homeLink = useHomeLink();

  return (
    <footer className="border-t border-acr-gray-200 bg-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href={homeLink} className="hover:opacity-80 transition-opacity">
            <AcrLogo className="h-8" />
          </Link>

          {/* Contact Info */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-acr-gray-700">
            <a
              href="mailto:contacto@acrautomotive.com"
              className="flex items-center gap-2 hover:text-acr-red-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>contacto@acrautomotive.com</span>
            </a>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Ciudad de México, CDMX</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-acr-gray-200 text-center text-xs text-acr-gray-600">
          © {new Date().getFullYear()} ACR Automotive. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
