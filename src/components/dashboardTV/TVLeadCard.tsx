import { Badge } from "@/components/ui/badge";
import type { UnifiedLead } from "@/services/dashboardTV";

interface TVLeadCardProps {
  lead: UnifiedLead;
}

const colorClasses = {
  purple: 'bg-purple-100 border-purple-500 dark:bg-purple-900/20',
  blue: 'bg-blue-100 border-blue-500 dark:bg-blue-900/20',
  green: 'bg-green-100 border-green-500 dark:bg-green-900/20',
  orange: 'bg-orange-100 border-orange-500 dark:bg-orange-900/20',
  red: 'bg-red-100 border-red-500 dark:bg-red-900/20',
  emerald: 'bg-emerald-100 border-emerald-600 dark:bg-emerald-900/20'
};

const badgeColorClasses = {
  purple: 'bg-purple-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  orange: 'bg-orange-500 text-white',
  red: 'bg-red-500 text-white',
  emerald: 'bg-emerald-600 text-white'
};

const iconBgClasses = {
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  emerald: 'bg-emerald-600'
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
        min-h-[140px] p-4 rounded-lg border-l-4 
        ${colorClasses[lead.colorScheme]} 
        hover:shadow-lg transition-all duration-300
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
          <IconComponent className="w-7 h-7 text-white" />
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
