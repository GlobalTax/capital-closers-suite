import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FinancialStatement } from "@/types/financials";

interface FinancialTrendChartProps {
  statements: FinancialStatement[];
}

export function FinancialTrendChart({ statements }: FinancialTrendChartProps) {
  // Sort by year ascending for chart
  const sortedStatements = [...statements].sort((a, b) => a.year - b.year);

  const chartData = sortedStatements.map(s => ({
    year: s.year.toString(),
    revenue: s.revenue ? s.revenue / 1000000 : null,
    ebitda: s.ebitda ? s.ebitda / 1000000 : null,
    netIncome: s.net_income ? s.net_income / 1000000 : null,
  }));

  const formatValue = (value: number) => `€${value.toFixed(1)}M`;

  if (statements.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Se necesitan al menos 2 años para mostrar la evolución</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Evolución Financiera</h4>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" className="text-xs" />
            <YAxis 
              tickFormatter={(value) => `€${value}M`}
              className="text-xs"
            />
            <Tooltip 
              formatter={(value: number) => formatValue(value)}
              labelFormatter={(label) => `Año ${label}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Ingresos"
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="ebitda" 
              name="EBITDA"
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))' }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="netIncome" 
              name="Beneficio Neto"
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-3))' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
