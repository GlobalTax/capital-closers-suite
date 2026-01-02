import { supabase } from "@/integrations/supabase/client";
import type { MandatoActivity, MandatoWithInactivity } from "@/types";

export async function fetchMandatoActivity(mandatoId: string): Promise<MandatoActivity[]> {
  const { data, error } = await supabase
    .from('mandato_activity')
    .select('*')
    .eq('mandato_id', mandatoId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as MandatoActivity[];
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
