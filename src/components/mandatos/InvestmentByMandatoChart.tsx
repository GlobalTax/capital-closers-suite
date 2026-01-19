import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { VALUE_TYPE_CONFIG, type TimeEntry, type TimeEntryValueType, type MandatoInfo } from "@/types";
import { TrendingUp, Clock, Target } from "lucide-react";

interface InvestmentByMandatoChartProps {
  entries: TimeEntry[];
  limit?: number;
  loading?: boolean;
  className?: string;
}

// Data structure for chart
interface MandatoHoursData {
  mandato_id: string;
  codigo: string;
  descripcion: string;
  probability?: number;
  valor?: number;
  pipeline_stage?: string;
  estado?: string;
  total_hours: number;
  core_ma_hours: number;
  soporte_hours: number;
  bajo_valor_hours: number;
  core_ma_pct: number;
  soporte_pct: number;
  bajo_valor_pct: number;
}

// Aggregate entries by mandato
function aggregateByMandato(entries: TimeEntry[], limit: number): MandatoHoursData[] {
  const mandatoMap = new Map<string, {
    mandato: MandatoInfo | undefined;
    totalMinutes: number;
    coreMaMinutes: number;
    soporteMinutes: number;
    bajoValorMinutes: number;
  }>();

  entries.forEach(entry => {
    const mandatoId = entry.mandato_id;
    if (!mandatoId) return;

    const existing = mandatoMap.get(mandatoId) || {
      mandato: entry.mandato,
      totalMinutes: 0,
      coreMaMinutes: 0,
      soporteMinutes: 0,
      bajoValorMinutes: 0
    };

    const duration = entry.duration_minutes || 0;
    existing.totalMinutes += duration;

    const vt: TimeEntryValueType = (entry.value_type as TimeEntryValueType) || 'core_ma';
    switch (vt) {
      case 'core_ma':
        existing.coreMaMinutes += duration;
        break;
      case 'soporte':
        existing.soporteMinutes += duration;
        break;
      case 'bajo_valor':
        existing.bajoValorMinutes += duration;
        break;
    }

    mandatoMap.set(mandatoId, existing);
  });

  return Array.from(mandatoMap.entries())
    .map(([mandatoId, data]) => {
      const totalHours = data.totalMinutes / 60;
      const coreMaHours = data.coreMaMinutes / 60;
      const soporteHours = data.soporteMinutes / 60;
      const bajoValorHours = data.bajoValorMinutes / 60;

      return {
        mandato_id: mandatoId,
        codigo: data.mandato?.codigo || `M-${mandatoId.slice(0, 4)}`,
        descripcion: data.mandato?.descripcion || 'Sin descripción',
        probability: data.mandato?.probability,
        valor: data.mandato?.valor,
        pipeline_stage: data.mandato?.pipeline_stage,
        estado: data.mandato?.estado,
        total_hours: totalHours,
        core_ma_hours: coreMaHours,
        soporte_hours: soporteHours,
        bajo_valor_hours: bajoValorHours,
        core_ma_pct: totalHours > 0 ? (coreMaHours / totalHours) * 100 : 0,
        soporte_pct: totalHours > 0 ? (soporteHours / totalHours) * 100 : 0,
        bajo_valor_pct: totalHours > 0 ? (bajoValorHours / totalHours) * 100 : 0
      };
    })
    .sort((a, b) => b.total_hours - a.total_hours)
    .slice(0, limit);
}

// Format currency in compact form
const formatCurrency = (value: number | undefined): string => {
  if (!value) return "N/A";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K€`;
  return `${value.toFixed(0)}€`;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as MandatoHoursData;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-xl min-w-[220px]">
      <div className="space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {data.codigo}
            </Badge>
            {data.estado && (
              <Badge variant="secondary" className="text-xs capitalize">
                {data.estado}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {data.descripcion}
          </p>
        </div>

        {/* Hours breakdown */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Horas Totales
            </span>
            <span className="font-semibold">{data.total_hours.toFixed(1)}h</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: VALUE_TYPE_CONFIG.core_ma.color }}
                />
                Core M&A
              </span>
              <span className="tabular-nums">
                {data.core_ma_hours.toFixed(1)}h ({data.core_ma_pct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: VALUE_TYPE_CONFIG.soporte.color }}
                />
                Soporte
              </span>
              <span className="tabular-nums">
                {data.soporte_hours.toFixed(1)}h ({data.soporte_pct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: VALUE_TYPE_CONFIG.bajo_valor.color }}
                />
                Bajo Valor
              </span>
              <span className="tabular-nums">
                {data.bajo_valor_hours.toFixed(1)}h ({data.bajo_valor_pct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Deal info */}
        <div className="space-y-1 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Probabilidad
            </span>
            <span className="font-medium text-foreground">
              {data.probability ?? 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Deal Size
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(data.valor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom legend
const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-4">
    {(Object.entries(VALUE_TYPE_CONFIG) as [string, typeof VALUE_TYPE_CONFIG.core_ma][]).map(
      ([key, config]) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm text-muted-foreground">{config.label}</span>
        </div>
      )
    )}
  </div>
);

export function InvestmentByMandatoChart({
  entries,
  limit = 10,
  loading = false,
  className = ""
}: InvestmentByMandatoChartProps) {
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    return aggregateByMandato(entries, limit);
  }, [entries, limit]);

  const handleBarClick = (data: MandatoHoursData) => {
    navigate(`/mandatos/${data.mandato_id}`);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inversión de Tiempo por Mandato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inversión de Tiempo por Mandato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay registros de tiempo</p>
            <p className="text-sm">Ajusta los filtros para ver datos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate dynamic height based on number of mandatos
  const barHeight = 44;
  const chartHeight = Math.max(280, chartData.length * barHeight + 60);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inversión de Tiempo por Mandato
            <Badge variant="secondary" className="ml-2">
              Top {chartData.length}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Haz clic en una barra para ver el detalle
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              className="stroke-muted/30"
            />
            <XAxis
              type="number"
              tickFormatter={(value) => `${value}h`}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="codigo"
              width={70}
              className="text-xs font-mono"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            />
            <Bar
              dataKey="core_ma_hours"
              stackId="hours"
              fill={VALUE_TYPE_CONFIG.core_ma.color}
              name="Core M&A"
              radius={[0, 0, 0, 0]}
              cursor="pointer"
              onClick={(_, index) => handleBarClick(chartData[index])}
            />
            <Bar
              dataKey="soporte_hours"
              stackId="hours"
              fill={VALUE_TYPE_CONFIG.soporte.color}
              name="Soporte"
              radius={[0, 0, 0, 0]}
              cursor="pointer"
              onClick={(_, index) => handleBarClick(chartData[index])}
            />
            <Bar
              dataKey="bajo_valor_hours"
              stackId="hours"
              fill={VALUE_TYPE_CONFIG.bajo_valor.color}
              name="Bajo Valor"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(_, index) => handleBarClick(chartData[index])}
            />
          </BarChart>
        </ResponsiveContainer>
        <CustomLegend />
      </CardContent>
    </Card>
  );
}
