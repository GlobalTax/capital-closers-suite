import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { TVLeadCard } from "./TVLeadCard";
import type { UnifiedLead } from "@/services/dashboardTV";
import type { LucideIcon } from "lucide-react";

interface TVColumnProps {
  title: string;
  leads: UnifiedLead[];
  color: 'yellow' | 'blue' | 'green' | 'purple' | 'orange' | 'emerald';
  icon: LucideIcon;
}

const headerColorClasses = {
  yellow: 'bg-yellow-100 border-yellow-500 dark:bg-yellow-900/20',
  blue: 'bg-blue-100 border-blue-500 dark:bg-blue-900/20',
  green: 'bg-green-100 border-green-500 dark:bg-green-900/20',
  purple: 'bg-purple-100 border-purple-500 dark:bg-purple-900/20',
  orange: 'bg-orange-100 border-orange-500 dark:bg-orange-900/20',
  emerald: 'bg-emerald-100 border-emerald-600 dark:bg-emerald-900/20'
};

const iconColorClasses = {
  yellow: 'text-yellow-600 dark:text-yellow-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-600 dark:text-orange-400',
  emerald: 'text-emerald-600 dark:text-emerald-400'
};

export function TVColumn({ title, leads, color, icon: Icon }: TVColumnProps) {
  const totalValor = leads.reduce((sum, lead) => sum + (lead.valor || 0), 0);
  const isSaturated = leads.length > 10;

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-xl border-2 border-border overflow-hidden">
      {/* Header */}
      <div className={`${headerColorClasses[color]} p-4 border-b-2 border-border`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2 font-bold">
            {leads.length}
          </Badge>
        </div>

        {/* Métricas */}
        {totalValor > 0 && (
          <p className="text-lg font-semibold text-foreground mt-2">
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
            <span className="text-sm font-semibold">Columna saturada</span>
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
