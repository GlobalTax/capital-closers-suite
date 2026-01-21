import { supabase } from "@/integrations/supabase/client";
import type { ParsedTask, TaskAIResponse, TaskCreationPayload } from "@/types/taskAI";

const TASK_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/task-ai`;

export async function parseTaskInput(rawText: string): Promise<TaskAIResponse> {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(TASK_AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      raw_text: rawText,
      user_context: {
        role: 'socio', // TODO: Get from current user
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 429) {
      throw new Error('Límite de solicitudes excedido. Inténtalo de nuevo en unos segundos.');
    }
    if (response.status === 402) {
      throw new Error('Créditos agotados. Añade fondos a tu workspace.');
    }
    
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  return response.json();
}

export function mapParsedTaskToTarea(
  task: ParsedTask, 
  sourceText: string,
  userId?: string
): TaskCreationPayload {
  return {
    titulo: task.title,
    descripcion: task.description || undefined,
    estado: 'pendiente',
    prioridad: task.priority,
    fecha_vencimiento: task.due_date || undefined,
    asignado_a: task.assigned_to_id || userId,
    ai_generated: true,
    ai_confidence: 0.85,
    source_text: sourceText,
    creado_por: userId,
    tipo: 'individual' as const,
  };
}

export async function createTasksFromAI(
  tasks: ParsedTask[], 
  sourceText: string,
  targetType: 'tarea' | 'checklist' = 'tarea'
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  const { data: { user } } = await supabase.auth.getUser();

  for (const task of tasks) {
    try {
      if (targetType === 'tarea') {
        const payload = mapParsedTaskToTarea(task, sourceText, user?.id);
        
        const { data, error } = await supabase
          .from('tareas')
          .insert(payload)
          .select()
          .single();

        if (error) {
          errors.push(`Error creando "${task.title}": ${error.message}`);
          continue;
        }

        // Log the AI event - cast payload to any to satisfy Json type
        const eventPayload = {
          original_input: sourceText,
          parsed_task: JSON.parse(JSON.stringify(task)),
          confidence: 0.85,
        };
        
        await supabase.from('task_events').insert({
          task_id: data.id,
          task_type: 'tarea',
          event_type: 'AI_CREATED',
          payload: eventPayload as unknown as Record<string, never>,
          created_by: user?.id,
        });

        created++;
      }
      // TODO: Add checklist support in future phase
    } catch (err) {
      errors.push(`Error inesperado creando "${task.title}"`);
    }
  }

  return { success: errors.length === 0, created, errors };
}

export async function getTaskEvents(taskId: string, taskType: 'tarea' | 'checklist' = 'tarea') {
  const { data, error } = await supabase
    .from('task_events')
    .select('*')
    .eq('task_id', taskId)
    .eq('task_type', taskType)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
