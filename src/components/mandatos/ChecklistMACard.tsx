import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Copy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChecklistProgressBar } from "./ChecklistProgressBar";
import { ChecklistTaskRow } from "./ChecklistTaskRow";
import { ChecklistTaskDrawer } from "./ChecklistTaskDrawer";
import { useChecklistTasks } from "@/hooks/useChecklistTasks";
import type { MandatoChecklistTask, ChecklistFase } from "@/types";
import { updateChecklistTask, deleteChecklistTask, copyTemplateToMandato } from "@/services/checklist";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface ChecklistMACardProps {
  mandatoId: string;
  mandatoTipo: "compra" | "venta";
  loading?: boolean;
}

export function ChecklistMACard({ mandatoId, mandatoTipo }: ChecklistMACardProps) {
  const { tasks, progress, loading, refetch } = useChecklistTasks(mandatoId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MandatoChecklistTask | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Solo mostrar checklist para mandatos de compra
  if (mandatoTipo !== "compra") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist M&A</CardTitle>
          <CardDescription>
            El checklist M&A está disponible solo para mandatos de compra
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleCopyTemplate = async () => {
    setLoadingAction(true);
    try {
      await copyTemplateToMandato(mandatoId);
      toast({
        title: "Checklist creado",
        description: "Se han copiado todas las tareas de la plantilla",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo copiar la plantilla",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: MandatoChecklistTask["estado"]) => {
    try {
      await updateChecklistTask(taskId, { estado: newStatus });
      toast({
        title: "Estado actualizado",
        description: "El estado de la tarea se actualizó correctamente",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (task: MandatoChecklistTask) => {
    setEditingTask(task);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      await deleteChecklistTask(taskToDelete);
      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setDrawerOpen(true);
  };

  const getTasksByFase = (fase: ChecklistFase) => {
    return tasks.filter((t) => t.fase === fase);
  };

  const totalProgress = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + p.porcentaje, 0) / progress.length)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist M&A - Capittal Transacciones</CardTitle>
          <CardDescription>
            Sistema de seguimiento de tareas del proceso M&A
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Copy}
            titulo="No hay tareas en el checklist"
            descripcion="Copia la plantilla predefinida para comenzar con las 32 tareas estándar del proceso M&A"
            accionLabel={loadingAction ? "Copiando..." : "Copiar plantilla de checklist"}
            onAccion={handleCopyTemplate}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Checklist M&A - Capittal Transacciones</CardTitle>
              <CardDescription>
                Progreso total: {totalProgress}% completado
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleNewTask} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva tarea
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barras de progreso por fase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            {progress.map((p) => (
              <ChecklistProgressBar key={p.fase} progress={p} />
            ))}
          </div>

          {/* Tareas agrupadas por fase */}
          <Accordion type="multiple" defaultValue={["1. Preparación", "2. Marketing", "3. Ofertas"]} className="w-full">
            {progress.map((p) => {
              const tasksInFase = getTasksByFase(p.fase);
              return (
                <AccordionItem key={p.fase} value={p.fase}>
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <span>{p.fase}</span>
                      <span className="text-sm text-muted-foreground">
                        ({p.completadas}/{p.total})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {tasksInFase.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay tareas en esta fase
                        </p>
                      ) : (
                        tasksInFase.map((task) => (
                          <ChecklistTaskRow
                            key={task.id}
                            task={task}
                            onEdit={handleEdit}
                            onDelete={confirmDelete}
                            onStatusChange={handleStatusChange}
                          />
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <ChecklistTaskDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        mandatoId={mandatoId}
        task={editingTask}
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirmar={handleDelete}
        titulo="¿Eliminar tarea?"
        descripcion="Esta acción no se puede deshacer. La tarea será eliminada permanentemente del checklist."
        variant="destructive"
      />
    </>
  );
}
