// ============================================
// REPORT TYPES
// ============================================

export interface ReportFilters {
  periodo: 'mes' | 'trimestre' | 'semestre' | 'año' | 'custom';
  fechaInicio?: Date;
  fechaFin?: Date;
  tipoMandato: 'todos' | 'compra' | 'venta';
  estado?: string;
}

export interface ReportKPI {
  id: string;
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
  description?: string;
}

export interface PipelineStageMetrics {
  stage_key: string;
  stage_name: string;
  stage_order: number;
  color: string;
  deal_count: number;
  total_value: number;
  weighted_value: number;
  avg_days_in_stage: number;
  conversion_rate?: number;
}

export interface TimeMetrics {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  hoursByUser: { user_name: string; hours: number; billable: number }[];
  hoursByType: { type: string; hours: number }[];
  hoursByWeek: { week: string; hours: number; billable: number }[];
  hoursByMandato: { mandato_id: string; mandato_nombre: string; hours: number }[];
}

export interface ComparisonMetrics {
  compra: {
    count: number;
    totalValue: number;
    avgValue: number;
    conversionRate: number;
    avgDaysToClose: number;
  };
  venta: {
    count: number;
    totalValue: number;
    avgValue: number;
    conversionRate: number;
    avgDaysToClose: number;
  };
  bySector: { sector: string; compra: number; venta: number }[];
}

export interface AlertMetrics {
  stuckDeals: {
    id: string;
    nombre: string;
    stage: string;
    daysInStage: number;
    valor?: number;
  }[];
  overdueChecklists: {
    id: string;
    tarea: string;
    mandato_nombre: string;
    fecha_limite: string;
    dias_vencida: number;
  }[];
  upcomingClosings: {
    id: string;
    nombre: string;
    expected_close_date: string;
    dias_restantes: number;
    valor?: number;
  }[];
  criticalAlerts: number;
  warningAlerts: number;
}

export interface ReportData {
  kpis: ReportKPI[];
  pipelineMetrics: PipelineStageMetrics[];
  timeMetrics: TimeMetrics;
  comparisonMetrics: ComparisonMetrics;
  alertMetrics: AlertMetrics;
  loading: boolean;
  error?: string;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface FunnelDataPoint {
  stage: string;
  value: number;
  fill: string;
}
