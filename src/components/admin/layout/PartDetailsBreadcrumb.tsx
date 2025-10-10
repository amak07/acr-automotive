"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface PartDetailsBreadcrumbProps {
  acrSku?: string;
  partId: string;
}

export function PartDetailsBreadcrumb({ acrSku, partId }: PartDetailsBreadcrumbProps) {
  const { t } = useLocale();
  const searchParams = useSearchParams();

  // Preserve search params when going back
  const currentSearch = searchParams?.toString() || '';
  const backLink = `/admin${currentSearch ? `?${currentSearch}` : ''}`;

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={backLink}
              className="text-acr-gray-600 hover:text-acr-gray-800"
            >
              {t("partDetails.breadcrumb.parts")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-acr-gray-600" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-acr-gray-800 font-medium">
              {acrSku || partId}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}