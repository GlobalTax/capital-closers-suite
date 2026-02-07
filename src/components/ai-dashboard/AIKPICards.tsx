import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Coins, Gauge, Zap, CheckCircle2 } from "lucide-react";
import type { AIKPIs } from "@/hooks/queries/useAIDashboard";

interface Props {
  kpis?: AIKPIs;
  isLoading: boolean;
}

const cards = [
  { key: "totalCalls" as const, label: "Llamadas IA", icon: Activity, format: (v: number) => v.toLocaleString() },
  { key: "totalTokens" as const, label: "Tokens consumidos", icon: Zap, format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString() },
  { key: "totalCost" as const, label: "Costo estimado", icon: Coins, format: (v: number) => `$${v.toFixed(4)}` },
  { key: "successRate" as const, label: "Tasa de éxito", icon: CheckCircle2, format: (v: number) => `${v.toFixed(1)}%` },
  { key: "avgLatency" as const, label: "Latencia media", icon: Gauge, format: (v: number) => `${Math.round(v)} ms` },
];

export function AIKPICards({ kpis, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map(c => (
        <Card key={c.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {kpis ? c.format(kpis[c.key]) : "—"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
