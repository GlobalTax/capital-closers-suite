import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

interface ReportFilters {
  periodo: 'mes' | 'trimestre' | 'semestre' | 'año' | 'custom';
  fechaInicio?: Date;
  fechaFin?: Date;
  tipoMandato: 'todos' | 'compra' | 'venta';
  estado?: string;
}

interface ReportKPI {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
}

interface PipelineStageMetrics {
  stage_key: string;
  stage_name: string;
  stage_order: number;
  color: string;
  deal_count: number;
  total_value: number;
  weighted_value: number;
  avg_days_in_stage: number;
}

interface TimeMetrics {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  hoursByUser: { user_name: string; hours: number; billable: number }[];
  hoursByType: { type: string; hours: number }[];
  hoursByWeek: { week: string; hours: number; billable: number }[];
  hoursByMandato: { mandato_id: string; mandato_nombre: string; hours: number }[];
}

interface ComparisonMetrics {
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

interface UpcomingClosing {
  id: string;
  nombre: string;
  expected_close_date: string;
  valor?: number;
  daysUntilClose: number;
}

interface AlertMetrics {
  stuckDeals: {
    id: string;
    nombre: string;
    stage: string;
    daysInStage: number;
    valor?: number;
  }[];
  overdueChecklists: any[];
  upcomingClosings: UpcomingClosing[];
  criticalAlerts: number;
  warningAlerts: number;
}

const defaultFilters: ReportFilters = {
  periodo: 'trimestre',
  tipoMandato: 'todos',
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value}`;
}

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
      // Calcular rango de fechas basado en filtros
      const dateRange = filters.periodo === 'custom' && filters.fechaInicio && filters.fechaFin
        ? { start: filters.fechaInicio, end: filters.fechaFin }
        : getDateRangeFromPeriod(filters.periodo);

      // Fetch mandatos con filtro de fecha
      let mandatosQuery = supabase
        .from('mandatos')
        .select('id, tipo, estado, valor, probability, weighted_value, days_in_stage, pipeline_stage, sectores_interes, fecha_inicio, fecha_cierre, expected_close_date, descripcion, created_at')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const { data: mandatosRaw } = await mandatosQuery;

      let mandatos: any[] = mandatosRaw || [];
      if (filters.tipoMandato !== 'todos') {
        mandatos = mandatos.filter((m: any) => m.tipo === filters.tipoMandato);
      }

      // Calculate KPIs
      const activos = mandatos.filter((m: any) => m.estado !== 'cerrado' && m.estado !== 'cancelado');
      const cerrados = mandatos.filter((m: any) => m.estado === 'cerrado');
      const totalValue = activos.reduce((sum: number, m: any) => sum + (m.valor || 0), 0);
      const weightedValue = activos.reduce((sum: number, m: any) => sum + (m.weighted_value || 0), 0);
      const conversionRate = mandatos.length ? Math.round((cerrados.length / mandatos.length) * 100) : 0;

      // Time data con filtro de fecha
      const { data: timeData } = await supabase
        .from('mandato_time_entries')
        .select('duration_minutes, is_billable, work_type, user_id, mandato_id, start_time')
        .gte('start_time', dateRange.start.toISOString())
        .lte('start_time', dateRange.end.toISOString());

      const entries: any[] = timeData || [];
      const totalMinutes = entries.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);
      const billableMinutes = entries.filter((e: any) => e.is_billable).reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);
      const totalHours = Math.round(totalMinutes / 60);
      const billableHours = Math.round(billableMinutes / 60);

      const riskDeals = mandatos.filter((m: any) => (m.days_in_stage || 0) > 30 && m.estado !== 'cerrado' && m.estado !== 'cancelado').length;

      setKpis([
        { id: 'total_value', title: 'Valor Total Pipeline', value: formatCurrency(totalValue), icon: 'TrendingUp', color: 'text-primary', description: `${activos.length} deals activos` },
        { id: 'weighted_value', title: 'Valor Ponderado', value: formatCurrency(weightedValue), icon: 'Scale', color: 'text-purple-500', description: 'Por probabilidad' },
        { id: 'active_deals', title: 'Deals Activos', value: activos.length, icon: 'Briefcase', color: 'text-blue-500', description: `${cerrados.length} cerrados` },
        { id: 'conversion_rate', title: 'Tasa Conversión', value: `${conversionRate}%`, icon: 'Target', color: 'text-green-500', description: `${cerrados.length}/${mandatos.length}` },
        { id: 'total_hours', title: 'Horas Totales', value: totalHours, icon: 'Clock', color: 'text-orange-500', description: `${billableHours}h facturables` },
        { id: 'billable_rate', title: 'Tasa Facturable', value: `${totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0}%`, icon: 'DollarSign', color: 'text-emerald-500', description: `${billableHours}/${totalHours}h` },
        { id: 'risk_deals', title: 'Deals en Riesgo', value: riskDeals, icon: 'AlertTriangle', color: riskDeals > 0 ? 'text-red-500' : 'text-muted-foreground', description: '>30 días estancados' },
      ]);

      // Pipeline Metrics
      const stageConfig: Record<string, { name: string; order: number; color: string }> = {
        'prospeccion': { name: 'Prospección', order: 1, color: '#3b82f6' },
        'loi': { name: 'LOI', order: 2, color: '#8b5cf6' },
        'due_diligence': { name: 'Due Diligence', order: 3, color: '#f59e0b' },
        'negociacion': { name: 'Negociación', order: 4, color: '#ef4444' },
        'cierre': { name: 'Cierre', order: 5, color: '#22c55e' },
      };

      const stageMap = new Map<string, PipelineStageMetrics>();
      mandatos.forEach((m: any) => {
        const stage = m.pipeline_stage || 'prospeccion';
        const config = stageConfig[stage] || stageConfig['prospeccion'];
        if (!stageMap.has(stage)) {
          stageMap.set(stage, { stage_key: stage, stage_name: config.name, stage_order: config.order, color: config.color, deal_count: 0, total_value: 0, weighted_value: 0, avg_days_in_stage: 0 });
        }
        const metrics = stageMap.get(stage)!;
        metrics.deal_count += 1;
        metrics.total_value += m.valor || 0;
        metrics.weighted_value += m.weighted_value || 0;
        metrics.avg_days_in_stage += m.days_in_stage || 0;
      });
      stageMap.forEach(metrics => {
        if (metrics.deal_count > 0) metrics.avg_days_in_stage = Math.round(metrics.avg_days_in_stage / metrics.deal_count);
      });
      setPipelineMetrics(Array.from(stageMap.values()).sort((a, b) => a.stage_order - b.stage_order));

      // Time Metrics
      const userMap = new Map<string, { hours: number; billable: number }>();
      const typeMap = new Map<string, number>();
      const weekMap = new Map<string, { hours: number; billable: number }>();
      const mandatoMap = new Map<string, { nombre: string; hours: number }>();

      entries.forEach((e: any) => {
        const userId = e.user_id || 'unknown';
        if (!userMap.has(userId)) userMap.set(userId, { hours: 0, billable: 0 });
        const user = userMap.get(userId)!;
        user.hours += (e.duration_minutes || 0) / 60;
        if (e.is_billable) user.billable += (e.duration_minutes || 0) / 60;

        const type = e.work_type || 'Otros';
        typeMap.set(type, (typeMap.get(type) || 0) + (e.duration_minutes || 0) / 60);

        const date = new Date(e.start_time || new Date());
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weekMap.has(weekKey)) weekMap.set(weekKey, { hours: 0, billable: 0 });
        const week = weekMap.get(weekKey)!;
        week.hours += (e.duration_minutes || 0) / 60;
        if (e.is_billable) week.billable += (e.duration_minutes || 0) / 60;

        const mandatoId = e.mandato_id;
        if (!mandatoMap.has(mandatoId)) mandatoMap.set(mandatoId, { nombre: `Mandato ${mandatoId?.substring(0, 8) || ''}`, hours: 0 });
        mandatoMap.get(mandatoId)!.hours += (e.duration_minutes || 0) / 60;
      });

      setTimeMetrics({
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        billableHours: Math.round(billableMinutes / 60 * 10) / 10,
        nonBillableHours: Math.round((totalMinutes - billableMinutes) / 60 * 10) / 10,
        hoursByUser: Array.from(userMap.entries()).map(([user_name, data]) => ({ user_name: user_name.substring(0, 8), hours: Math.round(data.hours * 10) / 10, billable: Math.round(data.billable * 10) / 10 })),
        hoursByType: Array.from(typeMap.entries()).map(([type, hours]) => ({ type, hours: Math.round(hours * 10) / 10 })),
        hoursByWeek: Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([week, data]) => ({ week: new Date(week).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), hours: Math.round(data.hours * 10) / 10, billable: Math.round(data.billable * 10) / 10 })),
        hoursByMandato: Array.from(mandatoMap.entries()).map(([mandato_id, data]) => ({ mandato_id, mandato_nombre: data.nombre.substring(0, 20), hours: Math.round(data.hours * 10) / 10 })).sort((a, b) => b.hours - a.hours).slice(0, 10),
      });

      // Comparison Metrics
      const allMandatos: any[] = mandatosRaw || [];
      const compra = allMandatos.filter((m: any) => m.tipo === 'compra');
      const venta = allMandatos.filter((m: any) => m.tipo === 'venta');

      const calcMetrics = (items: any[]) => {
        if (!items?.length) return { count: 0, totalValue: 0, avgValue: 0, conversionRate: 0, avgDaysToClose: 0 };
        const cerr = items.filter((m: any) => m.estado === 'cerrado');
        const tv = items.reduce((sum: number, m: any) => sum + (m.valor || 0), 0);
        return {
          count: items.length,
          totalValue: tv,
          avgValue: Math.round(tv / items.length),
          conversionRate: Math.round((cerr.length / items.length) * 100),
          avgDaysToClose: 0,
        };
      };

      const sectorMap = new Map<string, { compra: number; venta: number }>();
      allMandatos.forEach((m: any) => {
        const sectors = m.sectores_interes || ['Sin sector'];
        const sector = Array.isArray(sectors) ? sectors[0] || 'Sin sector' : 'Sin sector';
        if (!sectorMap.has(sector)) sectorMap.set(sector, { compra: 0, venta: 0 });
        if (m.tipo === 'compra') sectorMap.get(sector)!.compra += 1;
        else sectorMap.get(sector)!.venta += 1;
      });

      setComparisonMetrics({
        compra: calcMetrics(compra),
        venta: calcMetrics(venta),
        bySector: Array.from(sectorMap.entries()).map(([sector, data]) => ({ sector, ...data })).sort((a, b) => (b.compra + b.venta) - (a.compra + a.venta)).slice(0, 8),
      });

      // Alert Metrics - Deals estancados
      const { data: stuckMandatos } = await supabase
        .from('mandatos')
        .select('id, descripcion, pipeline_stage, days_in_stage, valor')
        .neq('estado', 'cerrado')
        .neq('estado', 'cancelado')
        .gt('days_in_stage', 30)
        .order('days_in_stage', { ascending: false })
        .limit(10);

      // Próximos cierres - mandatos con expected_close_date en los próximos 30 días
      const today = new Date();
      const in30Days = addDays(today, 30);
      
      const { data: upcomingData } = await supabase
        .from('mandatos')
        .select('id, descripcion, expected_close_date, valor')
        .not('expected_close_date', 'is', null)
        .gte('expected_close_date', today.toISOString().split('T')[0])
        .lte('expected_close_date', in30Days.toISOString().split('T')[0])
        .neq('estado', 'cerrado')
        .neq('estado', 'cancelado')
        .order('expected_close_date', { ascending: true })
        .limit(10);

      const upcomingClosings: UpcomingClosing[] = (upcomingData || []).map((m: any) => {
        const closeDate = new Date(m.expected_close_date);
        const daysUntilClose = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: m.id,
          nombre: m.descripcion || 'Sin nombre',
          expected_close_date: m.expected_close_date,
          valor: m.valor,
          daysUntilClose,
        };
      });

      // Tareas vencidas del checklist
      const { data: overdueTasks } = await supabase
        .from('mandato_checklist_tasks')
        .select('id, tarea, fecha_limite, mandato_id')
        .eq('completada', false)
        .lt('fecha_limite', today.toISOString().split('T')[0])
        .limit(20);

      const criticalAlerts = (stuckMandatos?.length || 0) + (overdueTasks?.filter((t: any) => {
        const daysOverdue = Math.ceil((today.getTime() - new Date(t.fecha_limite).getTime()) / (1000 * 60 * 60 * 24));
        return daysOverdue > 7;
      }).length || 0);

      const warningAlerts = upcomingClosings.filter(c => c.daysUntilClose <= 7).length + 
        (overdueTasks?.filter((t: any) => {
          const daysOverdue = Math.ceil((today.getTime() - new Date(t.fecha_limite).getTime()) / (1000 * 60 * 60 * 24));
          return daysOverdue <= 7 && daysOverdue > 0;
        }).length || 0);

      setAlertMetrics({
        stuckDeals: (stuckMandatos || []).map((m: any) => ({ id: m.id, nombre: m.descripcion || 'Sin nombre', stage: m.pipeline_stage || 'prospeccion', daysInStage: m.days_in_stage || 0, valor: m.valor })),
        overdueChecklists: overdueTasks || [],
        upcomingClosings,
        criticalAlerts,
        warningAlerts,
      });

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
