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
    <>
      {/* Mobile: Single combined card */}
      <div className="lg:hidden">
        <AcrCard
          variant="default"
          padding="compact"
          className="acr-animate-fade-up"
        >
          {isLoading && (
            <div className="space-y-3">
              {statsCards.map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <SkeletonText width="1/3" className="h-4" />
                    <SkeletonText width="1/2" className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <InlineError
              title={t("common.error.generic")}
              message={t("common.error.tryAgain")}
            />
          )}

          {!isLoading && !isError && (
            <div className="flex flex-col gap-3">
              {statsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                        card.isPrimary
                          ? "bg-acr-red-100 text-acr-red-600"
                          : "bg-acr-gray-100 text-acr-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-bold leading-none transition-colors duration-300 ${
                          card.isPrimary
                            ? "text-acr-red-600"
                            : "text-acr-gray-800"
                        }`}
                      >
                        {formatNumber(card.count)}
                      </div>
                      <div className="text-xs leading-tight mt-1 text-acr-gray-500 font-medium">
                        {t(card.cardTitle as any)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AcrCard>
      </div>

      {/* Desktop: 3 separate cards */}
      <div className="hidden lg:grid grid-cols-3 gap-3 md:gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          const staggerClass = `acr-stagger-${index + 1}`;

          return (
            <AcrCard
              key={index}
              variant="default"
              padding="compact"
              className="acr-animate-fade-up hover:border-acr-red-200 hover:shadow-md transition-all duration-300"
              data-stagger={staggerClass}
              style={{
                animationDelay: `${0.7 + index * 0.05}s`,
              }}
            >
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="w-8 h-8 rounded-lg lg:w-10 lg:h-10" />
                  <SkeletonText width="full" className="h-5 lg:h-7" />
                  <SkeletonText width="3/4" className="h-3" />
                </div>
              )}

              {isError && (
                <InlineError
                  title={t("common.error.generic")}
                  message={t("common.error.tryAgain")}
                />
              )}

              {!isLoading && !isError && (
                <div className="space-y-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center lg:w-8 lg:h-8 transition-colors duration-300 ${
                      card.isPrimary
                        ? "bg-acr-red-100 text-acr-red-600"
                        : "bg-acr-gray-100 text-acr-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 lg:w-4 lg:h-4" />
                  </div>
                  <div>
                    <div
                      className={`text-xl font-bold leading-none lg:text-2xl transition-colors duration-300 ${
                        card.isPrimary
                          ? "text-acr-red-600"
                          : "text-acr-gray-800"
                      }`}
                    >
                      {formatNumber(card.count)}
                    </div>
                    <div className="text-xs leading-tight mt-1.5 lg:text-xs text-acr-gray-500 font-medium">
                      {t(card.cardTitle as any)}
                    </div>
                  </div>
                </div>
              )}
            </AcrCard>
          );
        })}
      </div>
    </>
  );
}
