import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchTaskAIEvents, 
  fetchTaskAIStats, 
  saveTaskAIFeedback,
  type TaskAIEventFilters,
  type TaskAIEventWithTasks,
  type TaskAIStats,
} from "@/services/taskAIFeedback.service";
import { toast } from "sonner";

export function useTaskAIEvents(filters: TaskAIEventFilters) {
  return useQuery<TaskAIEventWithTasks[]>({
    queryKey: ['task-ai-events', filters],
    queryFn: () => fetchTaskAIEvents(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTaskAIStats() {
  return useQuery<TaskAIStats>({
    queryKey: ['task-ai-stats'],
    queryFn: fetchTaskAIStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTaskAIFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTaskAIFeedback,
    onSuccess: () => {
      toast.success('Feedback guardado correctamente');
      queryClient.invalidateQueries({ queryKey: ['task-ai-events'] });
      queryClient.invalidateQueries({ queryKey: ['task-ai-stats'] });
    },
    onError: (error) => {
      toast.error('Error al guardar feedback: ' + (error as Error).message);
    },
  });
}
