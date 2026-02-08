import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BillingForecastRow } from "@/hooks/useBillingForecast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { addQuarters, startOfQuarter, format, parseISO, isAfter, isBefore, endOfQuarter } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface Props {
  mandatos: BillingForecastRow[];
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  operacion_ma: { label: "M&A", color: "hsl(var(--primary))" },
  valoracion: { label: "Valoración", color: "hsl(220, 70%, 55%)" },
  due_diligence: { label: "Due Diligence", color: "hsl(160, 60%, 45%)" },
  legal: { label: "Legal", color: "hsl(35, 80%, 55%)" },
  asesoria: { label: "Asesoría", color: "hsl(280, 55%, 55%)" },
  otros: { label: "Otros", color: "hsl(var(--muted-foreground))" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M €";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k €";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";
}

function getQuarterLabel(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q} ${format(date, "yyyy")}`;
}

export function QuarterlyForecastChart({ mandatos }: Props) {
  const { chartData, quarters, totals, noDateMandatos } = useMemo(() => {
    const now = new Date();
    const qStart = startOfQuarter(now);
    const quarters = Array.from({ length: 4 }, (_, i) => {
      const start = addQuarters(qStart, i);
      return { start, end: endOfQuarter(start), label: getQuarterLabel(start) };
    });

    const activos = mandatos.filter((m) => m.estado === "activo" || m.estado === "prospecto");

    const noDateMandatos = activos.filter((m) => !m.fecha_cierre && !m.expected_close_date);

    const chartData = quarters.map((q) => {
      const row: Record<string, any> = { quarter: q.label };
      let total = 0;

      for (const catKey of Object.keys(CATEGORIES)) {
        const mandatosInQ = activos.filter((m) => {
          const closingStr = m.fecha_cierre ?? m.expected_close_date;
          if (!closingStr) return false;
          const closing = parseISO(closingStr);
          const cat = m.categoria ?? "otros";
          const normalizedCat = CATEGORIES[cat] ? cat : "otros";
          return (
            normalizedCat === catKey &&
            !isBefore(closing, q.start) &&
            !isAfter(closing, q.end)
          );
        });

        const weighted = mandatosInQ.reduce((sum, m) => {
          const fee = m.honorarios_aceptados ?? m.honorarios_propuestos ?? 0;
          const prob = (m.probability ?? 10) / 100;
          return sum + fee * prob;
        }, 0);

        row[catKey] = Math.round(weighted);
        total += weighted;
      }

      row._total = Math.round(total);
      return row;
    });

    const totals = {
      total: chartData.reduce((s, r) => s + (r._total as number), 0),
      q1: chartData[0]?._total as number ?? 0,
    };

    return { chartData, quarters, totals, noDateMandatos };
  }, [mandatos]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload
          .filter((p: any) => p.value > 0)
          .sort((a: any, b: any) => b.value - a.value)
          .map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.fill }} />
                <span className="text-muted-foreground">{CATEGORIES[p.dataKey]?.label ?? p.dataKey}</span>
              </div>
              <span className="font-medium tabular-nums">{fmt(p.value)}</span>
            </div>
          ))}
        <div className="border-t border-border mt-2 pt-2 flex justify-between text-xs font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{fmt(total)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forecast Total (4Q)</p>
                <p className="text-2xl font-bold mt-1">{fmt(totals.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue ponderado por probabilidad</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trimestre Actual</p>
                <p className="text-2xl font-bold mt-1">{fmt(totals.q1)}</p>
                <p className="text-xs text-muted-foreground mt-1">{quarters[0]?.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin Fecha Estimada</p>
                <p className="text-2xl font-bold mt-1">{noDateMandatos.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Mandatos activos no incluidos</p>
              </div>
              {noDateMandatos.length > 0 && (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Forecast por Trimestre</CardTitle>
          <CardDescription>
            Proyección de revenue ponderado (honorarios × probabilidad) agrupado por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v) => fmt(v)}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">
                      {CATEGORIES[value]?.label ?? value}
                    </span>
                  )}
                />
                {Object.entries(CATEGORIES).map(([key, { color }]) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="revenue"
                    fill={color}
                    radius={key === "otros" ? [0, 0, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desglose Trimestral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Categoría</th>
                  {chartData.map((q) => (
                    <th key={q.quarter} className="text-right py-2 px-3 font-medium text-muted-foreground">
                      {q.quarter}
                    </th>
                  ))}
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(CATEGORIES).map(([key, { label, color }]) => {
                  const rowTotal = chartData.reduce((s, q) => s + ((q[key] as number) || 0), 0);
                  if (rowTotal === 0) return null;
                  return (
                    <tr key={key} className="border-b border-border/50">
                      <td className="py-2 px-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        {label}
                      </td>
                      {chartData.map((q) => (
                        <td key={q.quarter} className="text-right py-2 px-3 tabular-nums">
                          {(q[key] as number) > 0 ? fmt(q[key] as number) : "—"}
                        </td>
                      ))}
                      <td className="text-right py-2 px-3 font-medium tabular-nums">{fmt(rowTotal)}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  <td className="py-2 px-3">Total</td>
                  {chartData.map((q) => (
                    <td key={q.quarter} className="text-right py-2 px-3 tabular-nums">
                      {fmt(q._total as number)}
                    </td>
                  ))}
                  <td className="text-right py-2 px-3 tabular-nums">{fmt(totals.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
