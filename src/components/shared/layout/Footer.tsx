"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { useHomeLink } from "@/hooks";
import { useSettings } from "@/contexts/SettingsContext";
import { useLocale } from "@/contexts/LocaleContext";

export function Footer() {
  const homeLink = useHomeLink();
  const { settings } = useSettings();
  const { t } = useLocale();
  const pathname = usePathname();

  // Don't render on docs pages
  if (pathname?.startsWith("/docs")) {
    return null;
  }

  // Fallback to hardcoded values if settings not loaded
  const contactEmail =
    settings?.contact_info?.email || "contacto@acrautomotive.com";
  const whatsapp = settings?.contact_info?.whatsapp || "";
  const address = settings?.contact_info?.address || "Ciudad de México, CDMX";
  const companyName = settings?.branding?.company_name || "ACR Automotive";

  // Format WhatsApp link (remove non-numeric characters and add country code if needed)
  const formatWhatsAppNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.startsWith("52") ? cleaned : `52${cleaned}`;
  };

  const whatsappLink = whatsapp
    ? `https://wa.me/${formatWhatsAppNumber(whatsapp)}`
    : null;

  return (
    <footer className="border-t border-acr-gray-200 bg-white mt-auto">
      <div className="container mx-auto px-6 py-8 md:px-12 md:py-10 lg:px-16">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <Link href={homeLink} className="hover:opacity-80 transition-opacity">
            <AcrLogo className="h-8" />
          </Link>

          {/* Social/Contact Links */}
          <div className="flex items-center gap-4 md:gap-6">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 group"
                aria-label="WhatsApp"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-xs text-acr-gray-600 group-hover:text-[#25D366] transition-colors">
                  {t("footer.contact.whatsapp")}
                </span>
              </a>
            )}

            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="flex flex-col items-center gap-1.5 group"
                aria-label="Email"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-acr-red-600 text-white transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-xs text-acr-gray-600 group-hover:text-acr-red-600 transition-colors">
                  {t("footer.contact.email")}
                </span>
              </a>
            )}

            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 group"
                aria-label="Location"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-acr-gray-700 text-white transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-xs text-acr-gray-600 group-hover:text-acr-gray-700 transition-colors">
                  {t("footer.contact.location")}
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-acr-gray-200 text-center text-xs text-acr-gray-600">
          © {new Date().getFullYear()} {companyName}. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
