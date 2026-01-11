"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  LucideIcon,
  Upload,
  Plus,
  ImagePlus,
  Settings,
  ChevronDown,
} from "lucide-react";
import { AcrCard } from "@/components/acr";
import { useLocale } from "@/contexts/LocaleContext";
import { getStaggerClass } from "@/lib/animations";
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Mobile: Collapsible section */}
      <div className="lg:hidden space-y-3">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-lg border border-acr-gray-200 bg-white hover:bg-acr-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2"
        >
          <div className="text-left">
            <h2 className="text-base font-semibold text-acr-gray-900">
              {t("admin.dashboard.quickActions")}
            </h2>
            <p className="text-xs text-acr-gray-600">
              {t("admin.dashboard.quickActionsDescription")}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-acr-gray-600 transition-transform duration-200 shrink-0 ml-2",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.id}
                  href={action.href as Route}
                  className="block group"
                >
                  <AcrCard
                    className={cn(
                      "h-full cursor-pointer",
                      "transition-all duration-300",
                      "hover:border-acr-red-300 hover:shadow-lg",
                      "hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)]",
                      "active:scale-[0.98]",
                      "focus-within:outline-none focus-within:ring-2 focus-within:ring-acr-red-500 focus-within:ring-offset-2"
                    )}
                    padding="default"
                  >
                    <div className="flex flex-col items-start space-y-2.5">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          "transition-colors duration-300",
                          action.variant === "primary"
                            ? "bg-acr-red-100 text-acr-red-600 group-hover:bg-acr-red-600 group-hover:text-white"
                            : "bg-acr-gray-100 text-acr-gray-700 group-hover:bg-acr-red-100 group-hover:text-acr-red-600"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-acr-gray-900 group-hover:text-acr-red-600 transition-colors leading-tight">
                          {t(action.title as any)}
                        </h3>
                        <p className="text-xs text-acr-gray-600 leading-snug">
                          {t(action.description as any)}
                        </p>
                      </div>
                    </div>
                  </AcrCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden lg:block space-y-3">
        {/* Section Header */}
        <div>
          <h2 className="text-lg font-semibold text-acr-gray-900">
            {t("admin.dashboard.quickActions")}
          </h2>
          <p className="text-sm text-acr-gray-600">
            {t("admin.dashboard.quickActionsDescription")}
          </p>
        </div>

        {/* Action Cards Grid - 4 cols on desktop */}
        <div className="grid grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.id}
                href={action.href as Route}
                className={cn(
                  "block group",
                  "acr-animate-fade-up",
                  getStaggerClass(index)
                )}
              >
                <AcrCard
                  className={cn(
                    "h-full cursor-pointer",
                    "transition-all duration-300",
                    "hover:border-acr-red-300 hover:shadow-lg",
                    "hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)]",
                    "active:scale-[0.98]",
                    "focus-within:outline-none focus-within:ring-2 focus-within:ring-acr-red-500 focus-within:ring-offset-2"
                  )}
                  padding="default"
                >
                  <div className="flex flex-col items-start space-y-3">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl",
                        "transition-colors duration-300",
                        action.variant === "primary"
                          ? "bg-acr-red-100 text-acr-red-600 group-hover:bg-acr-red-600 group-hover:text-white"
                          : "bg-acr-gray-100 text-acr-gray-700 group-hover:bg-acr-red-100 group-hover:text-acr-red-600"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-acr-gray-900 group-hover:text-acr-red-600 transition-colors leading-tight">
                        {t(action.title as any)}
                      </h3>
                      <p className="text-xs text-acr-gray-600 leading-relaxed">
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
    </>
  );
}
