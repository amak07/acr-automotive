"use client";

import { useLocale } from "@/contexts/LocaleContext";

interface PartMetadataProps {
  createdAt?: string;
  updatedAt?: string;
}

export function PartMetadata({ createdAt, updatedAt }: PartMetadataProps) {
  const { t, locale } = useLocale();

  if (!createdAt && !updatedAt) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return locale === "es" ? "hoy" : "today";
    } else if (diffInDays === 1) {
      return locale === "es" ? "hace 1 día" : "1 day ago";
    } else if (diffInDays < 7) {
      return locale === "es" ? `hace ${diffInDays} días` : `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return locale === "es"
        ? `hace ${weeks} semana${weeks > 1 ? 's' : ''}`
        : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-acr-gray-200 bg-acr-gray-50 lg:px-6">
      <p className="text-xs text-acr-gray-500 text-center">
        {createdAt && (
          <>
            {t("partDetails.metadata.created")} {formatDate(createdAt)}
          </>
        )}
        {createdAt && updatedAt && (
          <span className="mx-2">{t("partDetails.metadata.separator")}</span>
        )}
        {updatedAt && (
          <>
            {t("partDetails.metadata.lastModified")} {formatRelativeTime(updatedAt)}
          </>
        )}
      </p>
    </div>
  );
}