import { supabase } from "@/integrations/supabase/client";
import type { TargetScoring, TargetFunnelStage, TargetPipelineStage, TargetPipelineStats, CriteriosBusqueda } from "@/types";

/**
 * Obtener scoring de un target
 */
export async function getTargetScoring(mandatoEmpresaId: string): Promise<TargetScoring | null> {
  const { data, error } = await supabase
    .from("mandato_empresa_scoring")
    .select("*")
    .eq("mandato_empresa_id", mandatoEmpresaId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Crear o actualizar scoring de un target
 */
export async function upsertTargetScoring(
  mandatoEmpresaId: string,
  scoring: Partial<Omit<TargetScoring, 'id' | 'mandato_empresa_id' | 'score_total' | 'created_at' | 'updated_at'>>
): Promise<TargetScoring> {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("mandato_empresa_scoring")
    .upsert({
      mandato_empresa_id: mandatoEmpresaId,
      fit_estrategico: scoring.fit_estrategico ?? 0,
      fit_financiero: scoring.fit_financiero ?? 0,
      fit_cultural: scoring.fit_cultural ?? 0,
      notas: scoring.notas,
      scored_at: new Date().toISOString(),
      scored_by: user?.user?.id,
    }, {
      onConflict: 'mandato_empresa_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mover target a una etapa del funnel
 */
export async function moveTargetToFunnelStage(
  mandatoEmpresaId: string,
  stage: TargetFunnelStage
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ funnel_stage: stage })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Mover target a una etapa del pipeline
 */
export async function moveTargetToPipelineStage(
  mandatoEmpresaId: string,
  stage: TargetPipelineStage
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      pipeline_stage_target: stage,
      // pipeline_stage_changed_at se actualiza automáticamente con trigger
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Actualizar match score de un target
 */
export async function updateMatchScore(
  mandatoEmpresaId: string,
  score: number
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ match_score: Math.min(100, Math.max(0, score)) })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Calcular match score basado en criterios de búsqueda
 */
export function calculateMatchScore(
  empresa: { 
    sector?: string; 
    facturacion?: number; 
    revenue?: number;
    empleados?: number;
    ebitda?: number;
    margen_ebitda?: number;
  },
  criterios: CriteriosBusqueda
): number {
  let score = 0;
  let factors = 0;

  // Match por sector (40% peso)
  if (criterios.sectores && criterios.sectores.length > 0 && empresa.sector) {
    const sectorMatch = criterios.sectores.some(s => 
      empresa.sector?.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(empresa.sector?.toLowerCase() || '')
    );
    if (sectorMatch) score += 40;
    factors += 40;
  }

  // Match por tamaño (rango inversión = facturación) (30% peso)
  const empresaRevenue = empresa.facturacion || empresa.revenue || 0;
  if (criterios.rango_min !== undefined && criterios.rango_max !== undefined && empresaRevenue > 0) {
    if (empresaRevenue >= criterios.rango_min && empresaRevenue <= criterios.rango_max) {
      score += 30;
    } else if (empresaRevenue >= criterios.rango_min * 0.8 && empresaRevenue <= criterios.rango_max * 1.2) {
      score += 15; // Parcial match
    }
    factors += 30;
  }

  // Match por empleados (15% peso)
  if (criterios.tamano_empleados_min !== undefined && empresa.empleados) {
    if (empresa.empleados >= criterios.tamano_empleados_min && 
        (!criterios.tamano_empleados_max || empresa.empleados <= criterios.tamano_empleados_max)) {
      score += 15;
    }
    factors += 15;
  }

  // Match por EBITDA (15% peso)
  if (criterios.ebitda_min !== undefined && empresa.ebitda) {
    if (empresa.ebitda >= criterios.ebitda_min) {
      score += 15;
    }
    factors += 15;
  }

  // Normalizar a 100
  return factors > 0 ? Math.round((score / factors) * 100) : 0;
}

/**
 * Obtener estadísticas del pipeline de targets para un mandato
 */
export async function getTargetPipelineStats(mandatoId: string): Promise<TargetPipelineStats> {
  const { data: targets, error } = await supabase
    .from("mandato_empresas")
    .select(`
      id,
      funnel_stage,
      pipeline_stage_target,
      match_score
    `)
    .eq("mandato_id", mandatoId)
    .eq("rol", "target");

  if (error) throw error;

  const stats: TargetPipelineStats = {
    total: targets?.length || 0,
    byFunnelStage: {
      long_list: 0,
      short_list: 0,
      finalista: 0,
      descartado: 0,
    },
    byPipelineStage: {
      identificada: 0,
      contactada: 0,
      nda_firmado: 0,
      info_recibida: 0,
      due_diligence: 0,
      oferta: 0,
      cierre: 0,
    },
    averageScore: 0,
    conversionRate: 0,
    totalOfertas: 0,
  };

  if (!targets || targets.length === 0) return stats;

  let totalScore = 0;
  let scoredCount = 0;

  targets.forEach(t => {
    const funnel = (t.funnel_stage as TargetFunnelStage) || 'long_list';
    const pipeline = (t.pipeline_stage_target as TargetPipelineStage) || 'identificada';
    
    stats.byFunnelStage[funnel]++;
    stats.byPipelineStage[pipeline]++;
    
    if (t.match_score) {
      totalScore += t.match_score;
      scoredCount++;
    }
  });

  stats.averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
  
  // Calcular tasa de conversión (targets que avanzan de long_list)
  const advanced = stats.total - stats.byFunnelStage.long_list - stats.byFunnelStage.descartado;
  stats.conversionRate = stats.total > 0 ? Math.round((advanced / stats.total) * 100) : 0;

  // Contar ofertas
  const { count } = await supabase
    .from("target_ofertas")
    .select("*", { count: 'exact', head: true })
    .in("mandato_empresa_id", targets.map(t => t.id));
  
  stats.totalOfertas = count || 0;

  return stats;
}

/**
 * Obtener todos los targets de un mandato con scoring y ofertas
 */
export async function getTargetsWithScoring(mandatoId: string) {
  const { data: targets, error } = await supabase
    .from("mandato_empresas")
    .select(`
      *,
      empresa:empresas(*),
      scoring:mandato_empresa_scoring(*),
      ofertas:target_ofertas(*)
    `)
    .eq("mandato_id", mandatoId)
    .eq("rol", "target")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return targets;
}
