"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

interface FilterBadgeProps {
  count: number;
  className?: string;
}

export function FilterBadge({ count, className }: FilterBadgeProps) {
  const { t } = useLocale();

  if (count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "ml-2 px-2 py-0.5",
        "text-xs font-semibold",
        "bg-acr-red-100 text-acr-red-700",
        "rounded-full",
        "transition-all duration-200",
        className
      )}
    >
      {t("admin.filters.active").replace("{{count}}", count.toString())}
    </span>
  );
}
