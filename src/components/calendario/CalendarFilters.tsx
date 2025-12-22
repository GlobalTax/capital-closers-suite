import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Calendar as CalendarIcon, List, LayoutGrid } from "lucide-react";
import { CalendarFilters as CalendarFiltersType, CalendarViewMode, EVENT_TYPE_CONFIG, CalendarEventType } from "@/types/calendar";

interface CalendarFiltersProps {
  filters: CalendarFiltersType;
  onFiltersChange: (filters: CalendarFiltersType) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
}

export function CalendarFilters({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: CalendarFiltersProps) {
  const eventTypes = Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][];

  const toggleEventType = (type: CalendarEventType) => {
    const newTypes = filters.tipoEvento.includes(type)
      ? filters.tipoEvento.filter(t => t !== type)
      : [...filters.tipoEvento, type];
    onFiltersChange({ ...filters, tipoEvento: newTypes });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* View Mode Toggle */}
      <div className="flex items-center rounded-lg border bg-background p-1">
        <Button
          variant={viewMode === 'month' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('month')}
          className="h-8 px-3"
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          Mes
        </Button>
        <Button
          variant={viewMode === 'week' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('week')}
          className="h-8 px-3"
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          Semana
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="h-8 px-3"
        >
          <List className="h-4 w-4 mr-1" />
          Lista
        </Button>
      </div>

      {/* Tipo Mandato */}
      <Select
        value={filters.tipoMandato}
        onValueChange={(value) => onFiltersChange({ ...filters, tipoMandato: value as any })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="compra">Compra</SelectItem>
          <SelectItem value="venta">Venta</SelectItem>
        </SelectContent>
      </Select>

      {/* Estado Mandato */}
      <Select
        value={filters.estadoMandato}
        onValueChange={(value) => onFiltersChange({ ...filters, estadoMandato: value as any })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="activo">Activo</SelectItem>
          <SelectItem value="en_negociacion">En Negociación</SelectItem>
          <SelectItem value="cerrado">Cerrado</SelectItem>
        </SelectContent>
      </Select>

      {/* Event Types Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-2" />
            Tipos de evento
            {filters.tipoEvento.length < eventTypes.length && (
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {filters.tipoEvento.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">Mostrar eventos</p>
            {eventTypes.map(([type, config]) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={filters.tipoEvento.includes(type)}
                  onCheckedChange={() => toggleEventType(type)}
                />
                <Label
                  htmlFor={type}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </Label>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCompleted"
                  checked={filters.showCompleted}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ ...filters, showCompleted: !!checked })
                  }
                />
                <Label htmlFor="showCompleted" className="text-sm cursor-pointer">
                  Mostrar completadas
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
