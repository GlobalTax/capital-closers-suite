import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { TimeEntry } from "@/types";

type Quadrant = 'priorizar' | 'correcto' | 'no_urgente' | 'riesgo';

interface QuadrantConfig {
  label: string;
  color: string;
  description: string;
}

const QUADRANT_CONFIG: Record<Quadrant, QuadrantConfig> = {
  priorizar: {
    label: 'Priorizar',
    color: '#10B981',
    description: 'Bajo tiempo, alta prob.'
  },
  correcto: {
    label: 'Correcto',
    color: '#3B82F6',
    description: 'Alto tiempo justificado'
  },
  no_urgente: {
    label: 'No Urgente',
    color: '#6B7280',
    description: 'Monitorear'
  },
  riesgo: {
    label: 'En Riesgo',
    color: '#EF4444',
    description: 'Revisar o cortar'
  }
};

interface ScatterDataPoint {
  x: number;
  y: number;
  z: number;
  mandato_id: string;
  codigo: string;
  descripcion: string;
  estado: string;
  pipeline_stage?: string;
  quadrant: Quadrant;
}

interface ValueVsInvestmentChartProps {
  entries: TimeEntry[];
  hoursThreshold?: number;
  probabilityThreshold?: number;
  loading?: boolean;
  className?: string;
}

function getQuadrant(
  hours: number,
  probability: number,
  hoursThreshold: number,
  probabilityThreshold: number
): Quadrant {
  const isHighHours = hours > hoursThreshold;
  const isHighProbability = probability >= probabilityThreshold;

  if (!isHighHours && isHighProbability) return 'priorizar';
  if (isHighHours && isHighProbability) return 'correcto';
  if (!isHighHours && !isHighProbability) return 'no_urgente';
  return 'riesgo';
}

function formatCurrency(value?: number): string {
  if (!value) return "N/A";
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  return `${value.toFixed(0)}€`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterDataPoint }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const quadrantConfig = QUADRANT_CONFIG[data.quadrant];

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{data.codigo}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${quadrantConfig.color}20`,
            color: quadrantConfig.color
          }}
        >
          {data.pipeline_stage || data.estado}
        </span>
      </div>
      <p className="text-xs text-muted-foreground truncate mb-3 max-w-[200px]">
        {data.descripcion}
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">⏱️ Horas invertidas</span>
          <span className="font-medium">{data.x.toFixed(1)}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">📈 Probabilidad</span>
          <span className="font-medium">{data.y}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">💰 Valor estimado</span>
          <span className="font-medium">{formatCurrency(data.z)}</span>
        </div>
      </div>
      <div
        className="mt-3 pt-2 border-t border-border flex items-center gap-2"
        style={{ color: quadrantConfig.color }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: quadrantConfig.color }}
        />
        <span className="text-xs font-medium">{quadrantConfig.label}</span>
        <span className="text-xs text-muted-foreground">· {quadrantConfig.description}</span>
      </div>
    </div>
  );
};

const QuadrantLegend = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
    {Object.entries(QUADRANT_CONFIG).map(([key, config]) => (
      <div
        key={key}
        className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <div className="min-w-0">
          <p className="font-medium truncate">{config.label}</p>
          <p className="text-muted-foreground truncate">{config.description}</p>
        </div>
      </div>
    ))}
  </div>
);

const LoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[350px] w-full" />
    </CardContent>
  </Card>
);

export function ValueVsInvestmentChart({
  entries,
  hoursThreshold = 40,
  probabilityThreshold = 50,
  loading = false,
  className,
}: ValueVsInvestmentChartProps) {
  const navigate = useNavigate();

  const scatterData = useMemo(() => {
    if (!entries.length) return [];

    // Aggregate entries by mandato
    const mandatoMap = new Map<string, {
      mandato_id: string;
      codigo: string;
      descripcion: string;
      estado: string;
      pipeline_stage?: string;
      probability: number;
      valor?: number;
      total_hours: number;
    }>();

    entries.forEach((entry) => {
      if (!entry.mandato_id) return;

      const durationHours = (entry.duration_minutes || 0) / 60;
      const existing = mandatoMap.get(entry.mandato_id);
      if (existing) {
        existing.total_hours += durationHours;
      } else {
        mandatoMap.set(entry.mandato_id, {
          mandato_id: entry.mandato_id,
          codigo: entry.mandato?.codigo || 'Sin código',
          descripcion: entry.mandato?.descripcion || 'Sin descripción',
          estado: entry.mandato?.estado || 'activo',
          pipeline_stage: entry.mandato?.pipeline_stage,
          probability: entry.mandato?.probability || 0,
          valor: entry.mandato?.valor,
          total_hours: durationHours,
        });
      }
    });

    // Convert to scatter data points
    return Array.from(mandatoMap.values())
      .filter(m => m.estado !== 'cerrado' && m.estado !== 'cancelado')
      .map((m): ScatterDataPoint => ({
        x: m.total_hours,
        y: m.probability,
        z: m.valor || 500000, // Default bubble size if no value
        mandato_id: m.mandato_id,
        codigo: m.codigo,
        descripcion: m.descripcion,
        estado: m.estado,
        pipeline_stage: m.pipeline_stage,
        quadrant: getQuadrant(m.total_hours, m.probability, hoursThreshold, probabilityThreshold),
      }));
  }, [entries, hoursThreshold, probabilityThreshold]);

  const handleDotClick = (data: ScatterDataPoint) => {
    navigate(`/mandatos/${data.mandato_id}`);
  };

  // Calculate axis domains
  const maxHours = useMemo(() => {
    if (!scatterData.length) return 100;
    const max = Math.max(...scatterData.map(d => d.x));
    return Math.ceil(max / 10) * 10 + 10; // Round up and add padding
  }, [scatterData]);

  const valueRange = useMemo(() => {
    if (!scatterData.length) return [0, 1000000];
    const values = scatterData.map(d => d.z);
    return [Math.min(...values), Math.max(...values)];
  }, [scatterData]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!scatterData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Valor vs Inversión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos de mandatos para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          Valor vs Inversión - Matriz Estratégica
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tamaño de burbuja = Valor estimado del deal · Click para ver detalle
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <XAxis
                type="number"
                dataKey="x"
                name="Horas"
                domain={[0, maxHours]}
                tickFormatter={(v) => `${v}h`}
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Probabilidad"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <ZAxis
                type="number"
                dataKey="z"
                range={[100, 600]}
                domain={valueRange}
                name="Valor"
              />

              {/* Quadrant reference lines */}
              <ReferenceLine
                x={hoursThreshold}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
              <ReferenceLine
                y={probabilityThreshold}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
              />

              <Scatter
                data={scatterData}
                onClick={(data) => handleDotClick(data as unknown as ScatterDataPoint)}
                style={{ cursor: 'pointer' }}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={QUADRANT_CONFIG[entry.quadrant].color}
                    fillOpacity={0.7}
                    stroke={QUADRANT_CONFIG[entry.quadrant].color}
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <QuadrantLegend />
      </CardContent>
    </Card>
  );
}
