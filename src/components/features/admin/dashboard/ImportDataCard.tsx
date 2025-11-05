"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { AcrCard } from "@/components/acr";
import { useLocale } from "@/contexts/LocaleContext";

export function ImportDataCard() {
  const { t } = useLocale();

  return (
    <Link href="/admin/import" className="block">
      <AcrCard
        variant="featured"
        padding="default"
        className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          <div className="w-12 h-12 bg-acr-red-50 rounded-lg flex items-center justify-center lg:w-14 lg:h-14">
            <Upload className="text-acr-red-600 w-6 h-6 lg:w-7 lg:h-7" />
          </div>
          <div className="text-center">
            <div className="acr-heading-5 text-acr-gray-900 mb-1">
              {t("admin.import.title")}
            </div>
            <div className="acr-caption text-acr-gray-600">
              {t("admin.import.cardDescription")}
            </div>
          </div>
        </div>
      </AcrCard>
    </Link>
  );
}
