"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { PlusCircle, Edit, Trash2, AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
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
  const hasPartChanges = diffResult.parts.summary.totalAdds + diffResult.parts.summary.totalUpdates + diffResult.parts.summary.totalDeletes > 0;
  const systemUpdateCount = diffResult.vehicleApplications.summary.totalUpdates + diffResult.crossReferences.summary.totalUpdates;

  // Group cascade delete warnings by part
  const cascadeWarnings = validationWarnings.filter(w =>
    w.code === 'W6_VEHICLE_APPLICATION_DELETED' || w.code === 'W5_CROSS_REFERENCE_DELETED'
  );

  const hasCascadeWarnings = cascadeWarnings.length > 0;

  return (
    <div className="space-y-6">
      {/* Compact Summary Bar */}
      <AcrCard variant="outlined" className="border-acr-gray-300">
        <div className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-acr-gray-900">{diffResult.parts.summary.totalAdds}</span>
              <span className="text-acr-gray-600">{t("admin.import.preview.new")}</span>
            </div>
            <div className="w-px h-6 bg-acr-gray-300" />
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-acr-gray-900">{diffResult.parts.summary.totalUpdates}</span>
              <span className="text-acr-gray-600">{t("admin.import.preview.updated").toLowerCase()}</span>
            </div>
            <div className="w-px h-6 bg-acr-gray-300" />
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-acr-gray-900">{diffResult.parts.summary.totalDeletes}</span>
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

      {/* Part Changes Section */}
      {hasPartChanges && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-acr-gray-900">
            {t("admin.import.preview.partChanges")}
          </h3>

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
                      <span className="font-medium">{warning.sheet} Row {warning.row}:</span> {warning.message}
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
                    Added: <span className="font-medium text-green-700">&quot;{change.after}&quot;</span>
                  </div>
                )}
                {!wasEmpty && isNowEmpty && (
                  <div className="text-acr-gray-700">
                    Removed: <span className="font-medium text-red-700 line-through">&quot;{change.before}&quot;</span>
                  </div>
                )}
                {!wasEmpty && !isNowEmpty && (
                  <div className="space-y-0.5">
                    <div className="text-acr-gray-600">
                      Was: <span className="font-medium">&quot;{change.before}&quot;</span>
                    </div>
                    <div className="text-acr-gray-600">
                      Now: <span className="font-medium">&quot;{change.after}&quot;</span>
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
