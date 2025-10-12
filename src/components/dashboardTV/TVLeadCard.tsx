import { Badge } from "@/components/ui/badge";
import type { UnifiedLead } from "@/services/dashboardTV";

interface TVLeadCardProps {
  lead: UnifiedLead;
}

const colorClasses = {
  purple: 'bg-purple-50 border-purple-300 dark:bg-purple-900/10 dark:border-purple-700',
  blue: 'bg-blue-50 border-blue-300 dark:bg-blue-900/10 dark:border-blue-700',
  green: 'bg-green-50 border-green-300 dark:bg-green-900/10 dark:border-green-700',
  orange: 'bg-orange-50 border-orange-300 dark:bg-orange-900/10 dark:border-orange-700',
  red: 'bg-red-50 border-red-300 dark:bg-red-900/10 dark:border-red-700',
  emerald: 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-700'
};

const badgeColorClasses = {
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
};

const iconBgClasses = {
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
};

const tipoLabels = {
  valoracion: 'Valoración',
  contacto: 'Contacto',
  colaborador: 'Colaborador',
  mandato: 'Mandato'
};

export function TVLeadCard({ lead }: TVLeadCardProps) {
  const IconComponent = lead.icono;

  return (
    <div 
      className={`
        min-h-[140px] p-4 rounded-lg border-l-2 
        ${colorClasses[lead.colorScheme]} 
        hover:shadow-md transition-all duration-300
        animate-fade-in
      `}
    >
      {/* Badge superior con tipo */}
      <div className="flex items-center justify-between mb-3">
        <Badge className={`${badgeColorClasses[lead.colorScheme]} text-base px-3 py-1`}>
          {tipoLabels[lead.tipo]}
        </Badge>
        {lead.diasEnFase !== undefined && lead.diasEnFase > 7 && (
          <Badge variant="destructive" className="text-sm">
            ⚠️ {lead.diasEnFase}d
          </Badge>
        )}
      </div>

      {/* Contenido principal */}
      <div className="flex gap-4">
        {/* Icono circular */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-full ${iconBgClasses[lead.colorScheme]} flex items-center justify-center`}>
          <IconComponent className="w-7 h-7" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-foreground truncate mb-1">
            {lead.titulo}
          </h3>
          <p className="text-base text-muted-foreground truncate mb-2">
            {lead.subtitulo}
          </p>
          
          {/* Valor económico */}
          {lead.valor && (
            <p className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat('es-ES', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 0
              }).format(lead.valor)}
            </p>
          )}
        </div>
      </div>

      {/* Footer con tiempo en fase */}
      {lead.diasEnFase !== undefined && (
        <div className="mt-3 pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Hace {lead.diasEnFase} {lead.diasEnFase === 1 ? 'día' : 'días'}
          </p>
        </div>
      )}
    </div>
  );
}
