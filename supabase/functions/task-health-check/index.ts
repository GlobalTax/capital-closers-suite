// Task Health Check Edge Function for Phase 4
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthIssue {
  task_id: string;
  task_title: string;
  issue_type: 'overdue' | 'stalled' | 'blocked' | 'orphan' | 'overloaded';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  assigned_to?: string;
  days_since_activity?: number;
  days_overdue?: number;
}

interface HealthCheckResult {
  success: boolean;
  issues: HealthIssue[];
  summary: {
    total_tasks: number;
    healthy: number;
    at_risk: number;
    overdue: number;
    blocked: number;
  };
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, scope = 'user' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query based on scope
    let query = supabase
      .from('tareas')
      .select('id, titulo, descripcion, prioridad, fecha_vencimiento, estado, asignado_a, created_by, created_at, updated_at, last_activity_at, health_status')
      .neq('estado', 'completada');

    if (scope === 'user' && user_id) {
      query = query.or(`asignado_a.eq.${user_id},created_by.eq.${user_id}`);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) throw tasksError;

    const today = new Date();
    const issues: HealthIssue[] = [];

    // Analyze each task
    for (const task of tasks || []) {
      const lastActivity = task.last_activity_at ? new Date(task.last_activity_at) : new Date(task.updated_at);
      const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      // Check for overdue
      if (task.fecha_vencimiento) {
        const dueDate = new Date(task.fecha_vencimiento);
        if (dueDate < today) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          issues.push({
            task_id: task.id,
            task_title: task.titulo,
            issue_type: 'overdue',
            severity: daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low',
            description: `Vencida hace ${daysOverdue} días`,
            suggestion: daysOverdue > 7 
              ? 'Considera reasignar o cancelar esta tarea'
              : 'Prioriza completar esta tarea hoy',
            assigned_to: task.asignado_a,
            days_overdue: daysOverdue
          });
        }
      }

      // Check for stalled (no activity in 7+ days)
      if (daysSinceActivity >= 7 && task.estado !== 'completada') {
        issues.push({
          task_id: task.id,
          task_title: task.titulo,
          issue_type: 'stalled',
          severity: daysSinceActivity > 14 ? 'high' : 'medium',
          description: `Sin actividad desde hace ${daysSinceActivity} días`,
          suggestion: 'Actualiza el estado o añade un comentario de progreso',
          assigned_to: task.asignado_a,
          days_since_activity: daysSinceActivity
        });
      }

      // Check for orphan (no assignee)
      if (!task.asignado_a && task.estado !== 'completada') {
        issues.push({
          task_id: task.id,
          task_title: task.titulo,
          issue_type: 'orphan',
          severity: 'medium',
          description: 'Tarea sin responsable asignado',
          suggestion: 'Asigna un responsable para dar seguimiento'
        });
      }
    }

    // Get team members for overload check
    if (scope === 'team') {
      const { data: teamTasks } = await supabase
        .from('tareas')
        .select('asignado_a')
        .neq('estado', 'completada');

      const taskCounts: Record<string, number> = {};
      for (const t of teamTasks || []) {
        if (t.asignado_a) {
          taskCounts[t.asignado_a] = (taskCounts[t.asignado_a] || 0) + 1;
        }
      }

      // Check for overloaded users (more than 10 pending tasks)
      for (const [userId, count] of Object.entries(taskCounts)) {
        if (count > 10) {
          issues.push({
            task_id: userId,
            task_title: `Usuario con ${count} tareas`,
            issue_type: 'overloaded',
            severity: count > 15 ? 'high' : 'medium',
            description: `Este usuario tiene ${count} tareas pendientes`,
            suggestion: 'Considera redistribuir algunas tareas',
            assigned_to: userId
          });
        }
      }
    }

    // Calculate summary
    const summary = {
      total_tasks: tasks?.length || 0,
      healthy: (tasks || []).filter(t => t.health_status === 'healthy').length,
      at_risk: (tasks || []).filter(t => t.health_status === 'at_risk').length,
      overdue: issues.filter(i => i.issue_type === 'overdue').length,
      blocked: issues.filter(i => i.issue_type === 'blocked').length
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (summary.overdue > 0) {
      recommendations.push(`Tienes ${summary.overdue} tareas vencidas. Revísalas primero.`);
    }
    if (summary.at_risk > 3) {
      recommendations.push('Varias tareas están estancadas. Considera hacer una revisión semanal.');
    }
    if (issues.filter(i => i.issue_type === 'orphan').length > 0) {
      recommendations.push('Hay tareas sin asignar. Distribúyelas entre el equipo.');
    }

    // Update health status in database
    for (const issue of issues) {
      if (issue.issue_type === 'overdue') {
        await supabase
          .from('tareas')
          .update({ health_status: 'overdue' })
          .eq('id', issue.task_id);
      } else if (issue.issue_type === 'stalled') {
        await supabase
          .from('tareas')
          .update({ health_status: 'at_risk' })
          .eq('id', issue.task_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        issues: issues.sort((a, b) => {
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        summary,
        recommendations,
        checked_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
