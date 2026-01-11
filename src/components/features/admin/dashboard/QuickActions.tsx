"use client";

import Link from "next/link";
import type { Route } from "next";
import { LucideIcon, Upload, Plus, ImagePlus, Settings } from "lucide-react";
import { AcrCard } from "@/components/acr";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string; // translation key
  description: string; // translation key
  icon: LucideIcon;
  href: string;
  variant: "primary" | "secondary";
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "import",
    title: "admin.quickActions.import",
    description: "admin.quickActions.importDescription",
    icon: Upload,
    href: "/admin/import",
    variant: "primary",
  },
  {
    id: "addPart",
    title: "admin.quickActions.addPart",
    description: "admin.quickActions.addPartDescription",
    icon: Plus,
    href: "/admin/parts/add-new-part",
    variant: "secondary",
  },
  {
    id: "manageImages",
    title: "admin.quickActions.manageImages",
    description: "admin.quickActions.manageImagesDescription",
    icon: ImagePlus,
    href: "/admin/bulk-image-upload",
    variant: "secondary",
  },
  {
    id: "settings",
    title: "admin.quickActions.settings",
    description: "admin.quickActions.settingsDescription",
    icon: Settings,
    href: "/admin/settings",
    variant: "secondary",
  },
];

export function QuickActions() {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-acr-gray-900">
          {t("admin.dashboard.quickActions")}
        </h2>
        <p className="text-sm text-acr-gray-600">
          {t("admin.dashboard.quickActionsDescription")}
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          const staggerClass = `acr-stagger-${index + 1}`;

          return (
            <Link
              key={action.id}
              href={action.href as Route}
              className={cn("block group", "acr-animate-fade-up", staggerClass)}
            >
              <AcrCard
                className={cn(
                  "h-full p-6 cursor-pointer",
                  "acr-admin-card-hover",
                  "transition-all duration-300",
                  action.variant === "primary" && "acr-pulse-ready"
                )}
              >
                <div className="flex flex-col items-start space-y-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      "transition-colors duration-300",
                      action.variant === "primary"
                        ? "bg-acr-red-100 text-acr-red-600 group-hover:bg-acr-red-600 group-hover:text-white"
                        : "bg-acr-gray-100 text-acr-gray-700 group-hover:bg-acr-red-100 group-hover:text-acr-red-600"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-acr-gray-900 group-hover:text-acr-red-600 transition-colors">
                      {t(action.title as any)}
                    </h3>
                    <p className="text-sm text-acr-gray-600 leading-relaxed">
                      {t(action.description as any)}
                    </p>
                  </div>
                </div>
              </AcrCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
