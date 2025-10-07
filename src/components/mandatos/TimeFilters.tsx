import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeFilterState, TimeEntryWorkType, TimeEntryStatus } from "@/types";

interface TimeFiltersProps {
  filters: TimeFilterState;
  onChange: (filters: TimeFilterState) => void;
  users?: { id: string; name: string }[];
  mandatos?: { id: string; name: string }[];
  showUserFilter?: boolean;
}

const workTypes: TimeEntryWorkType[] = [
  'Análisis', 'Reunión', 'Due Diligence', 'Documentación', 
  'Negociación', 'Marketing', 'Research', 'Otro'
];

const statuses: (TimeEntryStatus | 'all')[] = ['all', 'draft', 'submitted', 'approved', 'rejected'];

export function TimeFilters({ filters, onChange, users = [], mandatos = [], showUserFilter = false }: TimeFiltersProps) {
  const handleClearFilters = () => {
    onChange({
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
      userId: 'all',
      mandatoId: 'all',
      status: 'all' as any,
      workType: 'Otro' as any,
      onlyBillable: false
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avanzados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Fecha Inicio */}
          <div className="space-y-2">
            <Label>Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(filters.startDate, "PPP", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => date && onChange({ ...filters, startDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha Fin */}
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(filters.endDate, "PPP", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => date && onChange({ ...filters, endDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Usuario (solo para Super Admin) */}
          {showUserFilter && users.length > 0 && (
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => onChange({ ...filters, userId: value })}
              >
                <SelectTrigger>
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

          {/* Mandato */}
          {mandatos.length > 0 && (
            <div className="space-y-2">
              <Label>Mandato</Label>
              <Select
                value={filters.mandatoId || 'all'}
                onValueChange={(value) => onChange({ ...filters, mandatoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los mandatos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los mandatos</SelectItem>
                  {mandatos.map((mandato) => (
                    <SelectItem key={mandato.id} value={mandato.id}>
                      {mandato.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onChange({ ...filters, status: value as any })}
            >
              <SelectTrigger>
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

          {/* Tipo de Trabajo */}
          <div className="space-y-2">
            <Label>Tipo de Trabajo</Label>
            <Select
              value={filters.workType}
              onValueChange={(value) => onChange({ ...filters, workType: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Otro">Todos</SelectItem>
                {workTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Solo Facturables */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Switch
            id="billable"
            checked={filters.onlyBillable}
            onCheckedChange={(checked) => onChange({ ...filters, onlyBillable: checked })}
          />
          <Label htmlFor="billable" className="cursor-pointer">
            Solo mostrar horas facturables
          </Label>
        </div>

        {/* Botón Limpiar */}
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
