"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useGetAdminStats } from "@/hooks";
import { AcrCard } from "@/components/acr";
import { Bolt, Car, Waypoints } from "lucide-react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/error-states";

export function DashboardCards() {
  const { t, locale } = useLocale();
  const { data, isLoading, isError } = useGetAdminStats();

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "--";
    return new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US").format(
      num
    );
  };
  const statsCards = [
    {
      cardTitle: "admin.dashboard.totalParts",
      count: data?.totalParts,
      icon: Bolt,
      isPrimary: true, // Primary card gets ACR red accent
    },
    {
      cardTitle: "admin.dashboard.applications",
      count: data?.totalVehicles,
      icon: Car,
      isPrimary: false,
    },
    {
      cardTitle: "admin.dashboard.crossReferences",
      count: data?.totalCrossReferences,
      icon: Waypoints,
      isPrimary: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3 lg:gap-6">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        const staggerClass = `acr-stagger-${index + 1}`;

        return (
          <AcrCard
            key={index}
            variant="default"
            padding="default"
            className="acr-animate-fade-up acr-admin-card-hover"
            data-stagger={staggerClass}
            style={{
              animationDelay: `${0.7 + index * 0.05}s`,
            }}
          >
            <div className="flex items-center gap-3">
              {isLoading && (
                <>
                  <Skeleton className="w-10 h-10 rounded-xl lg:w-12 lg:h-12" />
                  <div className="flex-1 space-y-2">
                    <SkeletonText width="16" className="h-6 lg:h-8" />
                    <SkeletonText width="24" className="h-3 lg:h-4" />
                  </div>
                </>
              )}

              {isError && (
                <InlineError
                  title={t("common.error.generic")}
                  message={t("common.error.tryAgain")}
                />
              )}

              {!isLoading && !isError && (
                <>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center lg:w-12 lg:h-12 transition-colors duration-300 ${
                      card.isPrimary
                        ? "bg-acr-red-100 text-acr-red-600"
                        : "bg-acr-gray-100 text-acr-gray-600"
                    }`}
                  >
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`acr-heading-5 transition-colors duration-300 ${
                        card.isPrimary
                          ? "text-acr-red-600"
                          : "text-acr-gray-800"
                      }`}
                    >
                      {formatNumber(card.count)}
                    </div>
                    <div className="acr-caption text-acr-gray-500">
                      {t(card.cardTitle as any)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </AcrCard>
        );
      })}
    </div>
  );
}
