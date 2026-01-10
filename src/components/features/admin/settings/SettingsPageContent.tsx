"use client";

import { Settings } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  AcrTabs,
  AcrTabsList,
  AcrTabsTrigger,
  AcrTabsContent,
} from "@/components/acr";
import { ContactInfoSettings } from "./ContactInfoSettings";
import { BrandingSettings } from "./BrandingSettings";
import { ImportHistorySettings } from "./ImportHistorySettings";

export function SettingsPageContent() {
  const { t } = useLocale();

  return (
    <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
      <div className="mb-8">
        {/* Header with title */}
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-7 h-7 md:w-8 md:h-8 text-acr-red-600" />
          <h1 className="acr-heading-3 text-acr-gray-900">
            {t("admin.settings.title")}
          </h1>
        </div>
      </div>

      {/* Tabbed Interface */}
      <AcrTabs defaultValue="contact">
        <AcrTabsList>
          <AcrTabsTrigger value="contact">
            {t("admin.settings.tabs.contact")}
          </AcrTabsTrigger>
          <AcrTabsTrigger value="branding">
            {t("admin.settings.tabs.branding")}
          </AcrTabsTrigger>
          <AcrTabsTrigger value="history">
            {t("admin.settings.tabs.history")}
          </AcrTabsTrigger>
        </AcrTabsList>

        <AcrTabsContent value="contact">
          <ContactInfoSettings />
        </AcrTabsContent>

        <AcrTabsContent value="branding">
          <BrandingSettings />
        </AcrTabsContent>

        <AcrTabsContent value="history">
          <ImportHistorySettings />
        </AcrTabsContent>
      </AcrTabs>
    </main>
  );
}
