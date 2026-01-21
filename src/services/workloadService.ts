// Workload Service for Phase 2 - Smart Assignment
import { supabase } from "@/integrations/supabase/client";

export interface UserWorkload {
  user_id: string;
  name: string;
  role: string;
  skills: string[];
  daily_capacity: number;
  hours_this_week: number;
  pending_tasks: number;
  availability_score: number;
}

export interface AssignmentSuggestion {
  assigned_to_id: string;
  assigned_to_name: string;
  confidence: number;
  reason: string;
}

/**
 * Get team workload for smart task assignment
 */
export async function getTeamWorkload(): Promise<UserWorkload[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get active team members
  const { data: teamMembers, error: teamError } = await supabase
    .from('admin_users')
    .select('user_id, full_name, role, skills, daily_capacity_hours, is_active')
    .eq('is_active', true);

  if (teamError) {
    console.error('Error fetching team:', teamError);
    return [];
  }

  // Get time entries for the last 7 days
  const { data: timeEntries } = await supabase
    .from('mandato_time_entries')
    .select('user_id, duration_minutes')
    .gte('created_at', sevenDaysAgo.toISOString());

  // Get pending tasks count per user
  const { data: tasks } = await supabase
    .from('tareas')
    .select('asignado_a')
    .neq('estado', 'completada');

  // Calculate workload per user
  const workloads: UserWorkload[] = (teamMembers || []).map(member => {
    const userTimeEntries = (timeEntries || []).filter((t: any) => t.user_id === member.user_id);
    const hoursThisWeek = userTimeEntries.reduce((sum: number, t: any) => sum + ((t.duration_minutes || 0) / 60), 0);
    
    const pendingTasks = (tasks || []).filter(t => t.asignado_a === member.user_id).length;
    
    const dailyCapacity = member.daily_capacity_hours || 8;
    const weeklyCapacity = dailyCapacity * 5;
    
    // Score: higher is more available (max 100)
    const hoursScore = Math.max(0, 100 - (hoursThisWeek / weeklyCapacity) * 100);
    const tasksScore = Math.max(0, 100 - pendingTasks * 10);
    const availabilityScore = (hoursScore * 0.6 + tasksScore * 0.4);

    return {
      user_id: member.user_id,
      name: member.full_name || 'Unknown',
      role: member.role || 'member',
      skills: member.skills || [],
      daily_capacity: dailyCapacity,
      hours_this_week: hoursThisWeek,
      pending_tasks: pendingTasks,
      availability_score: Math.round(availabilityScore)
    };
  });

  // Sort by availability (most available first)
  return workloads.sort((a, b) => b.availability_score - a.availability_score);
}

/**
 * Suggest best assignee based on task context and team workload
 */
export function suggestAssignee(
  contextType: string,
  contextHint: string | null,
  workloads: UserWorkload[]
): AssignmentSuggestion | null {
  if (workloads.length === 0) return null;

  // Skill mapping for context types
  const contextSkillMap: Record<string, string[]> = {
    mandato: ['M&A', 'Análisis', 'Due Diligence'],
    legal: ['Legal', 'Contratos', 'Compliance'],
    fiscal: ['Fiscal', 'Tributario', 'Contabilidad'],
    marketing: ['Marketing', 'Comunicación', 'Diseño'],
    cliente: ['Comercial', 'Relaciones', 'Ventas'],
  };

  const preferredSkills = contextSkillMap[contextType] || [];

  // Score each user based on skills match and availability
  const scored = workloads.map(user => {
    let skillScore = 0;
    
    // Check for skill matches
    for (const skill of preferredSkills) {
      if (user.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
        skillScore += 20;
      }
    }

    // Role-based bonuses
    if (contextType === 'mandato') {
      if (user.role === 'direccion_ma' || user.role === 'socio') skillScore += 15;
      if (user.role === 'analista') skillScore += 10;
    }

    // Combine with availability
    const totalScore = (skillScore * 0.4) + (user.availability_score * 0.6);

    return { user, totalScore, skillScore };
  });

  // Sort by total score
  scored.sort((a, b) => b.totalScore - a.totalScore);
  const best = scored[0];

  if (!best) return null;

  // Calculate confidence (0-1)
  const confidence = Math.min(1, best.totalScore / 100);

  // Generate reason
  let reason = '';
  if (best.skillScore > 0) {
    reason = `Skills matching: ${preferredSkills.slice(0, 2).join(', ')}. `;
  }
  reason += `Disponibilidad: ${best.user.availability_score}%. `;
  reason += `Carga actual: ${best.user.hours_this_week}h/semana, ${best.user.pending_tasks} tareas pendientes.`;

  return {
    assigned_to_id: best.user.user_id,
    assigned_to_name: best.user.name,
    confidence,
    reason
  };
}
