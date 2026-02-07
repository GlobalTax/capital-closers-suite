import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { TemplatePhaseEditor } from "./TemplatePhaseEditor";
import { TemplateSyncDialog } from "./TemplateSyncDialog";
import {
  fetchFases,
  fetchTemplates,
  createFase,
  reorderFases,
  type ChecklistFase,
  type ChecklistTemplate,
} from "@/services/checklistTemplates.service";

interface Props {
  tipo: string;
}

export function ChecklistTemplateManager({ tipo }: Props) {
  const queryClient = useQueryClient();
  const [newFaseName, setNewFaseName] = useState("");
  const [addingFase, setAddingFase] = useState(false);

  const fasesQuery = useQuery({
    queryKey: ["checklist-fases", tipo],
    queryFn: () => fetchFases(tipo),
  });

  const templatesQuery = useQuery({
    queryKey: ["checklist-templates", tipo],
    queryFn: () => fetchTemplates(tipo),
  });

  const createFaseMutation = useMutation({
    mutationFn: createFase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-fases", tipo] });
      setNewFaseName("");
      setAddingFase(false);
      toast({ title: "Fase creada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error al crear fase", description: err.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFases,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-fases", tipo] });
    },
  });

  const fases = fasesQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const isLoading = fasesQuery.isLoading || templatesQuery.isLoading;

  const handleCreateFase = () => {
    if (!newFaseName.trim()) {
      toast({ title: "El nombre de la fase es obligatorio", variant: "destructive" });
      return;
    }
    const maxOrden = fases.length > 0 ? Math.max(...fases.map((f) => f.orden)) : 0;
    createFaseMutation.mutate({
      nombre: newFaseName.trim(),
      tipo_operacion: tipo,
      orden: maxOrden + 1,
    });
  };

  const handleMoveFase = (faseId: string, direction: "up" | "down") => {
    const idx = fases.findIndex((f) => f.id === faseId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= fases.length) return;

    const updates = [
      { id: fases[idx].id, orden: fases[swapIdx].orden },
      { id: fases[swapIdx].id, orden: fases[idx].orden },
    ];
    reorderMutation.mutate(updates);
  };

  const getTasksForFase = (faseName: string): ChecklistTemplate[] => {
    return templates.filter((t) => t.fase === faseName);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["checklist-fases", tipo] });
    queryClient.invalidateQueries({ queryKey: ["checklist-templates", tipo] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Phase list */}
      {fases.map((fase, idx) => (
        <TemplatePhaseEditor
          key={fase.id}
          fase={fase}
          tasks={getTasksForFase(fase.nombre)}
          tipo={tipo}
          isFirst={idx === 0}
          isLast={idx === fases.length - 1}
          onMove={(dir) => handleMoveFase(fase.id, dir)}
          onChanged={invalidateAll}
          allFases={fases}
        />
      ))}

      {fases.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          No hay fases configuradas. Crea la primera fase para empezar.
        </div>
      )}

      {/* Add fase */}
      {addingFase ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <Input
            placeholder="Nombre de la nueva fase..."
            value={newFaseName}
            onChange={(e) => setNewFaseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFase()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFase} disabled={createFaseMutation.isPending}>
            {createFaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAddingFase(false); setNewFaseName(""); }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAddingFase(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Añadir fase
        </Button>
      )}

      {/* Sync section */}
      <div className="border-t pt-6 mt-8">
        <TemplateSyncDialog tipo={tipo} />
      </div>
    </div>
  );
}
