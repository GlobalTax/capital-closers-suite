import { supabase } from "@/integrations/supabase/client";
import type { ActiveAlert, AlertStats } from "@/types/alerts";
import { DatabaseError } from "@/lib/error-handler";

/**
 * Generar alertas automáticas ejecutando la función de BD
 */
export const generateAlerts = async (): Promise<void> => {
  const { error } = await supabase.rpc('generate_mandato_alerts');
  
  if (error) {
    throw new DatabaseError('Error al generar alertas', { supabaseError: error });
  }
};

/**
 * Obtener alertas activas
 */
export const fetchActiveAlerts = async (): Promise<ActiveAlert[]> => {
  const { data, error } = await supabase
    .from('v_active_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new DatabaseError('Error al obtener alertas', { supabaseError: error });
  }

  return (data || []) as ActiveAlert[];
};

/**
 * Obtener estadísticas de alertas
 */
export const fetchAlertStats = async (): Promise<AlertStats> => {
  const { data, error } = await supabase
    .from('mandato_alerts')
    .select('severity, is_read')
    .eq('is_dismissed', false);

  if (error) {
    throw new DatabaseError('Error al obtener estadísticas', { supabaseError: error });
  }

  const alerts = data || [];
  
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    unread: alerts.filter(a => !a.is_read).length,
  };
};

/**
 * Marcar alerta como leída
 */
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  const { error } = await supabase
    .from('mandato_alerts')
    .update({ is_read: true })
    .eq('id', alertId);

  if (error) {
    throw new DatabaseError('Error al marcar alerta', { supabaseError: error });
  }
};

/**
 * Descartar alerta
 */
export const dismissAlert = async (alertId: string): Promise<void> => {
  const { error } = await supabase
    .from('mandato_alerts')
    .update({ is_dismissed: true })
    .eq('id', alertId);

  if (error) {
    throw new DatabaseError('Error al descartar alerta', { supabaseError: error });
  }
};

/**
 * Marcar todas como leídas
 */
export const markAllAlertsAsRead = async (): Promise<void> => {
  const { error } = await supabase
    .from('mandato_alerts')
    .update({ is_read: true })
    .eq('is_dismissed', false)
    .eq('is_read', false);

  if (error) {
    throw new DatabaseError('Error al marcar alertas', { supabaseError: error });
  }
};

/**
 * Descartar todas las alertas leídas
 */
export const dismissAllReadAlerts = async (): Promise<void> => {
  const { error } = await supabase
    .from('mandato_alerts')
    .update({ is_dismissed: true })
    .eq('is_read', true)
    .eq('is_dismissed', false);

  if (error) {
    throw new DatabaseError('Error al descartar alertas', { supabaseError: error });
  }
};
