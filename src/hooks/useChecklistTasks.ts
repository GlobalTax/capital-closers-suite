import { useState, useEffect } from "react";
import { fetchChecklistTasks, calculateFaseProgress } from "@/services/checklist";
import type { MandatoChecklistTask, ChecklistFaseProgress } from "@/types";
import { toast } from "@/hooks/use-toast";

export const useChecklistTasks = (mandatoId: string | undefined) => {
  const [tasks, setTasks] = useState<MandatoChecklistTask[]>([]);
  const [progress, setProgress] = useState<ChecklistFaseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    if (!mandatoId) return;
    
    try {
      setLoading(true);
      const data = await fetchChecklistTasks(mandatoId);
      setTasks(data);
      setProgress(calculateFaseProgress(data));
    } catch (error: any) {
      console.error("Error loading checklist tasks:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas del checklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [mandatoId]);

  return { tasks, progress, loading, refetch: loadTasks };
};
