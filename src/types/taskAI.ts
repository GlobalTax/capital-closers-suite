// Types for Task AI System

export interface ParsedTask {
  title: string;
  description: string;
  priority: 'urgente' | 'alta' | 'media' | 'baja';
  due_date: string | null;
  assigned_to_name: string | null;
  assigned_to_id: string | null;
  context_type: 'mandato' | 'cliente' | 'general';
  context_hint: string | null;
  estimated_minutes: number;
  suggested_fase: string | null;
}

export interface TaskAIResponse {
  success: boolean;
  tasks: ParsedTask[];
  reasoning: string;
  team_members: TeamMember[];
  error?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  skills: string[];
}

export interface TaskEvent {
  id: string;
  task_id: string;
  task_type: 'tarea' | 'checklist';
  event_type: 'AI_CREATED' | 'AI_SPLIT' | 'AI_REASSIGNED' | 'AI_REPRIORITIZED' | 'MANUAL_EDIT' | 'STATUS_CHANGE';
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface TaskCreationPayload {
  titulo: string;
  descripcion?: string;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  prioridad: 'urgente' | 'alta' | 'media' | 'baja';
  fecha_vencimiento?: string;
  asignado_a?: string;
  ai_generated: boolean;
  ai_confidence?: number;
  source_text?: string;
}
