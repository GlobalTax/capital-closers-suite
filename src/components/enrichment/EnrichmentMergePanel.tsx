/**
 * Merge panel for comparing old vs new enrichment data
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowRight, Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExistingEmpresa, EnrichedData, MergeMode, FieldDiff } from "@/types/enrichment";
import { calculateFieldDiff } from "@/services/enrichment.service";

interface EnrichmentMergePanelProps {
  existing: ExistingEmpresa;
  incoming: EnrichedData;
  mode: MergeMode;
  matchType: 'cif' | 'nombre' | 'web' | null;
  onModeChange: (mode: MergeMode) => void;
  fieldSelections: Record<string, boolean>;
  onFieldToggle: (field: string) => void;
}

const matchTypeLabels: Record<string, string> = {
  cif: 'CIF idéntico',
  nombre: 'Nombre similar',
  web: 'Sitio web coincidente',
};

function formatValue(value: string | number | string[] | null | undefined): string {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return value.toLocaleString('es-ES');
  return String(value);
}

export function EnrichmentMergePanel({
  existing,
  incoming,
  mode,
  matchType,
  onModeChange,
  fieldSelections,
  onFieldToggle,
}: EnrichmentMergePanelProps) {
  const diffs = calculateFieldDiff(existing, incoming);
  const fieldsWithNewData = diffs.filter(d => d.newValue != null);
  const emptyFieldsCount = diffs.filter(d => d.oldValue == null && d.newValue != null).length;
  const conflictCount = diffs.filter(d => d.isConflict).length;

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <Card className="p-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Empresa existente detectada
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Coincidencia por: <span className="font-medium">{matchType ? matchTypeLabels[matchType] : 'datos similares'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Empresa: <span className="font-medium">{existing.nombre}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Mode Selection */}
      <Card className="p-4">
        <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as MergeMode)}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="empty_only" id="empty_only" />
              <Label htmlFor="empty_only" className="flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4 text-green-500" />
                <span>Solo actualizar campos vacíos</span>
                <Badge variant="secondary" className="ml-2">{emptyFieldsCount} campos</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="update_existing" id="update_existing" />
              <Label htmlFor="update_existing" className="flex items-center gap-2 cursor-pointer">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Sobrescribir campos seleccionados</span>
                {conflictCount > 0 && (
                  <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-600">
                    {conflictCount} conflictos
                  </Badge>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="create_new" id="create_new" />
              <Label htmlFor="create_new" className="flex items-center gap-2 cursor-pointer">
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span>Ignorar y crear empresa nueva</span>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </Card>

      {/* Field Comparison */}
      {mode !== 'create_new' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-px bg-muted">
            {/* Header */}
            <div className="bg-background p-3 font-medium text-sm col-span-1">
              Aplicar
            </div>
            <div className="bg-background p-3 font-medium text-sm">
              Datos actuales
            </div>
            <div className="bg-background p-3" />
            <div className="bg-background p-3 font-medium text-sm">
              Datos nuevos
            </div>

            {/* Rows */}
            {fieldsWithNewData.map((diff) => {
              const isSelected = mode === 'empty_only' 
                ? diff.oldValue == null 
                : (fieldSelections[diff.field] ?? diff.selected);
              const canToggle = mode === 'update_existing' && diff.newValue != null;

              return (
                <div key={diff.field} className="contents">
                  <div className="bg-background p-3 flex items-center justify-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onFieldToggle(diff.field)}
                      disabled={!canToggle}
                    />
                  </div>
                  <div
                    className={cn(
                      "bg-background p-3 text-sm",
                      diff.isConflict && "bg-amber-50 dark:bg-amber-950/20"
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {diff.label}
                    </div>
                    <div className={cn(
                      "truncate",
                      diff.oldValue == null && "text-muted-foreground italic"
                    )}>
                      {formatValue(diff.oldValue)}
                    </div>
                  </div>
                  <div className="bg-background p-3 flex items-center justify-center">
                    <ArrowRight className={cn(
                      "h-4 w-4",
                      isSelected ? "text-primary" : "text-muted-foreground/30"
                    )} />
                  </div>
                  <div
                    className={cn(
                      "bg-background p-3 text-sm",
                      isSelected && "bg-green-50 dark:bg-green-950/20"
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {diff.label}
                    </div>
                    <div className={cn(
                      "truncate font-medium",
                      isSelected && "text-green-700 dark:text-green-400"
                    )}>
                      {formatValue(diff.newValue)}
                      {isSelected && <Check className="inline-block ml-1 h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
