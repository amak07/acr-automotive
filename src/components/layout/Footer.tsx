"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { useHomeLink } from "@/hooks";
import { useSettings } from "@/contexts/SettingsContext";

export function Footer() {
  const homeLink = useHomeLink();
  const { settings } = useSettings();

  // Fallback to hardcoded values if settings not loaded
  const contactEmail = settings?.contact_info?.email || "contacto@acrautomotive.com";
  const address = settings?.contact_info?.address || "Ciudad de México, CDMX";
  const companyName = settings?.branding?.company_name || "ACR Automotive";

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
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 hover:text-acr-red-600 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>{contactEmail}</span>
              </a>
            )}

            {address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-acr-gray-200 text-center text-xs text-acr-gray-600">
          © {new Date().getFullYear()} {companyName}. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
