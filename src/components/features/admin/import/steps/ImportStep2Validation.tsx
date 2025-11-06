"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ValidationIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  sheet?: string;
  row?: number;
  column?: string;
  value?: any;
  expected?: any;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsBySheet: Record<string, number>;
    warningsBySheet: Record<string, number>;
  };
}

interface ImportStep2ValidationProps {
  validationResult: ValidationResult | null;
  isValidating?: boolean;
  onAcknowledgeWarnings?: (acknowledged: boolean) => void;
  warningsAcknowledged?: boolean;
}

export function ImportStep2Validation({
  validationResult,
  isValidating = false,
  onAcknowledgeWarnings,
  warningsAcknowledged = false,
}: ImportStep2ValidationProps) {
  const { t } = useLocale();
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({});

  const toggleSheet = (sheet: string) => {
    setExpandedSheets((prev) => ({
      ...prev,
      [sheet]: !prev[sheet],
    }));
  };

  const groupIssuesBySheet = (issues: ValidationIssue[]) => {
    const grouped: Record<string, ValidationIssue[]> = {};
    issues.forEach((issue) => {
      const sheet = issue.sheet || "General";
      if (!grouped[sheet]) {
        grouped[sheet] = [];
      }
      grouped[sheet].push(issue);
    });
    return grouped;
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-acr-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-acr-gray-900">
          {t("admin.import.validation.validating")}
        </p>
        <p className="text-sm text-acr-gray-600 mt-2">
          {t("admin.import.confirm.pleaseWait")}
        </p>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const groupedErrors = groupIssuesBySheet(validationResult.errors);
  const groupedWarnings = groupIssuesBySheet(validationResult.warnings);

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      {!hasErrors && !hasWarnings && (
        <AcrCard variant="default" className="border-green-500 bg-green-50">
          <div className="flex items-center gap-3 p-6">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                {t("admin.import.validation.success")}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {t("admin.import.validation.successDesc")}
              </p>
            </div>
          </div>
        </AcrCard>
      )}

      {/* Errors Section */}
      {hasErrors && (
        <div className="space-y-4">
          <AcrCard variant="outlined" className="border-red-500 bg-red-50">
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900">
                  {t("admin.import.validation.failed")}: {validationResult.summary.totalErrors}{" "}
                  {t("admin.import.validation.errorsFound")}
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {t("admin.import.validation.fix")}
                </p>
              </div>
            </div>
          </AcrCard>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-acr-gray-900 uppercase tracking-wide">
              {t("admin.import.validation.errorsBySheet")}
            </h4>

            {Object.entries(groupedErrors).map(([sheet, issues]) => (
              <AcrCard key={sheet} variant="outlined" className="border-red-300">
                <div className="p-4">
                  <button
                    onClick={() => toggleSheet(`error-${sheet}`)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSheets[`error-${sheet}`] ? (
                        <ChevronDown className="w-4 h-4 text-acr-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-acr-gray-600" />
                      )}
                      <h5 className="font-semibold text-red-900">
                        {sheet}
                      </h5>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        {issues.length} {issues.length === 1 ? t("admin.import.validation.error") : t("admin.import.validation.errors")}
                      </span>
                    </div>
                  </button>

                  {expandedSheets[`error-${sheet}`] && (
                    <div className="mt-4 space-y-3">
                      {issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded border border-red-200"
                        >
                          <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-mono rounded">
                              {issue.code}
                            </span>
                            <div className="flex-1 text-sm">
                              <p className="font-medium text-red-900">
                                {issue.row && `Row ${issue.row}`}
                                {issue.row && issue.column && ", "}
                                {issue.column && `Column: ${issue.column}`}
                              </p>
                              <p className="text-red-800 mt-1">{issue.message}</p>
                              {issue.value !== undefined && (
                                <p className="text-xs text-red-700 mt-1">
                                  Value: <code className="bg-red-100 px-1 rounded">{String(issue.value)}</code>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AcrCard>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <div className="space-y-4">
          <AcrCard variant="outlined" className="border-amber-500 bg-amber-50">
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900">
                  {validationResult.summary.totalWarnings}{" "}
                  {t("admin.import.validation.warningsFound")}
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  {t("admin.import.validation.reviewWarnings")}
                </p>
              </div>
            </div>
          </AcrCard>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-acr-gray-900 uppercase tracking-wide">
              {t("admin.import.validation.warningsBySheet")}
            </h4>

            {Object.entries(groupedWarnings).map(([sheet, issues]) => (
              <AcrCard key={sheet} variant="outlined" className="border-amber-300">
                <div className="p-4">
                  <button
                    onClick={() => toggleSheet(`warning-${sheet}`)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSheets[`warning-${sheet}`] ? (
                        <ChevronDown className="w-4 h-4 text-acr-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-acr-gray-600" />
                      )}
                      <h5 className="font-semibold text-amber-900">
                        {sheet}
                      </h5>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                        {issues.length} {issues.length === 1 ? t("admin.import.validation.warning") : t("admin.import.validation.warnings")}
                      </span>
                    </div>
                  </button>

                  {expandedSheets[`warning-${sheet}`] && (
                    <div className="mt-4 space-y-3">
                      {issues.slice(0, 10).map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded border border-amber-200"
                        >
                          <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 bg-amber-600 text-white text-xs font-mono rounded">
                              {issue.code}
                            </span>
                            <div className="flex-1 text-sm">
                              <p className="font-medium text-amber-900">
                                {issue.row && `Row ${issue.row}`}
                                {issue.row && issue.column && ", "}
                                {issue.column && `Column: ${issue.column}`}
                              </p>
                              <p className="text-amber-800 mt-1">{issue.message}</p>
                              {issue.expected !== undefined && issue.value !== undefined && (
                                <div className="text-xs text-amber-700 mt-2">
                                  <p>Before: <code className="bg-amber-100 px-1 rounded">{String(issue.expected)}</code></p>
                                  <p className="mt-1">After: <code className="bg-amber-100 px-1 rounded">{String(issue.value)}</code></p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {issues.length > 10 && (
                        <p className="text-xs text-amber-700 text-center py-2">
                          ... and {issues.length - 10} more warnings
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AcrCard>
            ))}
          </div>

          {/* Warning Acknowledgment */}
          <AcrCard variant="outlined" className="border-amber-300 bg-amber-50">
            <div className="p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={warningsAcknowledged}
                  onCheckedChange={(checked) => onAcknowledgeWarnings?.(checked === true)}
                  className="mt-1"
                />
                <span className="text-sm text-amber-900 flex-1">
                  {t("admin.import.validation.acknowledge")}
                </span>
              </label>
            </div>
          </AcrCard>
        </div>
      )}
    </div>
  );
}
