import { Badge } from "@/components/ui/badge";
import { Check, Clock, FileText, Send, X, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import type { PropuestaEstado } from "@/types/propuestas";

interface PropuestaEstadoBadgeProps {
  estado: PropuestaEstado;
  fechaVencimiento?: string;
  showExpiry?: boolean;
}

export function PropuestaEstadoBadge({ estado, fechaVencimiento, showExpiry = true }: PropuestaEstadoBadgeProps) {
  const getVencimientoInfo = () => {
    if (!fechaVencimiento || estado !== 'enviada') return null;
    
    const dias = differenceInDays(parseISO(fechaVencimiento), new Date());
    
    if (dias < 0) return { label: "Vencida", isExpired: true };
    if (dias <= 7) return { label: `${dias}d`, isWarning: true };
    return null;
  };

  const config = {
    borrador: { label: "Borrador", className: "bg-muted text-muted-foreground", icon: FileText },
    enviada: { label: "Enviada", className: "bg-primary text-primary-foreground", icon: Send },
    aceptada: { label: "Aceptada", className: "bg-green-500 text-white", icon: Check },
    rechazada: { label: "Rechazada", className: "bg-destructive text-destructive-foreground", icon: X },
  };

  const { label, className, icon: Icon } = config[estado];
  const vencimiento = getVencimientoInfo();

  return (
    <div className="flex items-center gap-1.5">
      <Badge className={`gap-1 ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
      {showExpiry && vencimiento && (
        <Badge className={`gap-1 ${vencimiento.isExpired ? 'bg-destructive text-destructive-foreground' : 'bg-yellow-500 text-white'}`}>
          {vencimiento.isExpired ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {vencimiento.label}
        </Badge>
      )}
    </div>
  );
}
