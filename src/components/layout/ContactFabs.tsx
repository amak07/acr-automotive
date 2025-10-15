"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useLocale } from "@/contexts/LocaleContext";

/**
 * ContactFabs - Floating Action Buttons for WhatsApp and Email
 *
 * Displays fixed position contact buttons on the left side of the screen
 * Similar to reference site: https://baleros-bisa.com
 *
 * Features:
 * - WhatsApp direct chat link (opens WhatsApp with phone number)
 * - Email direct link (opens email client)
 * - Responsive design (hides on small mobile screens)
 * - Dynamic content from site settings
 * - Accessible with ARIA labels
 */
export function ContactFabs() {
  const { settings, isLoading } = useSettings();
  const { t } = useLocale();

  // Don't render if settings not loaded or contact info missing
  if (isLoading || !settings?.contact_info) {
    return null;
  }

  const { email, whatsapp } = settings.contact_info;

  // Don't render if both contact methods are empty
  if (!email && !whatsapp) {
    return null;
  }

  // Format WhatsApp link (remove non-numeric characters and add country code if needed)
  const formatWhatsAppNumber = (phone: string): string => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // If number doesn't start with country code, assume Mexico (+52)
    return cleaned.startsWith('52') ? cleaned : `52${cleaned}`;
  };

  const whatsappLink = whatsapp
    ? `https://wa.me/${formatWhatsAppNumber(whatsapp)}`
    : null;

  const emailLink = email ? `mailto:${email}` : null;

  return (
    <div
      className="fixed left-4 bottom-32 z-50 flex-col gap-3 hidden md:flex"
      role="complementary"
      aria-label={t('contactFabs.ariaLabel')}
    >
      {/* WhatsApp FAB */}
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
          aria-label={t('contactFabs.whatsapp.ariaLabel')}
          title={t('contactFabs.whatsapp.tooltip')}
        >
          {/* Subtle pulsing ring effect */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-[ping-small_2s_ease-in-out_infinite] [animation-delay:0s]" />
          <MessageCircle className="relative z-10 h-7 w-7" />
          {/* Tooltip on hover */}
          <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
            {t('contactFabs.whatsapp.tooltip')}
          </span>
        </a>
      )}

      {/* Email FAB */}
      {emailLink && (
        <a
          href={emailLink}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#c41e3a] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c41e3a] focus-visible:ring-offset-2"
          aria-label={t('contactFabs.email.ariaLabel')}
          title={t('contactFabs.email.tooltip')}
        >
          {/* Subtle pulsing ring effect */}
          <span className="absolute inset-0 rounded-full bg-[#c41e3a] opacity-75 animate-[ping-small_2s_ease-in-out_infinite] [animation-delay:0s]" />
          <Mail className="relative z-10 h-7 w-7" />
          {/* Tooltip on hover */}
          <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
            {t('contactFabs.email.tooltip')}
          </span>
        </a>
      )}
    </div>
  );
}
