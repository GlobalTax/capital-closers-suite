import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { AuditFilters } from "@/services/auditLogs";

interface AuditFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
}

const TABLES = [
  "mandatos",
  "contactos",
  "empresas",
  "interacciones",
  "tareas",
  "documentos",
  "admin_users",
  "mandato_checklist_tasks"
];

const ACTIONS = ["INSERT", "UPDATE", "DELETE"];

export function AuditFiltersComponent({ filters, onFiltersChange }: AuditFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-2 block">Buscar</label>
        <Input
          placeholder="Email, tabla..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium mb-2 block">Tabla</label>
        <Select
          value={filters.table_name || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, table_name: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las tablas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tablas</SelectItem>
            {TABLES.map((table) => (
              <SelectItem key={table} value={table}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[150px]">
        <label className="text-sm font-medium mb-2 block">Acción</label>
        <Select
          value={filters.action || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, action: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[150px]">
        <label className="text-sm font-medium mb-2 block">Desde</label>
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
        />
      </div>

      <div className="min-w-[150px]">
        <label className="text-sm font-medium mb-2 block">Hasta</label>
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
        />
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="gap-2">
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
