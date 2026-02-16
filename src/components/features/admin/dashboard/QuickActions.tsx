"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  LucideIcon,
  Upload,
  Download,
  ImagePlus,
  RotateCw,
  Users,
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
  isDownload?: boolean; // render as <a> instead of Next.js Link (for API downloads)
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
    id: "export",
    title: "admin.quickActions.export",
    description: "admin.quickActions.exportDescription",
    icon: Download,
    href: "/api/admin/export",
    variant: "secondary",
    isDownload: true,
  },
  {
    id: "uploadImages",
    title: "admin.quickActions.uploadImages",
    description: "admin.quickActions.uploadImagesDescription",
    icon: ImagePlus,
    href: "/admin/upload-images",
    variant: "secondary",
  },
  {
    id: "360viewer",
    title: "admin.quickActions.360viewer",
    description: "admin.quickActions.360viewerDescription",
    icon: RotateCw,
    href: "/data-portal/360-viewer",
    variant: "secondary",
  },
  {
    id: "users",
    title: "admin.quickActions.users",
    description: "admin.quickActions.usersDescription",
    icon: Users,
    href: "/admin/users",
    variant: "secondary",
  },
];

export function QuickActions() {
  const { t, locale } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  // Resolve action href dynamically (export needs locale param)
  const getActionHref = (action: QuickAction) => {
    if (action.id === "export") {
      return `${action.href}?locale=${locale}`;
    }
    return action.href;
  };

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
              const href = getActionHref(action);
              const Wrapper = action.isDownload ? "a" : Link;
              const wrapperProps = action.isDownload
                ? { href }
                : { href: href as Route };

              return (
                <Wrapper
                  key={action.id}
                  {...wrapperProps}
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
                </Wrapper>
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

        {/* Action Cards Grid - 5 cols on desktop */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon;
            const href = getActionHref(action);
            const Wrapper = action.isDownload ? "a" : Link;
            const wrapperProps = action.isDownload
              ? { href }
              : { href: href as Route };

            return (
              <Wrapper
                key={action.id}
                {...wrapperProps}
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
              </Wrapper>
            );
          })}
        </div>
      </div>
    </>
  );
}
