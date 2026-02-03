import { supabase } from "@/integrations/supabase/client";
import type { MandatoActivity, MandatoActivityWithUser, MandatoWithInactivity } from "@/types";

export async function fetchMandatoActivity(mandatoId: string): Promise<MandatoActivityWithUser[]> {
  // First fetch activities
  const { data: activities, error: activitiesError } = await supabase
    .from('mandato_activity')
    .select('*')
    .eq('mandato_id', mandatoId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (activitiesError) throw activitiesError;
  if (!activities || activities.length === 0) return [];

  // Get unique user IDs
  const userIds = [...new Set(activities.map(a => a.created_by).filter(Boolean))];
  
  // Fetch user names
  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('admin_users')
      .select('user_id, full_name')
      .in('user_id', userIds);
    
    if (users) {
      userMap = Object.fromEntries(users.map(u => [u.user_id, u.full_name || 'Usuario']));
    }
  }

  // Merge data
  return activities.map(activity => ({
    ...activity,
    created_by_user: activity.created_by 
      ? { user_id: activity.created_by, full_name: userMap[activity.created_by] || 'Usuario' }
      : null
  })) as MandatoActivityWithUser[];
}

export async function fetchInactiveMandatos(minDays: number = 14): Promise<MandatoWithInactivity[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minDays);

  const { data, error } = await supabase
    .from('mandatos')
    .select(`
      *,
      empresa_principal:empresas!mandatos_empresa_principal_id_fkey(id, nombre)
    `)
    .not('estado', 'in', '("cerrado_ganado","cerrado_perdido","cancelado")')
    .or(`last_activity_at.is.null,last_activity_at.lt.${cutoffDate.toISOString()}`)
    .order('last_activity_at', { ascending: true, nullsFirst: true });

  if (error) throw error;

  return (data || []).map((m: any) => {
    const lastActivity = m.last_activity_at ? new Date(m.last_activity_at) : new Date(m.created_at);
    const diasSinActividad = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...m,
      dias_sin_actividad: diasSinActividad,
    } as MandatoWithInactivity;
  });
}
