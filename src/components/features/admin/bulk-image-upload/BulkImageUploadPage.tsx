"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useGetParts } from "@/hooks";
import { PartsImageTable } from "./PartsImageTable";
import { BulkUploadModal } from "./BulkUploadModal";
import {
  AcrButton,
  AcrSearchInput,
  AcrSelect,
  AcrLabel,
} from "@/components/acr";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Upload } from "lucide-react";
import type { PartWithImageStats } from "@/types";

export function BulkImageUploadPage() {
  const { t } = useLocale();

  // Filter state
  const [search, setSearch] = useState("");
  const [hasImages, setHasImages] = useState<"all" | "yes" | "no">("all");
  const [has360, setHas360] = useState<"all" | "yes" | "no">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const limit = 25;

  // Fetch parts with image stats
  const {
    data: partsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetParts({
    limit,
    offset: (currentPage - 1) * limit,
    sort_by: "acr_sku",
    sort_order: "asc",
    search: search || undefined,
    has_images: hasImages,
    has_360: has360,
    include_image_stats: true,
  });

  const parts = (partsResponse?.data || []) as PartWithImageStats[];
  const totalCount = partsResponse?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleUploadComplete = () => {
    refetch();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
                {t("admin.bulkUpload.title")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="acr-heading-5 text-acr-gray-800">
            {t("admin.bulkUpload.title")}
          </h2>
          <p className="acr-body-small text-acr-gray-500">
            {t("admin.bulkUpload.description")}
          </p>
        </div>
        <AcrButton
          variant="primary"
          size="default"
          onClick={() => setIsModalOpen(true)}
        >
          <Upload className="h-4 w-4" />
          {t("admin.bulkUpload.uploadFolder")}
        </AcrButton>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-acr-gray-200 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <AcrLabel>{t("admin.bulkUpload.searchPlaceholder")}</AcrLabel>
            <AcrSearchInput
              placeholder={t("admin.bulkUpload.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              size="default"
            />
          </div>

          {/* Image Filter */}
          <div className="w-full lg:w-[180px]">
            <AcrLabel>{t("admin.bulkUpload.filterImages")}</AcrLabel>
            <AcrSelect.Root
              value={hasImages}
              onValueChange={(value: "all" | "yes" | "no") => {
                setHasImages(value);
                setCurrentPage(1);
              }}
            >
              <AcrSelect.Trigger>
                <AcrSelect.Value
                  placeholder={t("admin.bulkUpload.filterImages")}
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="all">
                  {t("admin.bulkUpload.allParts")}
                </AcrSelect.Item>
                <AcrSelect.Item value="yes">
                  {t("admin.bulkUpload.hasImages")}
                </AcrSelect.Item>
                <AcrSelect.Item value="no">
                  {t("admin.bulkUpload.noImages")}
                </AcrSelect.Item>
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* 360° Filter */}
          <div className="w-full lg:w-[180px]">
            <AcrLabel>{t("admin.bulkUpload.filter360")}</AcrLabel>
            <AcrSelect.Root
              value={has360}
              onValueChange={(value: "all" | "yes" | "no") => {
                setHas360(value);
                setCurrentPage(1);
              }}
            >
              <AcrSelect.Trigger>
                <AcrSelect.Value
                  placeholder={t("admin.bulkUpload.filter360")}
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="all">
                  {t("admin.bulkUpload.allParts")}
                </AcrSelect.Item>
                <AcrSelect.Item value="yes">
                  {t("admin.bulkUpload.has360")}
                </AcrSelect.Item>
                <AcrSelect.Item value="no">
                  {t("admin.bulkUpload.no360")}
                </AcrSelect.Item>
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <PartsImageTable
        parts={parts}
        isLoading={isLoading}
        isError={isError}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        limit={limit}
        onPageChange={setCurrentPage}
      />

      {/* Upload Modal */}
      <BulkUploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}
