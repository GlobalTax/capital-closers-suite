import { useMemo } from "react";
import { TimeEntry, MandatoEstado, PipelineStage } from "@/types";

export interface AtRiskMandato {
  mandato_id: string;
  codigo: string;
  descripcion: string;
  total_hours: number;
  probability: number;
  estado: MandatoEstado;
  pipeline_stage?: PipelineStage;
  valor?: number;
  risk_score: number;
}

export interface AtRiskConfig {
  minHoursThreshold: number;
  maxProbability: number;
  excludeStates: MandatoEstado[];
}

const DEFAULT_CONFIG: AtRiskConfig = {
  minHoursThreshold: 30,
  maxProbability: 40,
  excludeStates: ['cerrado', 'cancelado'],
};

export function useAtRiskMandatos(
  entries: TimeEntry[],
  config?: Partial<AtRiskConfig>
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const atRiskMandatos = useMemo(() => {
    if (!entries.length) return [];

    // Aggregate hours by mandato
    const mandatoMap = new Map<string, {
      mandato_id: string;
      codigo: string;
      descripcion: string;
      probability: number;
      estado: MandatoEstado;
      pipeline_stage?: PipelineStage;
      valor?: number;
      total_minutes: number;
    }>();

    entries.forEach(entry => {
      if (!entry.mandato) return;
      
      const mandatoId = entry.mandato_id;
      const existing = mandatoMap.get(mandatoId);
      
      if (existing) {
        existing.total_minutes += entry.duration_minutes;
      } else {
        mandatoMap.set(mandatoId, {
          mandato_id: mandatoId,
          codigo: entry.mandato.codigo || 'Sin código',
          descripcion: entry.mandato.descripcion || '',
          probability: entry.mandato.probability ?? 0,
          estado: entry.mandato.estado as MandatoEstado,
          pipeline_stage: entry.mandato.pipeline_stage as PipelineStage | undefined,
          valor: entry.mandato.valor,
          total_minutes: entry.duration_minutes,
        });
      }
    });

    // Filter and calculate risk score
    const atRisk: AtRiskMandato[] = [];

    mandatoMap.forEach(mandato => {
      const totalHours = mandato.total_minutes / 60;
      const probability = mandato.probability;
      const estado = mandato.estado;

      // Check all risk criteria
      const isOverThreshold = totalHours > finalConfig.minHoursThreshold;
      const isLowProbability = probability < finalConfig.maxProbability;
      const isNotExcluded = !finalConfig.excludeStates.includes(estado);

      if (isOverThreshold && isLowProbability && isNotExcluded) {
        // Risk score: higher hours + lower probability = higher risk
        const riskScore = totalHours * (1 - probability / 100);

        atRisk.push({
          mandato_id: mandato.mandato_id,
          codigo: mandato.codigo,
          descripcion: mandato.descripcion,
          total_hours: totalHours,
          probability: probability,
          estado: mandato.estado,
          pipeline_stage: mandato.pipeline_stage,
          valor: mandato.valor,
          risk_score: riskScore,
        });
      }
    });

    // Sort by risk score descending
    return atRisk.sort((a, b) => b.risk_score - a.risk_score);
  }, [entries, finalConfig.minHoursThreshold, finalConfig.maxProbability, finalConfig.excludeStates]);

  return {
    atRiskMandatos,
    config: finalConfig,
    count: atRiskMandatos.length,
    totalHoursAtRisk: atRiskMandatos.reduce((sum, m) => sum + m.total_hours, 0),
  };
}
