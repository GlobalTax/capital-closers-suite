import { supabase } from "@/integrations/supabase/client";

export interface TaskAIEventFilters {
  dateFrom?: string;
  dateTo?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  searchText?: string;
  hasFeedback?: boolean | null;
}

export interface TaskAIEventWithTasks {
  id: string;
  task_id: string;
  task_type: string;
  event_type: string;
  payload: {
    original_input?: string;
    parsed_task?: {
      title: string;
      description: string;
      priority: string;
      due_date: string | null;
      estimated_minutes: number;
    };
    confidence?: number;
  };
  created_by: string | null;
  created_at: string;
  tarea?: {
    id: string;
    titulo: string;
    estado: string;
    prioridad: string;
  } | null;
  feedback?: {
    id: string;
    is_useful: boolean;
    feedback_text: string | null;
  } | null;
}

export interface TaskAIStats {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  withPositiveFeedback: number;
  withNegativeFeedback: number;
  pendingFeedback: number;
}

// Fetch AI events with their associated tasks
export async function fetchTaskAIEvents(filters: TaskAIEventFilters): Promise<TaskAIEventWithTasks[]> {
  let query = supabase
    .from('task_events')
    .select('*')
    .eq('event_type', 'AI_CREATED')
    .order('created_at', { ascending: false });

  // Apply date filters
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data: events, error } = await query;
  
  if (error) throw error;
  if (!events || events.length === 0) return [];

  // Get task IDs from events
  const taskIds = events.map(e => e.task_id);
  
  // Fetch associated tasks separately
  const { data: tareas } = await supabase
    .from('tareas')
    .select('id, titulo, estado, prioridad')
    .in('id', taskIds);

  // Get feedback for these events
  const eventIds = events.map(e => e.id);
  const { data: feedbacks } = await supabase
    .from('task_ai_feedback')
    .select('id, event_id, is_useful, feedback_text')
    .in('event_id', eventIds);

  // Map tasks and feedback to events
  const result: TaskAIEventWithTasks[] = events.map(event => {
    const tarea = tareas?.find(t => t.id === event.task_id) || null;
    const feedback = feedbacks?.find(f => f.event_id === event.id) || null;
    
    return {
      id: event.id,
      task_id: event.task_id,
      task_type: event.task_type,
      event_type: event.event_type,
      payload: event.payload as TaskAIEventWithTasks['payload'],
      created_by: event.created_by,
      created_at: event.created_at,
      tarea,
      feedback,
    };
  });

  // Apply client-side filters
  let filtered = result;

  // Filter by confidence
  if (filters.confidenceMin !== undefined) {
    filtered = filtered.filter(e => {
      const conf = e.payload?.confidence || 0;
      return conf >= filters.confidenceMin!;
    });
  }
  if (filters.confidenceMax !== undefined) {
    filtered = filtered.filter(e => {
      const conf = e.payload?.confidence || 0;
      return conf <= filters.confidenceMax!;
    });
  }

  // Filter by search text
  if (filters.searchText) {
    const search = filters.searchText.toLowerCase();
    filtered = filtered.filter(e => {
      const input = e.payload?.original_input || '';
      return input.toLowerCase().includes(search);
    });
  }

  // Filter by feedback status
  if (filters.hasFeedback === true) {
    filtered = filtered.filter(e => e.feedback !== null);
  } else if (filters.hasFeedback === false) {
    filtered = filtered.filter(e => e.feedback === null);
  }

  return filtered;
}

// Fetch statistics for AI events
export async function fetchTaskAIStats(): Promise<TaskAIStats> {
  const { data: events, error } = await supabase
    .from('task_events')
    .select('id, payload')
    .eq('event_type', 'AI_CREATED');

  if (error) throw error;

  const eventIds = events?.map(e => e.id) || [];
  
  // Get all feedback
  const { data: feedbacks } = await supabase
    .from('task_ai_feedback')
    .select('event_id, is_useful')
    .in('event_id', eventIds);

  const feedbackMap = new Map(feedbacks?.map(f => [f.event_id, f.is_useful]) || []);

  const stats: TaskAIStats = {
    total: events?.length || 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    withPositiveFeedback: 0,
    withNegativeFeedback: 0,
    pendingFeedback: 0,
  };

  events?.forEach(event => {
    const payload = event.payload as { confidence?: number };
    const confidence = payload?.confidence || 0;

    if (confidence >= 0.8) stats.highConfidence++;
    else if (confidence >= 0.6) stats.mediumConfidence++;
    else stats.lowConfidence++;

    if (feedbackMap.has(event.id)) {
      if (feedbackMap.get(event.id)) stats.withPositiveFeedback++;
      else stats.withNegativeFeedback++;
    } else {
      stats.pendingFeedback++;
    }
  });

  return stats;
}

// Save feedback for an AI event
export async function saveTaskAIFeedback(params: {
  eventId: string;
  taskId: string;
  isUseful: boolean;
  feedbackText?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuario no autenticado');

  // Check if feedback already exists
  const { data: existing } = await supabase
    .from('task_ai_feedback')
    .select('id')
    .eq('event_id', params.eventId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Update existing feedback
    const { error } = await supabase
      .from('task_ai_feedback')
      .update({
        is_useful: params.isUseful,
        feedback_text: params.feedbackText || null,
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Insert new feedback
    const { error } = await supabase
      .from('task_ai_feedback')
      .insert({
        event_id: params.eventId,
        task_id: params.taskId,
        is_useful: params.isUseful,
        feedback_text: params.feedbackText || null,
        user_id: user.id,
      });

    if (error) throw error;
  }
}
