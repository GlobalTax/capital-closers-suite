import { supabase } from "@/integrations/supabase/client";
import type { PipelineStage, PipelineSummary, PipelineMandato, PipelineMetrics } from "@/types/pipeline";
import { DatabaseError } from "@/lib/error-handler";

/**
 * Obtener todas las fases del pipeline
 */
export const fetchPipelineStages = async (): Promise<PipelineStage[]> => {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('is_active', true)
    .order('stage_order');

  if (error) {
    throw new DatabaseError('Error al obtener fases del pipeline', { supabaseError: error });
  }

  return data || [];
};

/**
 * Obtener resumen del pipeline por fases
 */
export const fetchPipelineSummary = async (): Promise<PipelineSummary[]> => {
  const { data, error } = await supabase
    .from('v_pipeline_summary')
    .select('*')
    .order('stage_order');

  if (error) {
    throw new DatabaseError('Error al obtener resumen del pipeline', { supabaseError: error });
  }

  return (data || []) as PipelineSummary[];
};

/**
 * Obtener mandatos con información de pipeline
 */
export const fetchPipelineMandatos = async (tipo?: 'compra' | 'venta'): Promise<PipelineMandato[]> => {
  let query = supabase
    .from('mandatos')
    .select(`
      id,
      tipo,
      descripcion,
      estado,
      valor,
      pipeline_stage,
      probability,
      weighted_value,
      days_in_stage,
      stage_entered_at,
      last_activity_at,
      expected_close_date,
      created_at,
      updated_at,
      empresa_principal:empresas(id, nombre, sector)
    `)
    .neq('estado', 'cancelado')
    .order('valor', { ascending: false, nullsFirst: false });

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError('Error al obtener mandatos del pipeline', { supabaseError: error });
  }

  return (data || []) as PipelineMandato[];
};

/**
 * Actualizar el stage de un mandato en el pipeline
 */
export const updateMandatoPipelineStage = async (
  mandatoId: string,
  newStage: string,
  probability?: number
): Promise<void> => {
  const updates: Record<string, any> = {
    pipeline_stage: newStage,
    stage_entered_at: new Date().toISOString(),
    days_in_stage: 0,
    last_activity_at: new Date().toISOString(),
  };

  if (probability !== undefined) {
    updates.probability = probability;
  }

  const { error } = await supabase
    .from('mandatos')
    .update(updates)
    .eq('id', mandatoId);

  if (error) {
    throw new DatabaseError('Error al actualizar fase del mandato', { supabaseError: error });
  }
};

/**
 * Calcular métricas del pipeline
 */
export const calculatePipelineMetrics = async (tipo?: 'compra' | 'venta'): Promise<PipelineMetrics> => {
  const [summaryData, mandatosData] = await Promise.all([
    fetchPipelineSummary(),
    fetchPipelineMandatos(tipo),
  ]);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

  const totalDeals = mandatosData.length;
  const totalValue = mandatosData.reduce((sum, m) => sum + (m.valor || 0), 0);
  const weightedValue = mandatosData.reduce((sum, m) => sum + (m.weighted_value || 0), 0);

  // Deals cerrando este mes/trimestre
  const closingThisMonth = mandatosData.filter(m => {
    if (!m.expected_close_date) return false;
    const closeDate = new Date(m.expected_close_date);
    return closeDate <= endOfMonth;
  }).length;

  const closingThisQuarter = mandatosData.filter(m => {
    if (!m.expected_close_date) return false;
    const closeDate = new Date(m.expected_close_date);
    return closeDate <= endOfQuarter;
  }).length;

  // Deals estancados (más de 30 días sin actividad)
  const stuckDeals = mandatosData.filter(m => {
    if (!m.last_activity_at) return false;
    const lastActivity = new Date(m.last_activity_at);
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceActivity > 30;
  }).length;

  // Calcular tasa de conversión (cerrados / total histórico)
  const closedDeals = summaryData.find(s => s.stage_key === 'cierre')?.deal_count || 0;
  const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0;

  // Promedio de días hasta cierre
  const closedMandatos = mandatosData.filter(m => m.pipeline_stage === 'cierre');
  const avgDaysToClose = closedMandatos.length > 0
    ? closedMandatos.reduce((sum, m) => sum + (m.days_in_stage || 0), 0) / closedMandatos.length
    : 0;

  return {
    totalDeals,
    totalValue,
    weightedValue,
    avgDaysToClose,
    conversionRate,
    dealsByStage: summaryData,
    stuckDeals,
    closingThisMonth,
    closingThisQuarter,
  };
};
