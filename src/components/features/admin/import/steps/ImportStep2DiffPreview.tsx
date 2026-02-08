"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { PlusCircle, Edit, Trash2, AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { AcrTabs, AcrTabsList, AcrTabsTrigger, AcrTabsContent } from "@/components/acr/Tabs";
import { cn } from "@/lib/utils";

interface DiffItem<T = any> {
  operation: "add" | "update" | "delete" | "unchanged";
  row?: T;
  before?: T;
  after?: T;
  changes?: string[];
}

interface SheetDiff<T = any> {
  sheetName: string;
  adds: DiffItem<T>[];
  updates: DiffItem<T>[];
  deletes: DiffItem<T>[];
  unchanged: DiffItem<T>[];
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
  };
}

interface DiffResult {
  parts: SheetDiff;
  vehicleApplications: SheetDiff;
  crossReferences: SheetDiff;
  aliases?: SheetDiff;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
    totalChanges: number;
    changesBySheet: {
      parts: number;
      vehicleApplications: number;
      crossReferences: number;
    };
  };
}

interface ValidationWarning {
  code: string;
  severity: "error" | "warning";
  message: string;
  sheet?: string;
  row?: number;
  column?: string;
  value?: any;
  expected?: any;
}

interface ImportStep3PreviewProps {
  diffResult: DiffResult | null;
  isGeneratingDiff?: boolean;
  validationWarnings?: ValidationWarning[];
  onAcknowledgeWarnings?: (acknowledged: boolean) => void;
  warningsAcknowledged?: boolean;
}

const ITEMS_PER_PAGE = 20;

