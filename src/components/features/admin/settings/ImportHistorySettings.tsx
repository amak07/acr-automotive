"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Clock, FileText, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { useToast } from "@/hooks/common/use-toast";

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
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-acr-gray-600 flex-shrink-0" />
                      <p className="font-semibold text-acr-gray-900 truncate">
                        {snapshot.file_name}
                      </p>
                      {isNewest && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-acr-red-600 text-white rounded">
                          Newest
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-acr-gray-600 mb-3">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(snapshot.created_at)}</span>
                      <span className="text-acr-gray-400">•</span>
                      <span>Import #{snapshot.id.slice(0, 8)}</span>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="text-green-700">
                        <strong>+{snapshot.import_summary.adds}</strong> added
                      </span>
                      <span className="text-blue-700">
                        <strong>~{snapshot.import_summary.updates}</strong> updated
                      </span>
                      <span className="text-red-700">
                        <strong>-{snapshot.import_summary.deletes}</strong> deleted
                      </span>
                    </div>

                    {/* Confirmation Dialog */}
                    {showingConfirm && (
                      <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-md">
                        <p className="text-sm font-medium text-amber-900 mb-2">
                          Are you sure you want to rollback this import?
                        </p>
                        <ul className="text-xs text-amber-800 space-y-1 mb-3">
                          {snapshot.import_summary.adds > 0 && (
                            <li>• {snapshot.import_summary.adds} added records will be removed</li>
                          )}
                          {snapshot.import_summary.updates > 0 && (
                            <li>• {snapshot.import_summary.updates} updated records will revert</li>
                          )}
                          {snapshot.import_summary.deletes > 0 && (
                            <li>• {snapshot.import_summary.deletes} deleted records will be restored</li>
                          )}
                        </ul>
                        <div className="flex gap-2">
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmRollback(null)}
                          >
                            Cancel
                          </AcrButton>
                          <AcrButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRollback(snapshot.id)}
                            className="bg-amber-600 text-white hover:bg-amber-700 border-amber-600"
                          >
                            Yes, Rollback
                          </AcrButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {!showingConfirm && (
                    <AcrButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmRollback(snapshot.id)}
                      disabled={!isNewest || isProcessing}
                      className={
                        isNewest
                          ? "border-amber-500 text-amber-700 hover:bg-amber-50"
                          : "opacity-50 cursor-not-allowed"
                      }
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rolling back...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Rollback
                        </>
                      )}
                    </AcrButton>
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
