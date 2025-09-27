import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface AcrTableColumn<T = any> {
  key: string;
  label?: React.ReactNode;
  render: (value: any, item?: T, index?: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface AcrTableProps<T = any> {
  /**
   * Array of data items to display
   */
  data: T[];
  /**
   * Column configuration
   */
  columns: AcrTableColumn<T>[];
  /**
   * Show loading skeleton instead of table
   * @default false
   */
  isLoading?: boolean;
  /**
   * Number of skeleton rows to show when loading
   * @default 5
   */
  loadingRows?: number;
  /**
   * Custom className for the table container
   */
  className?: string;
  /**
   * Custom className for table rows
   */
  rowClassName?: string | ((item: T, index: number) => string);
  /**
   * Handle row click events
   */
  onRowClick?: (item: T, index: number) => void;
  /**
   * Empty state message
   * @default "No data available"
   */
  emptyMessage?: React.ReactNode;
  /**
   * Show table header
   * @default true
   */
  showHeader?: boolean;
}

/**
 * ACR-branded table component with consistent styling and loading states
 * Built on top of shadcn Table with ACR design standards
 *
 * @example
 * const columns: AcrTableColumn<Part>[] = [
 *   {
 *     key: "sku",
 *     label: "SKU",
 *     render: (value) => <span className="font-mono">{value}</span>
 *   },
 *   {
 *     key: "name",
 *     label: "Part Name",
 *     render: (value) => <span>{value}</span>
 *   }
 * ];
 *
 * <AcrTable data={parts} columns={columns} isLoading={isLoading} />
 */
export function AcrTable<T = any>({
  data,
  columns,
  isLoading = false,
  loadingRows = 5,
  className,
  rowClassName,
  onRowClick,
  emptyMessage = "No data available",
  showHeader = true,
}: AcrTableProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            {showHeader && (
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-acr-red-50">
                  {columns.map((column, index) => (
                    <th
                      key={`header-skeleton-${index}`}
                      className={cn(
                        "h-10 px-4 text-left align-middle font-medium text-acr-gray-600",
                        column.headerClassName
                      )}
                    >
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="[&_tr:last-child]:border-0">
              {Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <tr
                  key={`skeleton-row-${rowIndex}`}
                  className="border-b transition-colors hover:bg-acr-red-50"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={`skeleton-cell-${rowIndex}-${colIndex}`}
                      className="p-4 align-middle"
                    >
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            {showHeader && (
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors">
                  {columns.map((column, index) => (
                    <th
                      key={`empty-header-${index}`}
                      className={cn(
                        "h-10 px-4 text-left align-middle font-medium text-acr-gray-600 bg-acr-gray-50",
                        column.headerClassName
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-acr-gray-500 italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Data table
  return (
    <div className={cn("w-full", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow className="border-acr-gray-200 hover:bg-acr-red-50">
              {columns.map((column, index) => (
                <TableHead
                  key={`header-${column.key}-${index}`}
                  className={cn(
                    "h-12 px-4 text-left align-middle font-semibold text-acr-gray-700 bg-acr-gray-50",
                    column.headerClassName
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {data.map((item, index) => {
            const computedRowClassName = typeof rowClassName === "function"
              ? rowClassName(item, index)
              : rowClassName;

            return (
              <TableRow
                key={`row-${index}`}
                className={cn(
                  "border-acr-gray-200 hover:bg-acr-red-50 transition-colors duration-200",
                  onRowClick && "cursor-pointer",
                  computedRowClassName
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={`cell-${index}-${column.key}-${colIndex}`}
                    className={cn(
                      "p-4 align-middle text-acr-gray-900",
                      column.className
                    )}
                  >
                    {column.render(
                      (item as any)[column.key],
                      item,
                      index
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * ACR Table component with type-safe column definitions
 */
AcrTable.displayName = "AcrTable";