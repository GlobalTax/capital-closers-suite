import { useState, useEffect, useCallback } from 'react';
import type { 
  ReportFilters, 
  ReportKPI, 
  PipelineStageMetrics, 
  TimeMetrics, 
  ComparisonMetrics, 
  AlertMetrics 
} from '@/types/reports';
import {
  fetchExecutiveKPIs,
  fetchPipelineMetrics,
  fetchTimeMetrics,
  fetchComparisonMetrics,
  fetchAlertMetrics,
} from '@/services/reports.service';

interface UseReportDataReturn {
  kpis: ReportKPI[];
  pipelineMetrics: PipelineStageMetrics[];
  timeMetrics: TimeMetrics | null;
  comparisonMetrics: ComparisonMetrics | null;
  alertMetrics: AlertMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
}

const defaultFilters: ReportFilters = {
  periodo: 'trimestre',
  tipoMandato: 'todos',
};

export function useReportData(): UseReportDataReturn {
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
      const [kpisData, pipelineData, timeData, comparisonData, alertData] = await Promise.all([
        fetchExecutiveKPIs(filters),
        fetchPipelineMetrics(filters),
        fetchTimeMetrics(filters),
        fetchComparisonMetrics(),
        fetchAlertMetrics(),
      ]);

      setKpis(kpisData);
      setPipelineMetrics(pipelineData);
      setTimeMetrics(timeData);
      setComparisonMetrics(comparisonData);
      setAlertMetrics(alertData);
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
