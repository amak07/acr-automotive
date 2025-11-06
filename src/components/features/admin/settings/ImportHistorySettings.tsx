"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Clock, FileText, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { useToast } from "@/hooks/common/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";

interface ImportSnapshot {
  id: string;
  created_at: string;
  file_name: string;
  rows_imported: number;
  import_summary: {
    adds: number;
    updates: number;
    deletes: number;
  };
  imported_by?: string;
}

export function ImportHistorySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [snapshots, setSnapshots] = useState<ImportSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);

  // Fetch snapshots on mount
  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/import/rollback");
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error) {
      console.error("Failed to fetch snapshots:", error);
      toast({
        title: "Error",
        description: "Failed to load import history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (importId: string) => {
    setIsRollingBack(importId);
    setConfirmRollback(null);

    try {
      const response = await fetch("/api/admin/import/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle specific error types
        if (result.error === "SequentialRollbackError") {
          toast({
            title: "Sequential Rollback Required",
            description: "You must rollback the newest import first. Please rollback more recent imports before this one.",
            variant: "destructive",
          });
        } else if (result.error === "RollbackConflictError") {
          toast({
            title: "Rollback Conflict Detected",
            description: `Cannot rollback: ${result.conflictCount} part(s) were manually edited after this import. Rollback would cause data loss.`,
            variant: "destructive",
          });
        } else {
          throw new Error(result.message || result.error || "Rollback failed");
        }
        return;
      }

      toast({
        title: "Rollback Successful",
        description: `Restored ${result.restoredCounts.parts} parts, ${result.restoredCounts.vehicleApplications} vehicle applications, and ${result.restoredCounts.crossReferences} cross-references`,
        className: "bg-green-50 border-green-200",
      });

      // Invalidate parts cache so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });

      // Refresh the list
      await fetchSnapshots();
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: error instanceof Error ? error.message : "Failed to rollback import",
        variant: "destructive",
      });
    } finally {
      setIsRollingBack(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (isLoading) {
    return (
      <AcrCard variant="default" padding="default">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-acr-red-600 animate-spin" />
        </div>
      </AcrCard>
    );
  }

  if (snapshots.length === 0) {
    return (
      <AcrCard variant="default" padding="default">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-acr-gray-400 mx-auto mb-3" />
          <p className="text-acr-gray-600">No import history available</p>
          <p className="text-sm text-acr-gray-500 mt-2">
            Import history snapshots will appear here after you complete imports
          </p>
        </div>
      </AcrCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <AcrCard variant="outlined" className="border-blue-300 bg-blue-50">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-blue-900">
            <p className="font-medium mb-1">Sequential Rollback Required</p>
            <p className="text-blue-800">
              You must rollback imports in reverse order (newest first). The most recent import is marked below.
            </p>
          </div>
        </div>
      </AcrCard>

      {/* Import List */}
      <div className="space-y-3">
        {snapshots.map((snapshot, index) => {
          const isNewest = index === 0;
          const showingConfirm = confirmRollback === snapshot.id;
          const isProcessing = isRollingBack === snapshot.id;

          return (
            <AcrCard
              key={snapshot.id}
              variant="outlined"
              className={isNewest ? "border-acr-red-500 bg-acr-red-50" : ""}
            >
              <div className="p-5">
                {/* Mobile: Vertical Stack | Desktop: Horizontal Layout */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* File Name & Badge */}
                    <div className="flex items-start gap-3 flex-wrap">
                      <FileText className="w-5 h-5 text-acr-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-acr-gray-900 break-words">
                          {snapshot.file_name}
                        </p>
                        {isNewest && (
                          <span className="inline-block mt-2 px-3 py-1 text-xs font-bold bg-acr-red-600 text-white rounded-md shadow-sm">
                            Newest
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Import ID */}
                    <div className="flex flex-col gap-2 text-sm text-acr-gray-600 pl-8 sm:pl-0">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words">{formatDate(snapshot.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-acr-gray-500 font-mono text-xs">Import #{snapshot.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    {/* Summary Stats - Grid on Mobile, Row on Desktop */}
                    <div className="grid grid-cols-1 sm:flex sm:flex-row gap-3 sm:gap-4 text-sm">
                      <div className="flex items-center justify-between sm:justify-start gap-3 px-4 py-3 bg-green-50 border-2 border-green-300 rounded-lg sm:px-0 sm:py-0 sm:bg-transparent sm:border-0">
                        <span className="text-green-700 font-medium">Added</span>
                        <span className="text-green-700">
                          <strong className="text-lg sm:text-sm font-bold">+{snapshot.import_summary.adds}</strong>
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-lg sm:px-0 sm:py-0 sm:bg-transparent sm:border-0">
                        <span className="text-blue-700 font-medium">Updated</span>
                        <span className="text-blue-700">
                          <strong className="text-lg sm:text-sm font-bold">~{snapshot.import_summary.updates}</strong>
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-3 px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg sm:px-0 sm:py-0 sm:bg-transparent sm:border-0">
                        <span className="text-red-700 font-medium">Deleted</span>
                        <span className="text-red-700">
                          <strong className="text-lg sm:text-sm font-bold">-{snapshot.import_summary.deletes}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Confirmation Dialog */}
                    {showingConfirm && (
                      <div className="mt-2 p-4 bg-amber-100 border-2 border-amber-300 rounded-lg shadow-sm">
                        <p className="text-sm font-semibold text-amber-900 mb-3">
                          Are you sure you want to rollback this import?
                        </p>
                        <ul className="text-sm text-amber-800 space-y-2 mb-4">
                          {snapshot.import_summary.adds > 0 && (
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600 flex-shrink-0">•</span>
                              <span>{snapshot.import_summary.adds} added records will be removed</span>
                            </li>
                          )}
                          {snapshot.import_summary.updates > 0 && (
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600 flex-shrink-0">•</span>
                              <span>{snapshot.import_summary.updates} updated records will revert</span>
                            </li>
                          )}
                          {snapshot.import_summary.deletes > 0 && (
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600 flex-shrink-0">•</span>
                              <span>{snapshot.import_summary.deletes} deleted records will be restored</span>
                            </li>
                          )}
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmRollback(null)}
                            className="w-full sm:w-auto order-2 sm:order-1"
                          >
                            Cancel
                          </AcrButton>
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRollback(snapshot.id)}
                            className="w-full sm:w-auto bg-amber-600 text-white hover:bg-amber-700 border-amber-600 order-1 sm:order-2"
                          >
                            Yes, Rollback
                          </AcrButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Full Width on Mobile, Compact on Desktop */}
                  {!showingConfirm && (
                    <div className="w-full sm:w-auto sm:flex-shrink-0">
                      <AcrButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmRollback(snapshot.id)}
                        disabled={!isNewest || isProcessing}
                        className={`w-full sm:w-auto min-h-[48px] sm:min-h-0 text-sm font-semibold ${
                          isNewest
                            ? "border-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:border-amber-600"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                            Rolling back...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                            Rollback
                          </>
                        )}
                      </AcrButton>
                    </div>
                  )}
                </div>
              </div>
            </AcrCard>
          );
        })}
      </div>
    </div>
  );
}
