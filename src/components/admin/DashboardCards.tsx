"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useGetAdminStats } from "@/hooks/useAdminStats";
import { Bolt, Car, Loader2, Waypoints } from "lucide-react";

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
        <div
          key={index}
          className="bg-white p-4 rounded-lg border border-acr-gray-200 lg:p-5"
        >
          <div className="flex items-center gap-3">
            {isLoading && (
              <>
                <div className="w-8 h-8 bg-acr-gray-100 rounded-md flex items-center justify-center lg:w-10 lg:h-10">
                  <Loader2 className="w-4 h-4 animate-spin text-acr-red-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-semibold text-acr-gray-800 lg:text-2xl">
                    --
                  </div>
                  <div className="text-xs text-acr-gray-500 lg:text-sm">
                    {t("common.loading")}
                  </div>
                </div>
              </>
            )}

            {isError && (
              <div className="flex items-center justify-center w-full py-6">
                <div className="text-center">
                  <p className="text-xs text-red-600 mb-1">
                    {t("common.error.generic")}
                  </p>
                  <p className="text-xs text-acr-gray-500">
                    {t("common.error.tryAgain")}
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !isError && (
              <>
                <div className="w-8 h-8 bg-acr-gray-100 rounded-md flex items-center justify-center lg:w-10 lg:h-10">
                  <card.icon />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-semibold text-acr-gray-800 lg:text-2xl">
                    {formatNumber(card.count)}
                  </div>
                  <div className="text-xs text-acr-gray-500 lg:text-sm">
                    {t(card.cardTitle as any)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
