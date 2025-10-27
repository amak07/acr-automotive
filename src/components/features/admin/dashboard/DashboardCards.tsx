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
      icon: () => <Bolt className="text-acr-gray-600 w-4 h-4 lg:w-5 lg:h-5" />,
    },
    {
      cardTitle: "admin.dashboard.applications",
      count: data?.totalVehicles,
      icon: () => <Car className="text-acr-gray-600 w-4 h-4 lg:w-5 lg:h-5" />,
    },
    {
      cardTitle: "admin.dashboard.crossReferences",
      count: data?.totalCrossReferences,
      icon: () => (
        <Waypoints className="text-acr-gray-600 w-4 h-4 lg:w-5 lg:h-5" />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3 lg:gap-6">
      {statsCards.map((card, index) => (
        <AcrCard
          key={index}
          variant="default"
          padding="default"
        >
          <div className="flex items-center gap-3">
            {isLoading && (
              <>
                <Skeleton className="w-8 h-8 rounded-md lg:w-10 lg:h-10" />
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
                <div className="w-8 h-8 bg-acr-gray-100 rounded-md flex items-center justify-center lg:w-10 lg:h-10">
                  <card.icon />
                </div>
                <div className="flex-1">
                  <div className="acr-heading-5 text-acr-gray-800">
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
      ))}
    </div>
  );
}
