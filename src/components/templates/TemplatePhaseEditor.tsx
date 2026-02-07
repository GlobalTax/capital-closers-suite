import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  Loader2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { TemplateTaskForm } from "./TemplateTaskForm";
import {
  updateFase,
  deleteFase,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  reorderTemplates,
  type ChecklistFase,
  type ChecklistTemplate,
} from "@/services/checklistTemplates.service";
import { Badge } from "@/components/ui/badge";

interface Props {
  fase: ChecklistFase;
  tasks: ChecklistTemplate[];
  tipo: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
  onChanged: () => void;
  allFases: ChecklistFase[];
}

export function TemplatePhaseEditor({
  fase,
  tasks,
  tipo,
  isFirst,
  isLast,
  onMove,
  onChanged,
  allFases,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(fase.nombre);
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const updateFaseMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateFase>[1]) => updateFase(fase.id, data),
    onSuccess: () => {
      onChanged();
      setEditing(false);
      toast({ title: "Fase actualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteFaseMutation = useMutation({
    mutationFn: () => deleteFase(fase.id),
    onSuccess: () => {
      onChanged();
      toast({ title: "Fase eliminada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      onChanged();
      setAddingTask(false);
      toast({ title: "Tarea creada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTemplate>[1] }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      onChanged();
      setEditingTaskId(null);
      toast({ title: "Tarea actualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      onChanged();
      toast({ title: "Tarea eliminada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveFaseName = () => {
    if (!editName.trim()) {
      toast({ title: "El nombre no puede estar vacío", variant: "destructive" });
      return;
    }
    updateFaseMutation.mutate({ nombre: editName.trim() });
  };

  const handleMoveTask = (taskId: string, direction: "up" | "down") => {
    const sorted = [...tasks].sort((a, b) => a.orden - b.orden);
    const idx = sorted.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    reorderTemplates([
      { id: sorted[idx].id, orden: sorted[swapIdx].orden },
      { id: sorted[swapIdx].id, orden: sorted[idx].orden },
    ]).then(() => onChanged());
  };

  const hasTasks = tasks.length > 0;
  const sortedTasks = [...tasks].sort((a, b) => a.orden - b.orden);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 -rotate-90" />}
            </Button>
          </CollapsibleTrigger>

          {editing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveFaseName()}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveFaseName} disabled={updateFaseMutation.isPending}>
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditName(fase.nombre); }}>
                Cancelar
              </Button>
            </div>
          ) : (
            <>
              <span className="font-medium text-foreground flex-1">{fase.nombre}</span>
              <Badge variant="secondary" className="text-xs">{tasks.length} tareas</Badge>
            </>
          )}

          {!editing && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMove("up")} disabled={isFirst}>
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMove("down")} disabled={isLast}>
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(true); setEditName(fase.nombre); }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>

              {hasTasks ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Fase con tareas
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta fase tiene {tasks.length} tarea(s). Elimina o mueve las tareas primero antes de eliminar la fase.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Entendido</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar fase?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará la fase "{fase.nombre}". Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteFaseMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Tasks */}
        <CollapsibleContent>
          <div className="divide-y">
            {sortedTasks.map((task, idx) => (
              <div key={task.id}>
                {editingTaskId === task.id ? (
                  <TemplateTaskForm
                    initial={task}
                    onSave={(data) =>
                      updateTaskMutation.mutate({ id: task.id, data })
                    }
                    onCancel={() => setEditingTaskId(null)}
                    isPending={updateTaskMutation.isPending}
                    allFases={allFases}
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 group">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{task.tarea}</span>
                        {task.es_critica && (
                          <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      {task.descripcion && (
                        <p className="text-xs text-muted-foreground truncate">{task.descripcion}</p>
                      )}
                      <div className="flex gap-2 mt-0.5">
                        {task.responsable && (
                          <span className="text-xs text-muted-foreground">👤 {task.responsable}</span>
                        )}
                        {task.duracion_estimada_dias != null && (
                          <span className="text-xs text-muted-foreground">⏱ {task.duracion_estimada_dias}d</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMoveTask(task.id, "up")} disabled={idx === 0}>
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMoveTask(task.id, "down")} disabled={idx === sortedTasks.length - 1}>
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingTaskId(task.id)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se desactivará la tarea "{task.tarea}" de la plantilla.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add task */}
            {addingTask ? (
              <TemplateTaskForm
                onSave={(data) => {
                  const maxOrden = sortedTasks.length > 0 ? Math.max(...sortedTasks.map((t) => t.orden)) : 0;
                  createTaskMutation.mutate({
                    fase: fase.nombre,
                    tarea: data.tarea!,
                    tipo_operacion: tipo,
                    orden: maxOrden + 1,
                    descripcion: data.descripcion ?? undefined,
                    responsable: data.responsable ?? undefined,
                    sistema: data.sistema ?? undefined,
                    duracion_estimada_dias: data.duracion_estimada_dias ?? undefined,
                    es_critica: data.es_critica ?? undefined,
                  });
                }}
                onCancel={() => setAddingTask(false)}
                isPending={createTaskMutation.isPending}
                allFases={allFases}
              />
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                className="flex items-center gap-2 px-4 py-2 w-full text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Añadir tarea
              </button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
