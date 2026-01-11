import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { TVLeadCard } from "./TVLeadCard";
import type { UnifiedLead } from "@/services/dashboardTV";
import type { LucideIcon } from "lucide-react";

interface TVColumnProps {
  title: string;
  leads: UnifiedLead[];
  color: 'slate' | 'zinc' | 'neutral' | 'stone' | 'gray' | 'emerald';
  icon: LucideIcon;
}

const headerColorClasses = {
  slate: 'bg-slate-50 border-slate-200 dark:bg-slate-900/10 dark:border-slate-800',
  zinc: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/10 dark:border-zinc-800',
  neutral: 'bg-neutral-50 border-neutral-200 dark:bg-neutral-900/10 dark:border-neutral-800',
  stone: 'bg-stone-50 border-stone-200 dark:bg-stone-900/10 dark:border-stone-800',
  gray: 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800',
  emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
};

const iconColorClasses = {
  slate: 'text-slate-700 dark:text-slate-300',
  zinc: 'text-zinc-700 dark:text-zinc-300',
  neutral: 'text-neutral-700 dark:text-neutral-300',
  stone: 'text-stone-700 dark:text-stone-300',
  gray: 'text-gray-700 dark:text-gray-300',
  emerald: 'text-emerald-700 dark:text-emerald-300'
};

export function TVColumn({ title, leads, color, icon: Icon }: TVColumnProps) {
  const totalValor = leads.reduce((sum, lead) => sum + (lead.valor || 0), 0);
  const isSaturated = leads.length > 10;

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-md border border-border overflow-hidden">
      {/* Header */}
      <div className={`${headerColorClasses[color]} p-4 border-b border-border`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
            <h2 className="text-2xl font-medium text-foreground">{title}</h2>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2 font-medium">
            {leads.length}
          </Badge>
        </div>

        {/* Métricas */}
        {totalValor > 0 && (
          <p className="text-lg font-medium text-foreground mt-2">
            Total: {new Intl.NumberFormat('es-ES', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0,
              notation: 'compact'
            }).format(totalValor)}
          </p>
        )}

        {/* Alerta de saturación */}
        {isSaturated && (
          <div className="mt-3 flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Columna saturada</span>
          </div>
        )}

        {/* Progress bar si está saturado */}
        {isSaturated && (
          <Progress value={Math.min((leads.length / 15) * 100, 100)} className="mt-2" />
        )}
      </div>

      {/* Cards scrollables */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Icon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No hay items en esta fase</p>
          </div>
        ) : (
          leads.map(lead => (
            <TVLeadCard key={lead.id} lead={lead} />
          ))
        )}
      </div>
    </div>
  );
}
