import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Line,
  ComposedChart,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { PipelineSummary } from "@/types/pipeline";

interface PipelineChartProps {
  data: PipelineSummary[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-4 text-sm animate-scale-in">
      <div 
        className="flex items-center gap-2 mb-3 pb-2 border-b border-border"
      >
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <p className="font-bold">{data.stage_name}</p>
      </div>
      <div className="space-y-2 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <span>Deals:</span>
          <span className="text-foreground font-bold">{data.deal_count}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Valor Total:</span>
          <span className="text-foreground font-bold">{formatCurrency(data.total_value)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Valor Ponderado:</span>
          <span className="font-bold" style={{ color: data.color }}>{formatCurrency(data.weighted_value)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Probabilidad:</span>
          <span className="text-foreground font-medium">{data.default_probability}%</span>
        </div>
      </div>
    </div>
  );
};

export function PipelineChart({ data }: PipelineChartProps) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold">Pipeline por Fase</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} layout="vertical">
              <XAxis 
                type="number" 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="stage_name" 
                width={110}
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Bar 
                dataKey="total_value" 
                radius={[0, 6, 6, 0]}
                name="Valor Total"
                animationDuration={800}
                animationBegin={0}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    opacity={0.85}
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="weighted_value" 
                radius={[0, 6, 6, 0]}
                name="Valor Ponderado"
                animationDuration={800}
                animationBegin={200}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-weighted-${index}`} 
                    fill={entry.color}
                    opacity={0.4}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary opacity-85" />
            <span className="text-xs text-muted-foreground">Valor Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary opacity-40" />
            <span className="text-xs text-muted-foreground">Valor Ponderado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
