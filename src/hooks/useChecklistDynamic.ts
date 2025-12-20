import { useState, useEffect, useCallback } from "react";
import { 
  fetchFasesByType,
  fetchChecklistTasksExtended,
  fetchDetailedProgress,
  fetchOverdueTasks,
  copyTemplateByType,
  calculateDynamicProgress 
} from "@/services/checklistDynamic.service";
import type { 
  MandatoChecklistTask, 
  ChecklistFaseProgress, 
  ChecklistFaseConfig,
  OverdueTask,
  MandatoTipo 
} from "@/types";
import { toast } from "@/hooks/use-toast";

interface UseChecklistDynamicReturn {
  tasks: MandatoChecklistTask[];
  fases: ChecklistFaseConfig[];
  progress: ChecklistFaseProgress[];
  overdueTasks: OverdueTask[];
  loading: boolean;
  totalProgress: number;
  copyTemplate: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useChecklistDynamic(
  mandatoId: string | undefined,
  mandatoTipo: MandatoTipo
): UseChecklistDynamicReturn {
  const [tasks, setTasks] = useState<MandatoChecklistTask[]>([]);
  const [fases, setFases] = useState<ChecklistFaseConfig[]>([]);
  const [progress, setProgress] = useState<ChecklistFaseProgress[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!mandatoId) return;

    try {
      setLoading(true);
      
      // Fetch fases and tasks in parallel
      const [fasesData, tasksData] = await Promise.all([
        fetchFasesByType(mandatoTipo),
        fetchChecklistTasksExtended(mandatoId),
      ]);
      
      setFases(fasesData);
      setTasks(tasksData);

      // Try to get progress from RPC, fallback to local calculation
      let progressData: ChecklistFaseProgress[];
      try {
        progressData = await fetchDetailedProgress(mandatoId);
        if (progressData.length === 0) {
          progressData = calculateDynamicProgress(tasksData, fasesData);
        }
      } catch {
        progressData = calculateDynamicProgress(tasksData, fasesData);
      }
      setProgress(progressData);

      // Get overdue tasks
      try {
        const overdueData = await fetchOverdueTasks(mandatoId);
        setOverdueTasks(overdueData);
      } catch {
        // Calculate locally if RPC fails
        const localOverdue = tasksData
          .filter(t => 
            t.fecha_limite && 
            new Date(t.fecha_limite) < new Date() && 
            t.estado !== "✅ Completa"
          )
          .map(t => ({
            id: t.id,
            tarea: t.tarea,
            fase: t.fase,
            fecha_limite: t.fecha_limite!,
            es_critica: t.es_critica || false,
            dias_vencida: Math.floor((Date.now() - new Date(t.fecha_limite!).getTime()) / (1000 * 60 * 60 * 24)),
          }));
        setOverdueTasks(localOverdue);
      }
    } catch (error: any) {
      console.error("Error loading checklist:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el checklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [mandatoId, mandatoTipo]);

  const copyTemplate = useCallback(async () => {
    if (!mandatoId) return;

    try {
      const count = await copyTemplateByType(mandatoId, mandatoTipo);
      toast({
        title: "Checklist creado",
        description: `Se copiaron ${count} tareas de la plantilla de ${mandatoTipo}`,
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo copiar la plantilla",
        variant: "destructive",
      });
    }
  }, [mandatoId, mandatoTipo, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalProgress = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + (p.porcentaje || 0), 0) / progress.length)
    : 0;

  return {
    tasks,
    fases,
    progress,
    overdueTasks,
    loading,
    totalProgress,
    copyTemplate,
    refetch: loadData,
  };
}