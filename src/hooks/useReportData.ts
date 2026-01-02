import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, startOfYear, endOfYear } from 'date-fns';

// Interfaces
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
}

export interface TimeMetrics {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  hoursByUser?: { user_name: string; hours: number; billable: number }[];
  hoursByType: { type: string; hours: number }[];
  hoursByWeek: { week: string; hours: number; billable: number }[];
  hoursByMandato?: { mandato_id: string; mandato_nombre: string; hours: number }[];
}

export interface ComparisonMetrics {
  compra: {
    count: number;
    totalValue: number;
    avgValue: number;
    conversionRate: number;
    avgDaysToClose?: number;
  };
  venta: {
    count: number;
    totalValue: number;
    avgValue: number;
    conversionRate: number;
    avgDaysToClose?: number;
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
    fecha_limite: string;
    mandato_id: string;
  }[];
  upcomingClosings: {
    id: string;
    nombre: string;
    expected_close_date: string;
    valor?: number;
    daysUntilClose: number;
  }[];
  criticalAlerts: number;
  warningAlerts: number;
}

// Default filters
const defaultFilters: ReportFilters = {
  periodo: 'trimestre',
  tipoMandato: 'todos',
};

// Helper functions
function getDateRangeFromPeriod(periodo: ReportFilters['periodo']): { start: Date; end: Date } {
  const now = new Date();
  switch (periodo) {
    case 'mes':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'trimestre':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'semestre':
      return { start: subMonths(startOfMonth(now), 5), end: endOfMonth(now) };
    case 'año':
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return { start: subMonths(now, 3), end: now };
  }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value}`;
}

export function useReportData() {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [kpis, setKpis] = useState<ReportKPI[]>([]);
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineStageMetrics[]>([]);
  const [timeMetrics, setTimeMetrics] = useState<TimeMetrics | null>(null);
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetrics | null>(null);
  const [alertMetrics, setAlertMetrics] = useState<AlertMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dateRange = filters.periodo === 'custom' && filters.fechaInicio && filters.fechaFin
        ? { start: filters.fechaInicio, end: filters.fechaFin }
        : getDateRangeFromPeriod(filters.periodo);

      // Una sola llamada RPC que devuelve todo agregado desde el servidor
      const { data: rpcData, error: rpcError } = await supabase.rpc('report_metrics', {
        filters: {
          fecha_inicio: dateRange.start.toISOString(),
          fecha_fin: dateRange.end.toISOString(),
          tipo_mandato: filters.tipoMandato
        }
      });

      if (rpcError) throw rpcError;

      if (!rpcData) {
        throw new Error('No data returned from report_metrics');
      }

      // Cast del resultado JSONB a objeto tipado
      const data = rpcData as unknown as {
        kpis: ReportKPI[];
        pipelineMetrics: PipelineStageMetrics[];
        timeMetrics: TimeMetrics;
        comparisonMetrics: ComparisonMetrics;
        alertMetrics: AlertMetrics;
      };

      // Formatear KPIs con currency/percentage según el tipo
      const formattedKpis = (data.kpis || []).map((kpi: ReportKPI) => ({
        ...kpi,
        value: ['total_value', 'weighted_value'].includes(kpi.id)
          ? formatCurrency(Number(kpi.value))
          : kpi.id === 'conversion_rate' || kpi.id === 'billable_rate'
            ? `${kpi.value}%`
            : kpi.id === 'total_hours'
              ? `${kpi.value}h`
              : kpi.value
      }));

      setKpis(formattedKpis);
      setPipelineMetrics(data.pipelineMetrics || []);
      setTimeMetrics(data.timeMetrics || null);
      setComparisonMetrics(data.comparisonMetrics || null);
      setAlertMetrics(data.alertMetrics || null);

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    kpis,
    pipelineMetrics,
    timeMetrics,
    comparisonMetrics,
    alertMetrics,
    loading,
    error,
    refetch: fetchData,
    filters,
    setFilters,
  };
}
