import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { ChecklistFase, ChecklistTemplate } from "@/services/checklistTemplates.service";

interface Props {
  initial?: Partial<ChecklistTemplate>;
  onSave: (data: Partial<ChecklistTemplate>) => void;
  onCancel: () => void;
  isPending: boolean;
  allFases: ChecklistFase[];
}

export function TemplateTaskForm({ initial, onSave, onCancel, isPending }: Props) {
  const [tarea, setTarea] = useState(initial?.tarea ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [responsable, setResponsable] = useState(initial?.responsable ?? "");
  const [sistema, setSistema] = useState(initial?.sistema ?? "");
  const [duracion, setDuracion] = useState<string>(
    initial?.duracion_estimada_dias != null ? String(initial.duracion_estimada_dias) : ""
  );
  const [esCritica, setEsCritica] = useState(initial?.es_critica ?? false);

  const handleSubmit = () => {
    if (!tarea.trim()) return;
    onSave({
      tarea: tarea.trim(),
      descripcion: descripcion.trim() || null,
      responsable: responsable.trim() || null,
      sistema: sistema.trim() || null,
      duracion_estimada_dias: duracion ? Number(duracion) : null,
      es_critica: esCritica,
    });
  };

  return (
    <div className="px-4 py-3 bg-muted/20 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs">Título de la tarea *</Label>
          <Input
            value={tarea}
            onChange={(e) => setTarea(e.target.value)}
            placeholder="Título de la tarea..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Descripción</Label>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción opcional..."
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Responsable</Label>
          <Input
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Ej: Analista, Director..."
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Sistema</Label>
          <Input
            value={sistema}
            onChange={(e) => setSistema(e.target.value)}
            placeholder="Ej: CRM, Email..."
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Duración estimada (días)</Label>
          <Input
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            placeholder="Días"
            className="h-8 text-sm"
            min={0}
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <Checkbox
            id="es-critica"
            checked={esCritica}
            onCheckedChange={(v) => setEsCritica(!!v)}
          />
          <Label htmlFor="es-critica" className="text-xs cursor-pointer">
            Tarea crítica
          </Label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isPending || !tarea.trim()}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : initial?.id ? "Guardar" : "Crear"}
        </Button>
      </div>
    </div>
  );
}
