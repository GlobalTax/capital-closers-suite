// ============================================
// HOOK: usePipelineGates - Validación de gates de pipeline
// ============================================

import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  validateStageTransition, 
  type PipelineStage, 
  type GateCheckData,
  type GateValidationResult 
} from "@/lib/pipeline-gates";
import type { Mandato, Documento, MandatoChecklistTask, ChecklistFaseProgress, OverdueTask } from "@/types";

interface UsePipelineGatesProps {
  mandato: Mandato | null | undefined;
}

export function usePipelineGates({ mandato }: UsePipelineGatesProps) {
  const mandatoId = mandato?.id;

  // Fetch documentos del mandato
  const { data: documentos = [] } = useQuery({
    queryKey: ['mandato-documentos-gates', mandatoId],
    queryFn: async () => {
      if (!mandatoId) return [];
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('mandato_id', mandatoId);
      if (error) throw error;
      return data as Documento[];
    },
    enabled: !!mandatoId,
    staleTime: 30000,
  });

  // Fetch checklist tasks
  const { data: checklistTasks = [] } = useQuery({
    queryKey: ['mandato-checklist-gates', mandatoId],
    queryFn: async () => {
      if (!mandatoId) return [];
      const { data, error } = await supabase
        .from('mandato_checklist_tasks')
        .select('*')
        .eq('mandato_id', mandatoId);
      if (error) throw error;
      return data as MandatoChecklistTask[];
    },
    enabled: !!mandatoId,
    staleTime: 30000,
  });

  // Calcular progreso por fase
  const checklistProgress = useMemo((): ChecklistFaseProgress[] => {
    if (!checklistTasks.length) return [];
    
    const faseMap = new Map<string, { total: number; completadas: number; enCurso: number; pendientes: number; vencidas: number }>();
    const now = new Date();

    checklistTasks.forEach(task => {
      if (!faseMap.has(task.fase)) {
        faseMap.set(task.fase, { total: 0, completadas: 0, enCurso: 0, pendientes: 0, vencidas: 0 });
      }
      const stats = faseMap.get(task.fase)!;
      stats.total++;
      
      if (task.estado === '✅ Completa') {
        stats.completadas++;
      } else if (task.estado === '🔄 En curso') {
        stats.enCurso++;
      } else {
        stats.pendientes++;
      }

      // Check si está vencida
      if (task.fecha_limite && new Date(task.fecha_limite) < now && task.estado !== '✅ Completa') {
        stats.vencidas++;
      }
    });

    return Array.from(faseMap.entries()).map(([fase, stats]) => ({
      fase,
      ...stats,
      porcentaje: stats.total > 0 ? Math.round((stats.completadas / stats.total) * 100) : 0,
    }));
  }, [checklistTasks]);

  // Calcular tareas vencidas
  const overdueTasks = useMemo((): OverdueTask[] => {
    const now = new Date();
    return checklistTasks
      .filter(task => {
        if (!task.fecha_limite || task.estado === '✅ Completa') return false;
        return new Date(task.fecha_limite) < now;
      })
      .map(task => ({
        id: task.id,
        tarea: task.tarea,
        fase: task.fase,
        fecha_limite: task.fecha_limite!,
        es_critica: task.es_critica || false,
        dias_vencida: Math.ceil((now.getTime() - new Date(task.fecha_limite!).getTime()) / (1000 * 60 * 60 * 24)),
      }));
  }, [checklistTasks]);

  // Calcular progreso total
  const totalProgress = useMemo(() => {
    if (!checklistTasks.length) return 0;
    const completadas = checklistTasks.filter(t => t.estado === '✅ Completa').length;
    return Math.round((completadas / checklistTasks.length) * 100);
  }, [checklistTasks]);

  // Función de validación
  const validateTransition = useCallback((
    currentStage: PipelineStage,
    targetStage: PipelineStage
  ): GateValidationResult => {
    if (!mandato) {
      return { canProceed: true, failedRequirements: [] };
    }

    const gateData: GateCheckData = {
      mandato,
      documentos,
      checklistTasks,
      checklistProgress,
      overdueTasks,
      totalProgress,
    };

    return validateStageTransition(currentStage, targetStage, gateData);
  }, [mandato, documentos, checklistTasks, checklistProgress, overdueTasks, totalProgress]);

  return {
    validateTransition,
    documentos,
    checklistTasks,
    checklistProgress,
    overdueTasks,
    totalProgress,
    isReady: !!mandato,
  };
}
