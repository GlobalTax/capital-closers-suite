import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MandatoChecklistTask, ChecklistFase, ChecklistResponsable, ChecklistSistema, ChecklistEstado, DDWorkstream } from "@/types";
import { WORKSTREAM_CONFIG } from "@/types";
import { createChecklistTask, updateChecklistTask } from "@/services/checklist.service";
import { toast } from "@/hooks/use-toast";

interface ChecklistTaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  task?: MandatoChecklistTask;
  onSuccess: () => void;
}

const FASES: ChecklistFase[] = ["1. Preparación", "2. Marketing", "3. Ofertas"];
const RESPONSABLES: ChecklistResponsable[] = ["Dirección M&A", "Analista", "Asesor M&A", "Marketing", "Legal", "Research", "M&A Support"];
const SISTEMAS: ChecklistSistema[] = ["Brevo", "CRM", "Lovable.dev", "DealSuite", "ARX", "Data Room", "Supabase"];
const ESTADOS: ChecklistEstado[] = ["⏳ Pendiente", "🔄 En curso", "✅ Completa"];
const WORKSTREAMS: DDWorkstream[] = ['legal', 'financial', 'commercial', 'ops', 'it', 'tax', 'other'];

export function ChecklistTaskDrawer({ open, onOpenChange, mandatoId, task, onSuccess }: ChecklistTaskDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    fase: ChecklistFase;
    tarea: string;
    descripcion: string;
    responsable: ChecklistResponsable | "";
    sistema: ChecklistSistema | "";
    estado: ChecklistEstado;
    fecha_limite: string;
    url_relacionada: string;
    notas: string;
    workstream: DDWorkstream;
  }>({
    fase: "1. Preparación",
    tarea: "",
    descripcion: "",
    responsable: "",
    sistema: "",
    estado: "⏳ Pendiente",
    fecha_limite: "",
    url_relacionada: "",
    notas: "",
    workstream: "other",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        fase: task.fase,
        tarea: task.tarea,
        descripcion: task.descripcion || "",
        responsable: task.responsable || "",
        sistema: task.sistema || "",
        estado: task.estado,
        fecha_limite: task.fecha_limite || "",
        url_relacionada: task.url_relacionada || "",
        notas: task.notas || "",
        workstream: task.workstream || "other",
      });
    } else {
      setFormData({
        fase: "1. Preparación",
        tarea: "",
        descripcion: "",
        responsable: "",
        sistema: "",
        estado: "⏳ Pendiente",
        fecha_limite: "",
        url_relacionada: "",
        notas: "",
        workstream: "other",
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        fase: formData.fase,
        tarea: formData.tarea,
        descripcion: formData.descripcion || undefined,
        responsable: formData.responsable || undefined,
        sistema: formData.sistema || undefined,
        estado: formData.estado,
        fecha_limite: formData.fecha_limite || undefined,
        url_relacionada: formData.url_relacionada || undefined,
        notas: formData.notas || undefined,
        workstream: formData.workstream,
      };

      if (task) {
        await updateChecklistTask(task.id, dataToSave);
        toast({ title: "Tarea actualizada", description: "La tarea se actualizó correctamente" });
      } else {
        await createChecklistTask({
          ...dataToSave,
          mandato_id: mandatoId,
          orden: 999,
        });
        toast({ title: "Tarea creada", description: "La tarea se creó correctamente" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</SheetTitle>
          <SheetDescription>
            {task ? "Modifica los detalles de la tarea" : "Crea una nueva tarea del checklist M&A"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="fase">Fase *</Label>
            <Select value={formData.fase} onValueChange={(v) => setFormData({ ...formData, fase: v as ChecklistFase })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FASES.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tarea">Tarea *</Label>
            <Input
              id="tarea"
              value={formData.tarea}
              onChange={(e) => setFormData({ ...formData, tarea: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="responsable">Responsable</Label>
            <Select value={formData.responsable} onValueChange={(v) => setFormData({ ...formData, responsable: v as ChecklistResponsable })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {RESPONSABLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sistema">Sistema</Label>
            <Select value={formData.sistema} onValueChange={(v) => setFormData({ ...formData, sistema: v as ChecklistSistema })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {SISTEMAS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="workstream">Workstream DD</Label>
            <Select value={formData.workstream} onValueChange={(v) => setFormData({ ...formData, workstream: v as DDWorkstream })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar área..." />
              </SelectTrigger>
              <SelectContent>
                {WORKSTREAMS.map((ws) => (
                  <SelectItem key={ws} value={ws}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: WORKSTREAM_CONFIG[ws].color }} 
                      />
                      {WORKSTREAM_CONFIG[ws].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estado">Estado *</Label>
            <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v as ChecklistEstado })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fecha_limite">Fecha límite</Label>
            <Input
              id="fecha_limite"
              type="date"
              value={formData.fecha_limite}
              onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="url_relacionada">URL relacionada</Label>
            <Input
              id="url_relacionada"
              type="url"
              value={formData.url_relacionada}
              onChange={(e) => setFormData({ ...formData, url_relacionada: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Guardando..." : task ? "Actualizar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
