import { useState } from "react";
import { format, startOfWeek, startOfMonth, endOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TimeFilterState, TimeEntryStatus } from "@/types";

interface TimeFilterBarProps {
  filters: TimeFilterState;
  onChange: (filters: TimeFilterState) => void;
  mandatos?: { id: string; name: string }[];
  showUserFilter?: boolean;
  users?: { id: string; name: string }[];
}

type PeriodPreset = 'today' | 'week' | 'month' | 'custom';

export function TimeFilterBar({ 
  filters, 
  onChange, 
  mandatos = [], 
  showUserFilter = false,
  users = []
}: TimeFilterBarProps) {
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Determine current period preset
  const getPeriodPreset = (): PeriodPreset => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    
    if (format(filters.startDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'today';
    }
    if (format(filters.startDate, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')) {
      return 'week';
    }
    if (format(filters.startDate, 'yyyy-MM-dd') === format(monthStart, 'yyyy-MM-dd')) {
      return 'month';
    }
    return 'custom';
  };

  const currentPeriod = getPeriodPreset();

  const periodLabels: Record<PeriodPreset, string> = {
    today: 'Hoy',
    week: 'Esta semana',
    month: 'Este mes',
    custom: 'Personalizado'
  };

  const handlePeriodChange = (preset: PeriodPreset) => {
    const today = new Date();
    let startDate: Date;
    
    switch (preset) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(today);
        break;
      default:
        return;
    }
    
    onChange({
      ...filters,
      startDate,
      endDate: endOfDay(today)
    });
    setPeriodPopoverOpen(false);
  };


  const handleClearFilters = () => {
    onChange({
      startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      endDate: endOfDay(new Date()),
      userId: 'all',
      mandatoId: 'all',
      status: 'all' as any,
      workType: 'Otro' as any,
      valueType: 'all',
      onlyBillable: false
    });
    setAdvancedOpen(false);
  };

  const hasActiveFilters = 
    filters.mandatoId !== 'all' || 
    filters.status !== 'all' || 
    filters.onlyBillable ||
    (showUserFilter && filters.userId !== 'all');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period Selector */}
      <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 px-3 font-normal"
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {currentPeriod === 'custom' 
              ? `${format(filters.startDate, 'd MMM', { locale: es })} - ${format(filters.endDate, 'd MMM', { locale: es })}`
              : periodLabels[currentPeriod]
            }
            <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2 space-y-1">
            {(['today', 'week', 'month'] as PeriodPreset[]).map((preset) => (
              <Button
                key={preset}
                variant={currentPeriod === preset ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => handlePeriodChange(preset)}
              >
                {periodLabels[preset]}
              </Button>
            ))}
          </div>
          <div className="border-t p-2">
            <p className="text-xs text-muted-foreground mb-2 px-2">Rango personalizado</p>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {format(filters.startDate, 'd MMM', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => date && onChange({ ...filters, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground self-center">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {format(filters.endDate, 'd MMM', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => date && onChange({ ...filters, endDate: endOfDay(date) })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </PopoverContent>
      </Popover>


      {/* Advanced Filters Popover */}
      <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={hasActiveFilters ? 'secondary' : 'outline'} 
            size="sm"
            className="h-8 px-3 font-normal"
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            + Filtros
            {hasActiveFilters && (
              <span className="ml-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {[
                  filters.mandatoId !== 'all',
                  filters.status !== 'all',
                  filters.onlyBillable,
                  showUserFilter && filters.userId !== 'all'
                ].filter(Boolean).length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-4">
            {/* User Filter (conditional) */}
            {showUserFilter && users.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Usuario</Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) => onChange({ ...filters, userId: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Todos los usuarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mandato Filter */}
            {mandatos.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Mandato</Label>
                <Select
                  value={filters.mandatoId || 'all'}
                  onValueChange={(value) => onChange({ ...filters, mandatoId: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Todos los mandatos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los mandatos</SelectItem>
                    <SelectItem 
                      value="00000000-0000-0000-0000-000000000001"
                      className="font-medium"
                    >
                      🏢 Trabajo General M&A
                    </SelectItem>
                    {mandatos.map((mandato) => (
                      <SelectItem key={mandato.id} value={mandato.id}>
                        {mandato.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onChange({ ...filters, status: value as TimeEntryStatus | 'all' })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="submitted">Enviado</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billable Switch */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="billable-filter" className="text-sm cursor-pointer">
                Solo facturables
              </Label>
              <Switch
                id="billable-filter"
                checked={filters.onlyBillable}
                onCheckedChange={(checked) => onChange({ ...filters, onlyBillable: checked })}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters Button */}
      {(hasActiveFilters || currentPeriod !== 'week') && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleClearFilters}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
