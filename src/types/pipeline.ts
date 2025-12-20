// ============================================
// PIPELINE M&A TYPES
// ============================================

export interface PipelineStage {
  id: string;
  stage_key: string;
  stage_name: string;
  stage_order: number;
  default_probability: number;
  color: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineSummary {
  stage_key: string;
  stage_name: string;
  stage_order: number;
  color: string;
  default_probability: number;
  deal_count: number;
  total_value: number;
  weighted_value: number;
  avg_days_in_stage: number;
}

export interface PipelineMandato {
  id: string;
  tipo: 'compra' | 'venta';
  descripcion?: string;
  estado: string;
  valor?: number;
  pipeline_stage: string;
  probability: number;
  weighted_value?: number;
  days_in_stage: number;
  stage_entered_at?: string;
  last_activity_at?: string;
  expected_close_date?: string;
  empresa_principal?: {
    id: string;
    nombre: string;
    sector: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PipelineMetrics {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  avgDaysToClose: number;
  conversionRate: number;
  dealsByStage: PipelineSummary[];
  stuckDeals: number;
  closingThisMonth: number;
  closingThisQuarter: number;
}

export type PipelineStageKey = 'prospeccion' | 'loi' | 'due_diligence' | 'negociacion' | 'cierre';
