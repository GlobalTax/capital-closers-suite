import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import type { AIDailyData } from "@/hooks/queries/useAIDashboard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  data: AIDailyData[];
  isLoading: boolean;
}

export function AIUsageChart({ data, isLoading }: Props) {
  const formatted = data.map(d => ({
    ...d,
    label: format(new Date(d.date), "d MMM", { locale: es }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Uso diario
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Sin datos de actividad aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis yAxisId="tokens" orientation="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis yAxisId="cost" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) =>
                  name === "tokens" ? [value.toLocaleString(), "Tokens"] : [`$${value.toFixed(4)}`, "Costo"]
                }
              />
              <Area yAxisId="tokens" type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
              <Area yAxisId="cost" type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
