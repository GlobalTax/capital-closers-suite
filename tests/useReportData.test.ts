import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReportData } from '@/hooks/useReportData';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useReportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and format KPIs correctly', async () => {
    const mockData = {
      kpis: [
        { id: 'total_deals', title: 'Total Mandatos', value: 25, icon: 'Briefcase', color: 'blue' },
        { id: 'total_value', title: 'Valor Total', value: 5000000, icon: 'Euro', color: 'green' },
        { id: 'conversion_rate', title: 'Tasa Conversión', value: 35, icon: 'TrendingUp', color: 'purple' },
        { id: 'total_hours', title: 'Horas Totales', value: 120, icon: 'Clock', color: 'orange' },
      ],
      pipelineMetrics: [
        { stage_key: 'prospect', stage_name: 'Prospecto', stage_order: 1, color: '#ccc', deal_count: 10, total_value: 1000000, weighted_value: 100000, avg_days_in_stage: 5 },
      ],
      timeMetrics: {
        totalHours: 120,
        billableHours: 100,
        nonBillableHours: 20,
        hoursByType: [{ type: 'desarrollo', hours: 80 }],
        hoursByWeek: [{ week: '2024-W01', hours: 40, billable: 35 }],
      },
      comparisonMetrics: null,
      alertMetrics: null,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null } as any);

    const { result } = renderHook(() => useReportData(), { wrapper: createWrapper() });

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.kpis).toHaveLength(4);

    // Verify currency formatting for total_value
    const totalValueKpi = result.current.kpis.find((k) => k.id === 'total_value');
    expect(totalValueKpi?.value).toBe('€5.0M');

    // Verify percentage formatting for conversion_rate
    const conversionKpi = result.current.kpis.find((k) => k.id === 'conversion_rate');
    expect(conversionKpi?.value).toBe('35%');

    // Verify hours formatting
    const hoursKpi = result.current.kpis.find((k) => k.id === 'total_hours');
    expect(hoursKpi?.value).toBe('120h');

    // Verify plain number for deal count
    const dealsKpi = result.current.kpis.find((k) => k.id === 'total_deals');
    expect(dealsKpi?.value).toBe(25);

    // Verify pipeline metrics
    expect(result.current.pipelineMetrics).toHaveLength(1);
    expect(result.current.pipelineMetrics[0].stage_name).toBe('Prospecto');

    // Verify time metrics
    expect(result.current.timeMetrics?.totalHours).toBe(120);
  });

  it('should handle RPC errors gracefully', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Database connection error', code: '500' },
    } as any);

    const { result } = renderHook(() => useReportData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Error al cargar los datos del reporte');
    expect(result.current.kpis).toHaveLength(0);
    expect(result.current.pipelineMetrics).toHaveLength(0);
  });

  it('should handle null data response', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

    const { result } = renderHook(() => useReportData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Error al cargar los datos del reporte');
    expect(result.current.kpis).toHaveLength(0);
  });

  it('should handle empty KPIs array', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        kpis: [],
        pipelineMetrics: [],
        timeMetrics: null,
        comparisonMetrics: null,
        alertMetrics: null,
      },
      error: null,
    } as any);

    const { result } = renderHook(() => useReportData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.kpis).toHaveLength(0);
  });

  it('should provide default filters', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { kpis: [], pipelineMetrics: [] },
      error: null,
    } as any);

    const { result } = renderHook(() => useReportData(), { wrapper: createWrapper() });

    expect(result.current.filters.periodo).toBe('trimestre');
    expect(result.current.filters.tipoMandato).toBe('todos');
  });
});
