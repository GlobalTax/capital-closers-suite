import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Briefcase, HeartHandshake, FileText } from "lucide-react";
import type { TimeEntry } from "@/types";

interface DaySummaryKPIsProps {
  entries: TimeEntry[];
  date: Date;
  userName: string;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function DaySummaryKPIs({ entries, date, userName }: DaySummaryKPIsProps) {
  const metrics = useMemo(() => {
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    
    const coreMAMinutes = entries
      .filter(e => e.value_type === 'core_ma')
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    
    const soporteMinutes = entries
      .filter(e => e.value_type === 'soporte')
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    
    const bajoValorMinutes = entries
      .filter(e => e.value_type === 'bajo_valor')
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    
    const mandatosCount = new Set(entries.map(e => e.mandato_id).filter(Boolean)).size;
    const entriesCount = entries.length;

    return {
      totalMinutes,
      coreMAMinutes,
      soporteMinutes,
      bajoValorMinutes,
      mandatosCount,
      entriesCount,
    };
  }, [entries]);

  const kpis = [
    {
      label: "Total",
      value: formatDuration(metrics.totalMinutes),
      icon: Clock,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Core M&A",
      value: formatDuration(metrics.coreMAMinutes),
      icon: Briefcase,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Soporte",
      value: formatDuration(metrics.soporteMinutes),
      icon: HeartHandshake,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Entradas",
      value: metrics.entriesCount.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
  ];

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay registros para este día</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
