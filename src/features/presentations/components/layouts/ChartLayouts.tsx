import { LayoutProps } from "./types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Tooltip,
  Legend,
} from "recharts";

// Chart Layout A: Bar chart
export function ChartLayoutA({ content, scheme }: LayoutProps) {
  const chart = content.chart;
  if (!chart?.data?.length) return null;

  const chartData = chart.data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color || scheme.accent,
  }));

  return (
    <div className="mt-8">
      {chart.title && (
        <h3 
          className="text-lg mb-6 uppercase tracking-wider"
          style={{ color: scheme.muted, fontWeight: 400 }}
        >
          {chart.title}
        </h3>
      )}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="25%">
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: scheme.muted, fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: scheme.muted, fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: scheme.card,
                border: `1px solid ${scheme.border}`,
                borderRadius: 8,
                color: scheme.text,
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Chart Layout B: Pie/Donut chart
export function ChartLayoutB({ content, scheme }: LayoutProps) {
  const chart = content.chart;
  if (!chart?.data?.length) return null;

  const DEFAULT_COLORS = ['#1e3a5f', '#2563eb', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];
  const chartData = chart.data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  const isDonut = chart.type === 'donut';

  return (
    <div className="mt-8">
      {chart.title && (
        <h3 
          className="text-lg mb-6 uppercase tracking-wider text-center"
          style={{ color: scheme.muted, fontWeight: 400 }}
        >
          {chart.title}
        </h3>
      )}
      <div className="flex items-center justify-center gap-12">
        <div className="h-[280px] w-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isDonut ? 60 : 0}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: scheme.card,
                  border: `1px solid ${scheme.border}`,
                  borderRadius: 8,
                  color: scheme.text,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {chart.showLegend !== false && (
          <div className="space-y-3">
            {chartData.map((entry, i) => (
              <div key={i} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: entry.fill }}
                />
                <span style={{ color: scheme.text }}>
                  {entry.name}
                </span>
                <span 
                  className="font-medium"
                  style={{ color: scheme.accent }}
                >
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Chart Layout C: Line chart
export function ChartLayoutC({ content, scheme }: LayoutProps) {
  const chart = content.chart;
  if (!chart?.data?.length) return null;

  const chartData = chart.data.map(d => ({
    name: d.label,
    value: d.value,
  }));

  return (
    <div className="mt-8">
      {chart.title && (
        <h3 
          className="text-lg mb-6 uppercase tracking-wider"
          style={{ color: scheme.muted, fontWeight: 400 }}
        >
          {chart.title}
        </h3>
      )}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: scheme.muted, fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: scheme.muted, fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: scheme.card,
                border: `1px solid ${scheme.border}`,
                borderRadius: 8,
                color: scheme.text,
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={scheme.accent}
              strokeWidth={3}
              dot={{ fill: scheme.accent, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
