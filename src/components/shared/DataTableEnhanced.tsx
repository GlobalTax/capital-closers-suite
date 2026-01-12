import { useState, useEffect } from "react";
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
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";
import type { TableRecord } from "@/types/database";
import type { ServerPaginationProps } from "@/types/pagination";

export interface Column<T extends TableRecord = TableRecord> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

export type ViewDensity = "compact" | "comfortable";

interface DataTableEnhancedProps<T extends TableRecord = TableRecord> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pageSize?: number;
  rowClassName?: (row: T) => string;
  /** Paginación server-side - si se proporciona, se usa en lugar de la local */
  serverPagination?: ServerPaginationProps;
  /** Densidad de la tabla - compact o comfortable */
  density?: ViewDensity;
}

export function DataTableEnhanced<T extends TableRecord = TableRecord>({
  columns,
  data,
  onRowClick,
  loading = false,
  selectable = false,
  selectedRows: externalSelectedRows = [],
  onSelectionChange,
  pageSize = 10,
  rowClassName,
  serverPagination,
  density = "comfortable",
}: DataTableEnhancedProps<T>) {
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Determinar si usamos paginación server-side
  const isServerPaginated = !!serverPagination;

  // Reset local page when filters change (solo para paginación local)
  useEffect(() => {
    if (!isServerPaginated) {
      setLocalCurrentPage(1);
    }
  }, [filters, isServerPaginated]);

  // Para paginación server-side, no filtramos/ordenamos localmente
  // Para paginación local, aplicamos filtros y ordenamiento
  let processedData = data;
  
  if (!isServerPaginated) {
    // Filtrar datos (solo para paginación local)
    processedData = data.filter((row) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String((row as any)[key]).toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });

    // Ordenar datos (solo para paginación local)
    if (sortColumn) {
      processedData = [...processedData].sort((a, b) => {
        const aVal = (a as any)[sortColumn];
        const bVal = (b as any)[sortColumn];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
  }

  // Paginación
  const currentPage = isServerPaginated ? serverPagination.currentPage : localCurrentPage;
  const totalPages = isServerPaginated 
    ? serverPagination.totalPages 
    : Math.ceil(processedData.length / pageSize);
  const totalCount = isServerPaginated 
    ? serverPagination.totalCount 
    : processedData.length;
  
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = isServerPaginated 
    ? data // Ya viene paginado del servidor
    : processedData.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (isServerPaginated) {
      serverPagination.onPageChange(newPage);
    } else {
      setLocalCurrentPage(newPage);
    }
  };

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
    // Para paginación local, reseteamos a página 1
    // Para server-side, el componente padre debe manejar el reset de página
    if (!isServerPaginated) {
      setLocalCurrentPage(1);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map((row) => row.id);
      onSelectionChange?.([...new Set([...externalSelectedRows, ...allIds])]);
    } else {
      const pageIds = new Set(paginatedData.map((row) => row.id));
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
    paginatedData.length > 0 && paginatedData.every((row) => externalSelectedRows.includes(row.id));

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
                  <TableHead key={column.key}>
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
                <TableSkeleton 
                  columns={columns.length} 
                  rows={5} 
                  hasCheckbox={selectable} 
                />
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="text-center text-muted-foreground py-12"
                  >
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const rowId = row.id;
                  const isSelected = externalSelectedRows.includes(rowId);
                  const customClass = rowClassName ? rowClassName(row) : "";
                  return (
                    <TableRow
                      key={rowId}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "transition-all duration-150",
                        onRowClick && "cursor-pointer",
                        isSelected 
                          ? "bg-primary/5 border-l-2 border-l-primary" 
                          : "hover:bg-muted/50",
                        customClass
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                            aria-label={`Seleccionar ${(row as any).nombre || rowId}`}
                            className="transition-transform duration-150 data-[state=checked]:scale-110"
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell 
                          key={column.key}
                          className={cn(
                            density === "compact" ? "py-2" : "py-3"
                          )}
                        >
                          {column.render ? column.render((row as any)[column.key], row) : String((row as any)[column.key] ?? '')}
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

      {!loading && totalCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">{startIndex + 1}-{Math.min(startIndex + pageSize, totalCount)}</span>
            {" "}de{" "}
            <span className="text-foreground">{totalCount}</span>
            {" "}registros
            {externalSelectedRows.length > 0 && (
              <span className="ml-2 text-primary">• {externalSelectedRows.length} seleccionados</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
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
