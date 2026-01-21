import { useQuery } from "@tanstack/react-query";
import { getTaskEvents } from "@/services/taskAI.service";

// Match database schema
interface TaskEventRow {
  id: string;
  task_id: string;
  task_type: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export function useTaskEvents(taskId: string | undefined, taskType: 'tarea' | 'checklist' = 'tarea') {
  return useQuery<TaskEventRow[]>({
    queryKey: ['task-events', taskId, taskType],
    queryFn: async () => {
      const data = await getTaskEvents(taskId!, taskType);
      return data as TaskEventRow[];
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });
}