export function ImportStep2DiffPreview({
  diffResult,
  isGeneratingDiff = false,
  validationWarnings = [],
  onAcknowledgeWarnings,
  warningsAcknowledged = false,
}: ImportStep3PreviewProps) {
  const { t } = useLocale();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showSystemUpdates, setShowSystemUpdates] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    adds: ITEMS_PER_PAGE,
    updates: ITEMS_PER_PAGE,
    deletes: ITEMS_PER_PAGE,
    vaAdds: ITEMS_PER_PAGE,
    vaUpdates: ITEMS_PER_PAGE,
    vaDeletes: ITEMS_PER_PAGE,
    crAdds: ITEMS_PER_PAGE,
    crDeletes: ITEMS_PER_PAGE,
    aliasAdds: ITEMS_PER_PAGE,
    aliasUpdates: ITEMS_PER_PAGE,
    aliasDeletes: ITEMS_PER_PAGE,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const loadMore = (section: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [section]: prev[section] + ITEMS_PER_PAGE,
    }));
  };

  const showAll = (section: string, total: number) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [section]: total,
    }));
  };

  if (isGeneratingDiff) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-acr-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-acr-gray-900">
          {t("admin.import.preview.calculating")}
        </p>
        <p className="text-sm text-acr-gray-600 mt-2">
          {t("admin.import.confirm.pleaseWait")}
        </p>
      </div>
    );
  }

  if (!diffResult) {
    return null;
  }

  const hasDeletes = diffResult.summary.totalDeletes > 0;
  const systemUpdateCount = diffResult.vehicleApplications.summary.totalUpdates + diffResult.crossReferences.summary.totalUpdates;

  // Change counts per entity type
  const partChangeCount = diffResult.parts.summary.totalAdds + diffResult.parts.summary.totalUpdates + diffResult.parts.summary.totalDeletes;
  const vaChangeCount = diffResult.vehicleApplications.summary.totalAdds + diffResult.vehicleApplications.summary.totalUpdates + diffResult.vehicleApplications.summary.totalDeletes;
  const crChangeCount = (diffResult.crossReferences.adds?.length || 0) + (diffResult.crossReferences.deletes?.length || 0);
  const hasAliases = diffResult.aliases && (diffResult.aliases.summary?.totalAdds > 0 || diffResult.aliases.summary?.totalUpdates > 0 || diffResult.aliases.summary?.totalDeletes > 0);
  const aliasChangeCount = hasAliases ? diffResult.aliases!.summary.totalAdds + diffResult.aliases!.summary.totalUpdates + diffResult.aliases!.summary.totalDeletes : 0;

  // Group cascade delete warnings by part
  const cascadeWarnings = validationWarnings.filter(w =>
    w.code === 'W6_VEHICLE_APPLICATION_DELETED' || w.code === 'W5_CROSS_REFERENCE_DELETED'
  );

  const hasCascadeWarnings = cascadeWarnings.length > 0;

  return (
    <div className="space-y-6">
      {/* Mobile Summary Bar (2x2 grid) */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <PlusCircle className="w-4 h-4 text-green-600" />
          <span className="text-lg font-bold text-green-700">{diffResult.summary.totalAdds}</span>
          <span className="text-xs text-green-600">{t("admin.import.preview.new")}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Edit className="w-4 h-4 text-blue-600" />
          <span className="text-lg font-bold text-blue-700">{diffResult.summary.totalUpdates}</span>
          <span className="text-xs text-blue-600">{t("admin.import.preview.updated")}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <Trash2 className="w-4 h-4 text-red-600" />
          <span className="text-lg font-bold text-red-700">{diffResult.summary.totalDeletes}</span>
          <span className="text-xs text-red-600">{t("admin.import.preview.deleted")}</span>
        </div>
        {systemUpdateCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-acr-gray-50 rounded-lg border border-acr-gray-200">
            <Info className="w-4 h-4 text-acr-gray-500" />
            <span className="text-lg font-bold text-acr-gray-700">{systemUpdateCount}</span>
            <span className="text-xs text-acr-gray-500">{t("admin.import.preview.systemUpdates")}</span>
          </div>
        )}
      </div>

      {/* Desktop Summary Bar (horizontal flex) */}
      <div className="hidden sm:block">
        <AcrCard variant="outlined" className="border-acr-gray-300">
          <div className="p-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-acr-gray-900">{diffResult.summary.totalAdds}</span>
                <span className="text-acr-gray-600">{t("admin.import.preview.new")}</span>
              </div>
              <div className="w-px h-6 bg-acr-gray-300" />
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-acr-gray-900">{diffResult.summary.totalUpdates}</span>
                <span className="text-acr-gray-600">{t("admin.import.preview.updated").toLowerCase()}</span>
              </div>
              <div className="w-px h-6 bg-acr-gray-300" />
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-acr-gray-900">{diffResult.summary.totalDeletes}</span>
                <span className="text-acr-gray-600">{t("admin.import.preview.deleted").toLowerCase()}</span>
              </div>
              {systemUpdateCount > 0 && (
                <>
                  <div className="w-px h-6 bg-acr-gray-300" />
                  <div className="flex items-center gap-2 text-acr-gray-500">
                    <Info className="w-4 h-4" />
                    <span className="font-semibold">{systemUpdateCount}</span>
                    <span>{t("admin.import.preview.systemUpdates")}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </AcrCard>
      </div>

      {/* Entity Change Tabs */}
      <AcrTabs defaultValue="parts">
        <AcrTabsList>
          <AcrTabsTrigger value="parts">
            {t("admin.import.preview.partChanges")} ({partChangeCount})
          </AcrTabsTrigger>
          <AcrTabsTrigger value="vehicleApps">
            {t("admin.import.preview.vehicleAppChanges")} ({vaChangeCount})
          </AcrTabsTrigger>
          <AcrTabsTrigger value="crossRefs">
            {t("admin.import.preview.crossRefChanges")} ({crChangeCount})
          </AcrTabsTrigger>
          {hasAliases && (
            <AcrTabsTrigger value="aliases">
              {t("admin.import.preview.aliasChanges")} ({aliasChangeCount})
            </AcrTabsTrigger>
          )}
        </AcrTabsList>

        {/* Parts Tab */}
        <AcrTabsContent value="parts">
          {partChangeCount === 0 ? (
            <p className="text-center text-acr-gray-500 py-8">{t("admin.import.preview.noChanges")}</p>
          ) : (
            <div className="space-y-4">
              {/* New Parts */}
              {diffResult.parts.summary.totalAdds > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.newParts")}
                  count={diffResult.parts.summary.totalAdds}
                  icon={<PlusCircle className="w-5 h-5 text-green-600" />}
                  colorClass="border-green-300 bg-green-50"
                  isExpanded={expandedSections.adds}
                  onToggle={() => toggleSection('adds')}
                >
                  <div className="space-y-3">
                    {diffResult.parts.adds.slice(0, visibleCounts.adds).map((item, idx) => (
                      <PartAddItem key={idx} item={item} />
                    ))}
                    {diffResult.parts.adds.length > visibleCounts.adds && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('adds')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('adds', diffResult.parts.adds.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.parts.adds.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}

              {/* Updated Parts */}
              {diffResult.parts.summary.totalUpdates > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.updatedParts")}
                  count={diffResult.parts.summary.totalUpdates}
                  icon={<Edit className="w-5 h-5 text-blue-600" />}
                  colorClass="border-blue-300 bg-blue-50"
                  isExpanded={expandedSections.updates}
                  onToggle={() => toggleSection('updates')}
                >
                  <div className="space-y-3">
                    {diffResult.parts.updates.slice(0, visibleCounts.updates).map((item, idx) => (
                      <PartUpdateItem key={idx} item={item} />
                    ))}
                    {diffResult.parts.updates.length > visibleCounts.updates && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('updates')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('updates', diffResult.parts.updates.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.parts.updates.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}

              {/* Deleted Parts */}
              {diffResult.parts.summary.totalDeletes > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.deletedParts")}
                  count={diffResult.parts.summary.totalDeletes}
                  icon={<Trash2 className="w-5 h-5 text-red-600" />}
                  colorClass="border-red-300 bg-red-50"
                  isExpanded={expandedSections.deletes}
                  onToggle={() => toggleSection('deletes')}
                >
                  <div className="space-y-3">
                    {diffResult.parts.deletes.slice(0, visibleCounts.deletes).map((item, idx) => (
                      <PartDeleteItem
                        key={idx}
                        item={item}
                        cascadeWarnings={cascadeWarnings}
                      />
                    ))}
                    {diffResult.parts.deletes.length > visibleCounts.deletes && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('deletes')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('deletes', diffResult.parts.deletes.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.parts.deletes.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}
            </div>
          )}
        </AcrTabsContent>

        {/* Vehicle Applications Tab */}
        <AcrTabsContent value="vehicleApps">
          {vaChangeCount === 0 ? (
            <p className="text-center text-acr-gray-500 py-8">{t("admin.import.preview.noChanges")}</p>
          ) : (
            <div className="space-y-4">
              {/* New Vehicle Apps */}
              {diffResult.vehicleApplications.summary.totalAdds > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.newVehicleApps")}
                  count={diffResult.vehicleApplications.summary.totalAdds}
                  icon={<PlusCircle className="w-5 h-5 text-green-600" />}
                  colorClass="border-green-300 bg-green-50"
                  isExpanded={expandedSections.vaAdds}
                  onToggle={() => toggleSection('vaAdds')}
                >
                  <div className="space-y-3">
                    {diffResult.vehicleApplications.adds.slice(0, visibleCounts.vaAdds).map((item, idx) => (
                      <VehicleAppItem key={idx} item={item} operation="add" />
                    ))}
                    {diffResult.vehicleApplications.adds.length > visibleCounts.vaAdds && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('vaAdds')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('vaAdds', diffResult.vehicleApplications.adds.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.vehicleApplications.adds.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}

              {/* Updated Vehicle Apps */}
              {diffResult.vehicleApplications.summary.totalUpdates > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.updatedVehicleApps")}
                  count={diffResult.vehicleApplications.summary.totalUpdates}
                  icon={<Edit className="w-5 h-5 text-blue-600" />}
                  colorClass="border-blue-300 bg-blue-50"
                  isExpanded={expandedSections.vaUpdates}
                  onToggle={() => toggleSection('vaUpdates')}
                >
                  <div className="space-y-3">
                    {diffResult.vehicleApplications.updates.slice(0, visibleCounts.vaUpdates).map((item, idx) => (
                      <VehicleAppItem key={idx} item={item} operation="update" />
                    ))}
                    {diffResult.vehicleApplications.updates.length > visibleCounts.vaUpdates && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('vaUpdates')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('vaUpdates', diffResult.vehicleApplications.updates.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.vehicleApplications.updates.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}

              {/* Deleted Vehicle Apps */}
              {diffResult.vehicleApplications.summary.totalDeletes > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.deletedVehicleApps")}
                  count={diffResult.vehicleApplications.summary.totalDeletes}
                  icon={<Trash2 className="w-5 h-5 text-red-600" />}
                  colorClass="border-red-300 bg-red-50"
                  isExpanded={expandedSections.vaDeletes}
                  onToggle={() => toggleSection('vaDeletes')}
                >
                  <div className="space-y-3">
                    {diffResult.vehicleApplications.deletes.slice(0, visibleCounts.vaDeletes).map((item, idx) => (
                      <VehicleAppItem key={idx} item={item} operation="delete" />
                    ))}
                    {diffResult.vehicleApplications.deletes.length > visibleCounts.vaDeletes && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('vaDeletes')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('vaDeletes', diffResult.vehicleApplications.deletes.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.vehicleApplications.deletes.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}
            </div>
          )}
        </AcrTabsContent>

        {/* Cross-References Tab */}
        <AcrTabsContent value="crossRefs">
          {crChangeCount === 0 ? (
            <p className="text-center text-acr-gray-500 py-8">{t("admin.import.preview.noChanges")}</p>
          ) : (
            <div className="space-y-4">
              {/* New Cross-Refs */}
              {(diffResult.crossReferences.adds?.length || 0) > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.newCrossRefs")}
                  count={diffResult.crossReferences.adds.length}
                  icon={<PlusCircle className="w-5 h-5 text-green-600" />}
                  colorClass="border-green-300 bg-green-50"
                  isExpanded={expandedSections.crAdds}
                  onToggle={() => toggleSection('crAdds')}
                >
                  <div className="space-y-3">
                    {diffResult.crossReferences.adds.slice(0, visibleCounts.crAdds).map((item, idx) => (
                      <CrossRefItem key={idx} item={item} operation="add" />
                    ))}
                    {diffResult.crossReferences.adds.length > visibleCounts.crAdds && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('crAdds')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('crAdds', diffResult.crossReferences.adds.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.crossReferences.adds.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}

              {/* Deleted Cross-Refs */}
              {(diffResult.crossReferences.deletes?.length || 0) > 0 && (
                <ChangeSection
                  title={t("admin.import.preview.deletedCrossRefs")}
                  count={diffResult.crossReferences.deletes.length}
                  icon={<Trash2 className="w-5 h-5 text-red-600" />}
                  colorClass="border-red-300 bg-red-50"
                  isExpanded={expandedSections.crDeletes}
                  onToggle={() => toggleSection('crDeletes')}
                >
                  <div className="space-y-3">
                    {diffResult.crossReferences.deletes.slice(0, visibleCounts.crDeletes).map((item, idx) => (
                      <CrossRefItem key={idx} item={item} operation="delete" />
                    ))}
                    {diffResult.crossReferences.deletes.length > visibleCounts.crDeletes && (
                      <div className="flex gap-2 pt-2">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          onClick={() => loadMore('crDeletes')}
                        >
                          {t("admin.import.preview.loadMore")}
                        </AcrButton>
                        <AcrButton
                          variant="ghost"
                          size="sm"
                          onClick={() => showAll('crDeletes', diffResult.crossReferences.deletes.length)}
                        >
                          {t("admin.import.preview.showAll").replace("{count}", diffResult.crossReferences.deletes.length.toString())}
                        </AcrButton>
                      </div>
                    )}
                  </div>
                </ChangeSection>
              )}
            </div>
          )}
        </AcrTabsContent>

        {/* Aliases Tab (conditional) */}
        {hasAliases && (
          <AcrTabsContent value="aliases">
            {aliasChangeCount === 0 ? (
              <p className="text-center text-acr-gray-500 py-8">{t("admin.import.preview.noChanges")}</p>
            ) : (
              <div className="space-y-4">
                {/* New Aliases */}
                {diffResult.aliases!.summary.totalAdds > 0 && (
                  <ChangeSection
                    title={`${t("admin.import.preview.new")} ${t("admin.import.preview.aliasChanges")}`}
                    count={diffResult.aliases!.summary.totalAdds}
                    icon={<PlusCircle className="w-5 h-5 text-green-600" />}
                    colorClass="border-green-300 bg-green-50"
                    isExpanded={expandedSections.aliasAdds}
                    onToggle={() => toggleSection('aliasAdds')}
                  >
                    <div className="space-y-3">
                      {diffResult.aliases!.adds.slice(0, visibleCounts.aliasAdds).map((item, idx) => (
                        <AliasItem key={idx} item={item} operation="add" />
                      ))}
                      {diffResult.aliases!.adds.length > visibleCounts.aliasAdds && (
                        <div className="flex gap-2 pt-2">
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => loadMore('aliasAdds')}
                          >
                            {t("admin.import.preview.loadMore")}
                          </AcrButton>
                          <AcrButton
                            variant="ghost"
                            size="sm"
                            onClick={() => showAll('aliasAdds', diffResult.aliases!.adds.length)}
                          >
                            {t("admin.import.preview.showAll").replace("{count}", diffResult.aliases!.adds.length.toString())}
                          </AcrButton>
                        </div>
                      )}
                    </div>
                  </ChangeSection>
                )}

                {/* Updated Aliases */}
                {diffResult.aliases!.summary.totalUpdates > 0 && (
                  <ChangeSection
                    title={`${t("admin.import.preview.updated")} ${t("admin.import.preview.aliasChanges")}`}
                    count={diffResult.aliases!.summary.totalUpdates}
                    icon={<Edit className="w-5 h-5 text-blue-600" />}
                    colorClass="border-blue-300 bg-blue-50"
                    isExpanded={expandedSections.aliasUpdates}
                    onToggle={() => toggleSection('aliasUpdates')}
                  >
                    <div className="space-y-3">
                      {diffResult.aliases!.updates.slice(0, visibleCounts.aliasUpdates).map((item, idx) => (
                        <AliasItem key={idx} item={item} operation="update" />
                      ))}
                      {diffResult.aliases!.updates.length > visibleCounts.aliasUpdates && (
                        <div className="flex gap-2 pt-2">
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => loadMore('aliasUpdates')}
                          >
                            {t("admin.import.preview.loadMore")}
                          </AcrButton>
                          <AcrButton
                            variant="ghost"
                            size="sm"
                            onClick={() => showAll('aliasUpdates', diffResult.aliases!.updates.length)}
                          >
                            {t("admin.import.preview.showAll").replace("{count}", diffResult.aliases!.updates.length.toString())}
                          </AcrButton>
                        </div>
                      )}
                    </div>
                  </ChangeSection>
                )}

                {/* Deleted Aliases */}
                {diffResult.aliases!.summary.totalDeletes > 0 && (
                  <ChangeSection
                    title={`${t("admin.import.preview.deleted")} ${t("admin.import.preview.aliasChanges")}`}
                    count={diffResult.aliases!.summary.totalDeletes}
                    icon={<Trash2 className="w-5 h-5 text-red-600" />}
                    colorClass="border-red-300 bg-red-50"
                    isExpanded={expandedSections.aliasDeletes}
                    onToggle={() => toggleSection('aliasDeletes')}
                  >
                    <div className="space-y-3">
                      {diffResult.aliases!.deletes.slice(0, visibleCounts.aliasDeletes).map((item, idx) => (
                        <AliasItem key={idx} item={item} operation="delete" />
                      ))}
                      {diffResult.aliases!.deletes.length > visibleCounts.aliasDeletes && (
                        <div className="flex gap-2 pt-2">
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => loadMore('aliasDeletes')}
                          >
                            {t("admin.import.preview.loadMore")}
                          </AcrButton>
                          <AcrButton
                            variant="ghost"
                            size="sm"
                            onClick={() => showAll('aliasDeletes', diffResult.aliases!.deletes.length)}
                          >
                            {t("admin.import.preview.showAll").replace("{count}", diffResult.aliases!.deletes.length.toString())}
                          </AcrButton>
                        </div>
                      )}
                    </div>
                  </ChangeSection>
                )}
              </div>
            )}
          </AcrTabsContent>
        )}
      </AcrTabs>

      {/* Cascade Delete Warning (After part changes, before system updates) */}
      {hasCascadeWarnings && hasDeletes && (
        <AcrCard variant="outlined" className="border-amber-500 bg-amber-50">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 mb-2">
                  {t("admin.import.preview.cascadeWarning")}
                </h4>
                <p className="text-sm text-amber-800 mb-3">
                  {t("admin.import.preview.cascadeDesc")
                    .replace("{count}", diffResult.parts.summary.totalDeletes.toString())
                    .replace("{type}", diffResult.parts.summary.totalDeletes === 1 ? 'part' : 'parts')
                    .replace("{relatedCount}", cascadeWarnings.length.toString())
                    .replace("{relatedType}", cascadeWarnings.length === 1 ? 'item' : 'items')}
                </p>
                {onAcknowledgeWarnings && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={warningsAcknowledged}
                      onChange={(e) => onAcknowledgeWarnings(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-acr-red-600 border-amber-400 rounded focus:ring-acr-red-500"
                    />
                    <span className="text-sm text-amber-900 font-medium">
                      {t("admin.import.preview.cascadeAck")}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </AcrCard>
      )}

      {/* General Warnings (non-cascade) */}
      {!hasCascadeWarnings && validationWarnings.length > 0 && onAcknowledgeWarnings && (
        <AcrCard variant="outlined" className="border-amber-500 bg-amber-50">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 mb-2">
                  {t("admin.import.preview.dataWarnings").replace("{count}", validationWarnings.length.toString())}
                </h4>
                <div className="space-y-2 mb-3">
                  {validationWarnings.map((warning, idx) => (
                    <div key={idx} className="text-sm text-amber-800 bg-amber-100 p-2 rounded">
                      <span className="font-medium">{warning.sheet} {t("admin.import.preview.row")} {warning.row}:</span> {warning.message}
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warningsAcknowledged}
                    onChange={(e) => onAcknowledgeWarnings(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-acr-red-600 border-amber-400 rounded focus:ring-acr-red-500"
                  />
                  <span className="text-sm text-amber-900 font-medium">
                    {t("admin.import.preview.dataWarningsAck")}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </AcrCard>
      )}

      {/* System Updates (Collapsible) */}
      {systemUpdateCount > 0 && (
        <AcrCard variant="outlined" className="border-acr-gray-300">
          <div className="p-4">
            <button
              onClick={() => setShowSystemUpdates(!showSystemUpdates)}
              className="flex items-center gap-2 w-full text-left text-sm text-acr-gray-600 hover:text-acr-gray-900"
            >
              {showSystemUpdates ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Info className="w-4 h-4" />
              <span>
                {t("admin.import.preview.systemUpdatesDesc").replace("{count}", systemUpdateCount.toString())}
              </span>
            </button>
            {showSystemUpdates && (
              <div className="mt-4 text-xs text-acr-gray-600 space-y-2">
                <p>• {t("admin.import.preview.vaMetadata").replace("{count}", diffResult.vehicleApplications.summary.totalUpdates.toString())}</p>
                <p>• {t("admin.import.preview.crMetadata").replace("{count}", diffResult.crossReferences.summary.totalUpdates.toString())}</p>
                <p className="italic pt-2">{t("admin.import.preview.routineMaintenance")}</p>
              </div>
            )}
          </div>
        </AcrCard>
      )}
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface ChangeSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ChangeSection({
  title,
  count,
  icon,
  colorClass,
  isExpanded,
  onToggle,
  children,
}: ChangeSectionProps) {
  return (
    <AcrCard variant="outlined" className={cn("border-2", colorClass)}>
      <div>
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full p-4 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-acr-gray-900">
              {title} ({count})
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-acr-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-acr-gray-600" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-current/10">
            <div className="pt-4">{children}</div>
          </div>
        )}
      </div>
    </AcrCard>
  );
}

function PartAddItem({ item }: { item: DiffItem }) {
  const part = item.row || item.after;
  if (!part) return null;

  const details = [
    part.part_type,
    part.position_type,
    part.abs_type,
    part.bolt_pattern,
    part.drive_type,
  ].filter(Boolean).join(' · ');

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded border border-green-200">
      <PlusCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-acr-gray-900">{part.acr_sku}</div>
        {details && (
          <div className="text-sm text-acr-gray-600 mt-0.5">{details}</div>
        )}
        {part.specifications && (
          <div className="text-xs text-acr-gray-500 mt-1 truncate">
            {part.specifications}
          </div>
        )}
      </div>
    </div>
  );
}

function PartUpdateItem({ item }: { item: DiffItem }) {
  const { t } = useLocale();
  const before = item.before;
  const after = item.after;
  if (!before || !after) return null;

  const details = [
    after.part_type,
    after.position_type,
    after.abs_type,
    after.bolt_pattern,
    after.drive_type,
  ].filter(Boolean).join(' · ');

  // Normalize values for comparison (treat null, undefined, empty string as equivalent)
  const normalizeValue = (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return String(value).trim();
  };

  // Only show fields that actually changed
  const changes: { field: string; before: any; after: any }[] = [];
  const fieldsToCheck = ['part_type', 'position_type', 'abs_type', 'bolt_pattern', 'drive_type', 'specifications'];

  fieldsToCheck.forEach(field => {
    const beforeValue = normalizeValue(before[field]);
    const afterValue = normalizeValue(after[field]);
    if (beforeValue !== afterValue) {
      changes.push({ field, before: beforeValue, after: afterValue });
    }
  });

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded border border-blue-200">
      <Edit className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-acr-gray-900">{after.acr_sku}</div>
        {details && (
          <div className="text-sm text-acr-gray-600 mt-0.5">{details}</div>
        )}
        <div className="mt-2 space-y-2">
          {changes.map((change, idx) => {
            const fieldName = change.field.replace(/_/g, ' ');
            const wasEmpty = change.before === null;
            const isNowEmpty = change.after === null;

            return (
              <div key={idx} className="text-xs bg-blue-50 p-2 rounded">
                <div className="font-medium text-acr-gray-900 capitalize mb-1">
                  {fieldName}:
                </div>
                {wasEmpty && !isNowEmpty && (
                  <div className="text-acr-gray-700">
                    {t("admin.import.preview.fieldAdded")} <span className="font-medium text-green-700">&quot;{change.after}&quot;</span>
                  </div>
                )}
                {!wasEmpty && isNowEmpty && (
                  <div className="text-acr-gray-700">
                    {t("admin.import.preview.fieldRemoved")} <span className="font-medium text-red-700 line-through">&quot;{change.before}&quot;</span>
                  </div>
                )}
                {!wasEmpty && !isNowEmpty && (
                  <div className="space-y-0.5">
                    <div className="text-acr-gray-600">
                      {t("admin.import.preview.fieldWas")} <span className="font-medium">&quot;{change.before}&quot;</span>
                    </div>
                    <div className="text-acr-gray-600">
                      {t("admin.import.preview.fieldNow")} <span className="font-medium">&quot;{change.after}&quot;</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PartDeleteItem({ item, cascadeWarnings = [] }: { item: DiffItem; cascadeWarnings?: ValidationWarning[] }) {
  const { t } = useLocale();
  const [showCascadeDetails, setShowCascadeDetails] = useState(false);
  const part = item.row || item.before;
  if (!part) return null;

  const details = [
    part.part_type,
    part.position_type,
    part.abs_type,
    part.bolt_pattern,
    part.drive_type,
  ].filter(Boolean).join(' · ');

  // Find cascade warnings related to this part (by SKU mentioned in message)
  const relatedWarnings = cascadeWarnings.filter(w =>
    w.message.toLowerCase().includes(part.acr_sku?.toLowerCase() || '')
  );

  const vehicleAppWarnings = relatedWarnings.filter(w => w.code === 'W6_VEHICLE_APPLICATION_DELETED');
  const crossRefWarnings = relatedWarnings.filter(w => w.code === 'W5_CROSS_REFERENCE_DELETED');

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded border border-red-200">
      <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-acr-gray-900">{part.acr_sku}</div>
        {details && (
          <div className="text-sm text-acr-gray-600 mt-0.5">{details}</div>
        )}

        {/* Show cascade summary if warnings exist */}
        {relatedWarnings.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCascadeDetails(!showCascadeDetails)}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
            >
              {showCascadeDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {t("admin.import.preview.willRemoveItems")
                .replace("{count}", vehicleAppWarnings.length.toString())
                .replace("{type}", vehicleAppWarnings.length === 1 ? 'application' : 'applications')}
              {crossRefWarnings.length > 0 && t("admin.import.preview.andCrossRefs")
                .replace("{count}", crossRefWarnings.length.toString())
                .replace("{type}", crossRefWarnings.length === 1 ? 'reference' : 'references')}
            </button>

            {showCascadeDetails && (
              <div className="mt-2 ml-4 space-y-1 text-xs text-acr-gray-600">
                {vehicleAppWarnings.map((w, idx) => (
                  <div key={`va-${idx}`} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{w.message.replace('Vehicle application deleted: ', '')}</span>
                  </div>
                ))}
                {crossRefWarnings.map((w, idx) => (
                  <div key={`cr-${idx}`} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{w.message.replace('Cross-reference deleted: ', '')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {relatedWarnings.length === 0 && (
          <div className="text-xs text-red-600 mt-1">
            {t("admin.import.preview.willRemove")}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleAppItem({ item, operation }: { item: DiffItem; operation: "add" | "update" | "delete" }) {
  const va = item.row || item.after || item.before;
  if (!va) return null;

  const icon = operation === "add" ? <PlusCircle className="w-4 h-4 text-green-600" /> :
               operation === "delete" ? <Trash2 className="w-4 h-4 text-red-600" /> :
               <Edit className="w-4 h-4 text-blue-600" />;
  const borderColor = operation === "add" ? "border-green-200" : operation === "delete" ? "border-red-200" : "border-blue-200";

  return (
    <div className={cn("flex items-start gap-3 p-3 bg-white rounded border", borderColor)}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="font-mono font-medium text-acr-gray-900 text-sm">{va.acr_sku}</div>
        <div className="text-sm text-acr-gray-600 mt-0.5">
          {va.make} {va.model} ({va.start_year}–{va.end_year})
        </div>
      </div>
    </div>
  );
}

function CrossRefItem({ item, operation }: { item: DiffItem; operation: "add" | "delete" }) {
  const icon = operation === "add" ? <PlusCircle className="w-4 h-4 text-green-600" /> :
               <Trash2 className="w-4 h-4 text-red-600" />;
  const borderColor = operation === "add" ? "border-green-200" : "border-red-200";

  // Cross-ref items may be wrapped in DiffItem or be flat objects
  const cr = item.row || item;

  return (
    <div className={cn("flex items-start gap-3 p-3 bg-white rounded border", borderColor)}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="font-mono font-medium text-acr-gray-900 text-sm">{cr.acr_sku || cr.ACR_SKU}</div>
        <div className="text-sm text-acr-gray-600 mt-0.5">
          {cr.brand || cr.Brand} → <span className="font-mono">{cr.brand_sku || cr.Brand_SKU}</span>
        </div>
      </div>
    </div>
  );
}

function AliasItem({ item, operation }: { item: DiffItem; operation: "add" | "update" | "delete" }) {
  const alias = item.row || item.after || item.before;
  if (!alias) return null;

  const icon = operation === "add" ? <PlusCircle className="w-4 h-4 text-green-600" /> :
               operation === "delete" ? <Trash2 className="w-4 h-4 text-red-600" /> :
               <Edit className="w-4 h-4 text-blue-600" />;
  const borderColor = operation === "add" ? "border-green-200" : operation === "delete" ? "border-red-200" : "border-blue-200";

  return (
    <div className={cn("flex items-start gap-3 p-3 bg-white rounded border", borderColor)}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-acr-gray-900">
          <span className="font-medium">{alias.alias}</span>
          <span className="text-acr-gray-400 mx-2">&rarr;</span>
          <span className="font-medium">{alias.canonical_name}</span>
        </div>
        {alias.alias_type && (
          <div className="text-xs text-acr-gray-500 mt-0.5">{alias.alias_type}</div>
        )}
      </div>
    </div>
  );
}
