import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableEnhancedProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pageSize?: number;
  rowClassName?: (row: T) => string;
}

export function DataTableEnhanced<T = any>({
  columns,
  data,
  onRowClick,
  loading = false,
  selectable = false,
  selectedRows: externalSelectedRows = [],
  onSelectionChange,
  pageSize = 10,
  rowClassName,
}: DataTableEnhancedProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filtrar datos
  let filteredData = data.filter((row) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const cellValue = String(row[key]).toLowerCase();
      return cellValue.includes(value.toLowerCase());
    });
  });

  // Ordenar datos
  if (sortColumn) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  // Paginación
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((prev) => ({ ...prev, [columnKey]: value }));
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map((row) => (row as any).id);
      onSelectionChange?.([...new Set([...externalSelectedRows, ...allIds])]);
    } else {
      const pageIds = new Set(paginatedData.map((row) => (row as any).id));
      onSelectionChange?.(externalSelectedRows.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...externalSelectedRows, rowId]);
    } else {
      onSelectionChange?.(externalSelectedRows.filter((id) => id !== rowId));
    }
  };

  const allSelected =
    paginatedData.length > 0 && paginatedData.every((row) => externalSelectedRows.includes((row as any).id));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-semibold">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleSort(column.key)}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {column.filterable && (
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Filtrar..."
                            value={filters[column.key] || ""}
                            onChange={(e) => handleFilterChange(column.key, e.target.value)}
                            className="h-7 text-xs pl-7"
                          />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {selectable && (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="text-center text-muted-foreground py-8"
                  >
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const rowId = (row as any).id;
                  const isSelected = externalSelectedRows.includes(rowId);
                  const customClass = rowClassName ? rowClassName(row) : "";
                  return (
                    <TableRow
                      key={rowId}
                      className={cn(
                        onRowClick ? "cursor-pointer" : "",
                        customClass
                      )}
                      onClick={() => !selectable && onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                            aria-label={`Seleccionar ${(row as any).nombre || rowId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render ? column.render((row as any)[column.key], row) : (row as any)[column.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!loading && filteredData.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} de {filteredData.length} registros
            {externalSelectedRows.length > 0 && ` • ${externalSelectedRows.length} seleccionados`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
