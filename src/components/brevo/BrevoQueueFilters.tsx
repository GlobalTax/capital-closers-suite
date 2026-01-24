import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { QueueFilters } from "@/hooks/useBrevoQueue";

interface BrevoQueueFiltersProps {
  filters: QueueFilters;
  onFiltersChange: (filters: QueueFilters) => void;
}

export function BrevoQueueFilters({ filters, onFiltersChange }: BrevoQueueFiltersProps) {
  const handleEntityTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      entityType: value as QueueFilters['entityType'],
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as QueueFilters['status'],
    });
  };

  const handleErrorSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      errorSearch: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      entityType: 'all',
      status: 'all',
      errorSearch: '',
    });
  };

  const hasActiveFilters = 
    filters.entityType !== 'all' || 
    filters.status !== 'all' || 
    filters.errorSearch.trim() !== '';

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
        <Select value={filters.entityType} onValueChange={handleEntityTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="contact">Contactos</SelectItem>
            <SelectItem value="company">Empresas</SelectItem>
            <SelectItem value="deal">Deals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Estado:</span>
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="failed">Fallidos</SelectItem>
            <SelectItem value="skipped">Ignorados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <span className="text-sm font-medium text-muted-foreground">Error:</span>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en mensajes de error..."
            value={filters.errorSearch}
            onChange={(e) => handleErrorSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
