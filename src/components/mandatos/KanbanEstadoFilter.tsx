import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import type { MandatoEstado } from "@/types";

const ESTADO_OPTIONS: { value: MandatoEstado; label: string; color: string }[] = [
  { value: "prospecto", label: "Prospecto", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "activo", label: "Activo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "en_negociacion", label: "En Negociación", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "cerrado", label: "Cerrado", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

interface KanbanEstadoFilterProps {
  selectedEstados: string[];
  onChange: (estados: string[]) => void;
}

export function KanbanEstadoFilter({ selectedEstados, onChange }: KanbanEstadoFilterProps) {
  const toggleEstado = (value: string) => {
    if (selectedEstados.includes(value)) {
      onChange(selectedEstados.filter((v) => v !== value));
    } else {
      onChange([...selectedEstados, value]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 md:h-8 px-2 md:px-3">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Estado</span>
          {selectedEstados.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {selectedEstados.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-background" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Estado del mandato</span>
            {selectedEstados.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-5 px-1.5 text-xs text-muted-foreground">
                Todos
              </Button>
            )}
          </div>
          {ESTADO_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`kanban-estado-${opt.value}`}
                checked={selectedEstados.includes(opt.value)}
                onCheckedChange={() => toggleEstado(opt.value)}
              />
              <Label htmlFor={`kanban-estado-${opt.value}`} className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
                <span className={`inline-block w-2 h-2 rounded-full ${opt.color.split(" ")[0]}`} />
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
