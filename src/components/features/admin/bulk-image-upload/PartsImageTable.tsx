"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrTable, AcrTableColumn, AcrPagination } from "@/components/acr";
import { Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import type { PartWithImageStats } from "@/types";
import { VALIDATION } from "@/lib/bulk-upload/patterns.config";

interface PartsImageTableProps {
  parts: PartWithImageStats[];
  isLoading: boolean;
  isError: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function PartsImageTable({
  parts,
  isLoading,
  isError,
  currentPage,
  totalPages,
  totalCount,
  limit,
  onPageChange,
}: PartsImageTableProps) {
  const router = useRouter();
  const { t } = useLocale();

  const handleRowClick = (part: PartWithImageStats) => {
    router.push(`/admin/parts/${part.acr_sku}`);
  };

  // Define table columns
  const columns: AcrTableColumn<PartWithImageStats>[] = [
    {
      key: "primary_image_url",
      label: t("admin.bulkUpload.thumb"),
      headerClassName: "w-[80px]",
      render: (value, part) =>
        value ? (
          <img
            src={value}
            alt={part?.acr_sku || ""}
            className="h-10 w-10 object-cover rounded border border-acr-gray-200"
          />
        ) : (
          <div className="h-10 w-10 rounded border border-acr-gray-200 bg-acr-gray-50 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-acr-gray-400" />
          </div>
        ),
    },
    {
      key: "acr_sku",
      label: t("admin.bulkUpload.part"),
      render: (value) => (
        <span className="bg-acr-red-50 text-acr-red-700 px-2 py-1 rounded font-mono font-semibold acr-body-small">
          {value}
        </span>
      ),
    },
    {
      key: "image_count",
      label: t("admin.bulkUpload.images"),
      headerClassName: "text-center",
      className: "text-center",
      render: (value) => (
        <ImageCountBadge count={value || 0} max={VALIDATION.maxProductImages} />
      ),
    },
    {
      key: "has_360_viewer",
      label: t("admin.bulkUpload.viewer360"),
      headerClassName: "text-center",
      className: "text-center",
      render: (value, part) => (
        <ViewerStatusBadge
          has360={value}
          frameCount={part?.viewer_360_frame_count || null}
        />
      ),
    },
  ];

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-acr-gray-200 p-8 text-center">
        <p className="text-acr-gray-500">{t("common.error.generic")}</p>
      </div>
    );
  }

  return (
    <div>
      <AcrTable
        data={parts}
        columns={columns}
        isLoading={isLoading}
        loadingRows={10}
        onRowClick={handleRowClick}
        emptyMessage={
          <div className="text-center py-8">
            <p className="text-acr-gray-500">
              {t("admin.bulkUpload.noPartsFound")}
            </p>
          </div>
        }
        className="bg-white rounded-lg border border-acr-gray-200 overflow-hidden shadow-sm"
      />

      {/* Pagination */}
      {!isLoading && !isError && totalCount > 0 && (
        <AcrPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={totalCount}
          limit={limit}
          onPageChange={onPageChange}
          paginationTextKey="admin.bulkUpload.showingParts"
        />
      )}
    </div>
  );
}

// Helper component for image count status
function ImageCountBadge({ count, max }: { count: number; max: number }) {
  const hasImages = count > 0;

  if (hasImages) {
    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="acr-body-small text-acr-gray-600 hidden sm:inline">
          {count}/{max}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <XCircle className="h-5 w-5 text-acr-gray-300" />
    </div>
  );
}

// Helper component for 360° viewer status
function ViewerStatusBadge({
  has360,
  frameCount,
}: {
  has360: boolean | null;
  frameCount: number | null;
}) {
  if (has360) {
    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="acr-body-small text-acr-gray-600 hidden sm:inline">
          {frameCount || 0} frames
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <XCircle className="h-5 w-5 text-acr-gray-300" />
    </div>
  );
}
