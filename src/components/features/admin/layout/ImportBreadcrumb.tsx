"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function ImportBreadcrumb() {
  const { t } = useLocale();

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/admin"
              className="text-acr-gray-600 hover:text-acr-gray-800"
            >
              {t("admin.header.admin")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-acr-gray-600" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-acr-gray-800 font-medium">
              {t("admin.import.pageTitle")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
