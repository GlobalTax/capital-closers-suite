import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MandatoChecklistTask, DDWorkstream } from "@/types";
import { WORKSTREAM_CONFIG } from "@/types";
import { AlertTriangle } from "lucide-react";

interface WorkstreamStats {
  workstream: DDWorkstream;
  total: number;
  completadas: number;
  enCurso: number;
  vencidas: number;
  porcentaje: number;
}

interface WorkstreamSummaryProps {
  tasks: MandatoChecklistTask[];
  selectedWorkstream: DDWorkstream | 'all';
  onSelectWorkstream: (ws: DDWorkstream | 'all') => void;
}

export function WorkstreamSummary({ 
  tasks, 
  selectedWorkstream, 
  onSelectWorkstream 
}: WorkstreamSummaryProps) {
  const stats = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const ws = task.workstream || 'other';
      if (!acc[ws]) {
        acc[ws] = { total: 0, completadas: 0, enCurso: 0, vencidas: 0 };
      }
      acc[ws].total++;
      if (task.estado === '✅ Completa') acc[ws].completadas++;
      if (task.estado === '🔄 En curso') acc[ws].enCurso++;
      if (task.fecha_limite && new Date(task.fecha_limite) < new Date() && task.estado !== '✅ Completa') {
        acc[ws].vencidas++;
      }
      return acc;
    }, {} as Record<string, { total: number; completadas: number; enCurso: number; vencidas: number }>);

    return Object.entries(grouped)
      .map(([ws, data]) => ({
        workstream: ws as DDWorkstream,
        ...data,
        porcentaje: data.total > 0 ? Math.round((data.completadas / data.total) * 100) : 0,
      }))
      .sort((a, b) => {
        const order = ['legal', 'financial', 'commercial', 'ops', 'it', 'tax', 'other'];
        return order.indexOf(a.workstream) - order.indexOf(b.workstream);
      });
  }, [tasks]);

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter(t => t.estado === '✅ Completa').length;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Chip "Todos" */}
      <button
        onClick={() => onSelectWorkstream('all')}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
          "border hover:bg-accent",
          selectedWorkstream === 'all' 
            ? "bg-primary text-primary-foreground border-primary" 
            : "bg-background border-border"
        )}
      >
        <span>Todos</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {totalCompleted}/{totalTasks}
        </Badge>
      </button>

      {/* Chips por workstream */}
      {stats.map(stat => {
        const config = WORKSTREAM_CONFIG[stat.workstream];
        const isSelected = selectedWorkstream === stat.workstream;

        return (
          <button
            key={stat.workstream}
            onClick={() => onSelectWorkstream(stat.workstream)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              "border hover:bg-accent",
              isSelected 
                ? "border-2" 
                : "bg-background border-border"
            )}
            style={{
              borderColor: isSelected ? config.color : undefined,
              backgroundColor: isSelected ? `${config.color}15` : undefined,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: config.color }} 
            />
            <span>{config.label}</span>
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-xs"
              style={{
                backgroundColor: stat.porcentaje === 100 ? '#10B98120' : undefined,
                color: stat.porcentaje === 100 ? '#10B981' : undefined,
              }}
            >
              {stat.completadas}/{stat.total}
            </Badge>
            {stat.vencidas > 0 && (
              <span className="flex items-center gap-0.5 text-destructive">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs">{stat.vencidas}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}