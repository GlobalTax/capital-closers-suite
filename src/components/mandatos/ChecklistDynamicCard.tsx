import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ChecklistTaskRow } from "./ChecklistTaskRow";
import { ChecklistTaskDrawer } from "./ChecklistTaskDrawer";
import { ChecklistPhaseCard } from "./ChecklistPhaseCard";
import { ChecklistTimelineView } from "./ChecklistTimelineView";
import { ChecklistTemplateSelector } from "./ChecklistTemplateSelector";
import { WorkstreamSummary } from "./WorkstreamSummary";
import { useChecklistDynamic } from "@/hooks/useChecklistDynamic";
import { updateChecklistTask, deleteChecklistTask } from "@/services/checklist.service";
import { Plus, Download, Copy, List, GanttChart, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { MandatoChecklistTask, MandatoTipo, DDWorkstream } from "@/types";

interface ChecklistDynamicCardProps {
  mandatoId: string;
  mandatoTipo: MandatoTipo;
}

export function ChecklistDynamicCard({ mandatoId, mandatoTipo }: ChecklistDynamicCardProps) {
  const { 
    tasks, 
    fases, 
    progress, 
    overdueTasks,
    loading, 
    totalProgress,
    copyTemplate,
    refetch 
  } = useChecklistDynamic(mandatoId, mandatoTipo);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MandatoChecklistTask | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "timeline">("list");
  const [expandedFase, setExpandedFase] = useState<string | null>(null);
  const [selectedWorkstream, setSelectedWorkstream] = useState<DDWorkstream | 'all'>('all');

  // Filter tasks by selected workstream
  const filteredTasks = useMemo(() => {
    if (selectedWorkstream === 'all') return tasks;
    return tasks.filter(t => (t.workstream || 'other') === selectedWorkstream);
  }, [tasks, selectedWorkstream]);

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

  const getTasksByFase = (faseName: string) => {
    return filteredTasks.filter(t => t.fase === faseName);
  };

  const tipoLabel = mandatoTipo === 'compra' ? 'Buy-Side' : 'Sell-Side';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
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
      <>
        <Card>
          <CardHeader>
            <CardTitle>Checklist M&A - {tipoLabel}</CardTitle>
            <CardDescription>
              Sistema de seguimiento del proceso de {mandatoTipo === 'compra' ? 'adquisición' : 'venta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Copy}
              titulo="No hay tareas en el checklist"
              descripcion={`Copia la plantilla de ${tipoLabel} para comenzar con las tareas estándar del proceso M&A`}
              accionLabel="Ver y copiar plantilla"
              onAccion={() => setTemplateSelectorOpen(true)}
            />
          </CardContent>
        </Card>

        <ChecklistTemplateSelector
          open={templateSelectorOpen}
          onOpenChange={setTemplateSelectorOpen}
          mandatoTipo={mandatoTipo}
          onConfirm={copyTemplate}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Checklist M&A - {tipoLabel}
                <Badge variant="secondary">{tasks.length} tareas</Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span>Progreso total: {totalProgress}%</span>
                {overdueTasks.length > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                    {overdueTasks.length} vencidas
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveView(activeView === "list" ? "timeline" : "list")}
              >
                {activeView === "list" ? (
                  <><GanttChart className="w-4 h-4 mr-2" />Timeline</>
                ) : (
                  <><List className="w-4 h-4 mr-2" />Lista</>
                )}
              </Button>
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

          {/* Global Progress Bar */}
          <div className="mt-4">
            <Progress value={totalProgress} className="h-3" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Workstream Filter */}
          <WorkstreamSummary
            tasks={tasks}
            selectedWorkstream={selectedWorkstream}
            onSelectWorkstream={setSelectedWorkstream}
          />

          {/* Phase Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {fases.map(fase => {
              const faseProgress = progress.find(p => p.fase === fase.nombre) || {
                fase: fase.nombre,
                total: 0,
                completadas: 0,
                enCurso: 0,
                pendientes: 0,
                porcentaje: 0,
              };
              return (
                <ChecklistPhaseCard
                  key={fase.id}
                  fase={fase}
                  progress={faseProgress}
                  isExpanded={expandedFase === fase.nombre}
                  onClick={() => setExpandedFase(expandedFase === fase.nombre ? null : fase.nombre)}
                />
              );
            })}
          </div>

          {/* Overdue Tasks Alert */}
          {overdueTasks.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-medium text-red-700 dark:text-red-400">
                  Tareas vencidas ({overdueTasks.length})
                </h4>
              </div>
              <ul className="space-y-1">
                {overdueTasks.slice(0, 3).map(task => (
                  <li key={task.id} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <span className="truncate flex-1">{task.tarea}</span>
                    <Badge variant="destructive" className="text-xs">
                      {task.dias_vencida}d vencida
                    </Badge>
                    {task.es_critica && (
                      <Badge variant="outline" className="text-xs border-red-300">
                        Crítica
                      </Badge>
                    )}
                  </li>
                ))}
                {overdueTasks.length > 3 && (
                  <li className="text-xs text-red-500">
                    + {overdueTasks.length - 3} tareas más
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Content View */}
          {activeView === "list" ? (
            <Accordion 
              type="multiple" 
              defaultValue={fases.map(f => f.nombre)} 
              className="w-full"
            >
              {fases.map(fase => {
                const tasksInFase = getTasksByFase(fase.nombre);
                const faseProgress = progress.find(p => p.fase === fase.nombre);
                
                return (
                  <AccordionItem key={fase.id} value={fase.nombre}>
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: fase.color }}
                        />
                        <span>{fase.nombre}</span>
                        <span className="text-sm text-muted-foreground font-normal">
                          ({faseProgress?.completadas || 0}/{faseProgress?.total || 0})
                        </span>
                        {(faseProgress?.vencidas || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {faseProgress?.vencidas} vencidas
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {tasksInFase.length === 0 ? (
                          <div className="text-center py-6 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              No hay tareas en esta fase
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              Usa el botón "Agregar Tarea" para crear una manualmente
                            </p>
                          </div>
                        ) : (
                          tasksInFase.map(task => (
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
          ) : (
            <ChecklistTimelineView tasks={tasks} fases={fases} />
          )}
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