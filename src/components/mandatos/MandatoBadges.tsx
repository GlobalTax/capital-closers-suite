import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Flag, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MandatoStatusBadgeType = 'urgente' | 'alta_prioridad' | 'en_plazo' | 'vencido' | 'nuevo';

interface MandatoBadgeProps {
  type: MandatoStatusBadgeType;
  className?: string;
}

const badgeConfig = {
  urgente: {
    label: 'Urgente',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  alta_prioridad: {
    label: 'Alta Prioridad',
    icon: Flag,
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
  en_plazo: {
    label: 'En Plazo',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  vencido: {
    label: 'Vencido',
    icon: XCircle,
    className: 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100',
  },
  nuevo: {
    label: 'Nuevo',
    icon: Sparkles,
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
};

export function MandatoBadge({ type, className }: MandatoBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
