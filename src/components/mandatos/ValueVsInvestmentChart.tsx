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
  ReferenceArea,
  Cell,
} from "recharts";
import { TimeEntry } from "@/types";
import { cn } from "@/lib/utils";

type Quadrant = 'priorizar' | 'correcto' | 'no_urgente' | 'riesgo';

interface QuadrantConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const QUADRANT_CONFIG: Record<Quadrant, QuadrantConfig> = {
  priorizar: {
    label: 'PRIORIZAR',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.04)',
    description: 'Bajo tiempo, alta probabilidad'
  },
  correcto: {
    label: 'CORRECTO',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.04)',
    description: 'Inversión justificada'
  },
  no_urgente: {
    label: 'MONITOREAR',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.03)',
    description: 'Sin urgencia'
  },
  riesgo: {
    label: 'EN RIESGO',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.04)',
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
    <div className="bg-popover border border-border rounded-lg shadow-xl p-4 min-w-[240px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base">{data.codigo}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${quadrantConfig.color}15`,
            color: quadrantConfig.color
          }}
        >
          {data.pipeline_stage || data.estado}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {data.descripcion}
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Horas invertidas</span>
          <span className="tabular-nums">{data.x.toFixed(1)}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Probabilidad</span>
          <span className="tabular-nums">{data.y}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor estimado</span>
          <span className="tabular-nums">{formatCurrency(data.z)}</span>
        </div>
      </div>
      <div
        className="mt-4 pt-3 border-t border-border flex items-center gap-2"
        style={{ color: quadrantConfig.color }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: quadrantConfig.color }}
        />
        <span className="text-sm">{quadrantConfig.label}</span>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <Card className="border-0 shadow-sm bg-card/50">
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[500px] w-full" />
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
        z: m.valor || 500000,
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
    return Math.ceil(max / 20) * 20 + 20;
  }, [scatterData]);

  const valueRange = useMemo(() => {
    if (!scatterData.length) return [0, 1000000];
    const values = scatterData.map(d => d.z);
    return [Math.min(...values), Math.max(...values)];
  }, [scatterData]);

  // Count by quadrant for legend
  const quadrantCounts = useMemo(() => {
    const counts: Record<Quadrant, number> = { priorizar: 0, correcto: 0, no_urgente: 0, riesgo: 0 };
    scatterData.forEach(d => counts[d.quadrant]++);
    return counts;
  }, [scatterData]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!scatterData.length) {
    return (
      <Card className={cn("border-0 shadow-sm bg-card/50", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Matriz Estratégica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No hay datos de mandatos para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-0 shadow-sm bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl mb-1">Matriz Estratégica</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tamaño = Valor del deal · Click para ver detalle
            </p>
          </div>
          
          {/* Inline Legend */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            {(['priorizar', 'correcto', 'riesgo', 'no_urgente'] as Quadrant[]).map(q => (
              <div key={q} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: QUADRANT_CONFIG[q].color }}
                />
                <span className="text-muted-foreground">
                  {QUADRANT_CONFIG[q].label}
                </span>
                <span className="text-foreground tabular-nums">
                  ({quadrantCounts[q]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            >
              {/* Quadrant background areas */}
              <ReferenceArea
                x1={0}
                x2={hoursThreshold}
                y1={probabilityThreshold}
                y2={100}
                fill={QUADRANT_CONFIG.priorizar.bgColor}
                fillOpacity={1}
              />
              <ReferenceArea
                x1={hoursThreshold}
                x2={maxHours}
                y1={probabilityThreshold}
                y2={100}
                fill={QUADRANT_CONFIG.correcto.bgColor}
                fillOpacity={1}
              />
              <ReferenceArea
                x1={0}
                x2={hoursThreshold}
                y1={0}
                y2={probabilityThreshold}
                fill={QUADRANT_CONFIG.no_urgente.bgColor}
                fillOpacity={1}
              />
              <ReferenceArea
                x1={hoursThreshold}
                x2={maxHours}
                y1={0}
                y2={probabilityThreshold}
                fill={QUADRANT_CONFIG.riesgo.bgColor}
                fillOpacity={1}
              />

              <XAxis
                type="number"
                dataKey="x"
                name="Horas"
                domain={[0, maxHours]}
                tickFormatter={(v) => `${v}h`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: 'Horas invertidas →', 
                  position: 'bottom', 
                  offset: 10,
                  style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Probabilidad"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: 'Probabilidad →', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10,
                  style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
                }}
              />
              <ZAxis
                type="number"
                dataKey="z"
                range={[150, 800]}
                domain={valueRange}
                name="Valor"
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
                    fillOpacity={0.75}
                    stroke={QUADRANT_CONFIG[entry.quadrant].color}
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Quadrant Labels */}
          <div className="absolute top-8 left-12 text-xs text-emerald-600/70 uppercase tracking-wide">
            Priorizar
          </div>
          <div className="absolute top-8 right-12 text-xs text-blue-600/70 uppercase tracking-wide">
            Correcto
          </div>
          <div className="absolute bottom-12 left-12 text-xs text-gray-500/70 uppercase tracking-wide">
            Monitorear
          </div>
          <div className="absolute bottom-12 right-12 text-xs text-red-500/70 uppercase tracking-wide">
            En Riesgo
          </div>
        </div>

        {/* Mobile Legend */}
        <div className="md:hidden grid grid-cols-2 gap-2 mt-4 text-xs">
          {(['priorizar', 'correcto', 'riesgo', 'no_urgente'] as Quadrant[]).map(q => (
            <div key={q} className="flex items-center gap-2 p-2 rounded bg-muted/20">
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: QUADRANT_CONFIG[q].color }}
              />
              <span className="text-muted-foreground truncate">
                {QUADRANT_CONFIG[q].label} ({quadrantCounts[q]})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
