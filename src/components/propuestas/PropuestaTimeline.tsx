import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Check, X, Send, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropuestaHonorarios } from "@/types/propuestas";

interface PropuestaTimelineProps {
  propuestas: PropuestaHonorarios[];
  onSelect: (propuesta: PropuestaHonorarios) => void;
  selectedId?: string;
}

export function PropuestaTimeline({ propuestas, onSelect, selectedId }: PropuestaTimelineProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);

  const getIcon = (estado: string) => {
    switch (estado) {
      case "aceptada": return Check;
      case "rechazada": return X;
      case "enviada": return Send;
      default: return FileText;
    }
  };

  const getColor = (estado: string) => {
    switch (estado) {
      case "aceptada": return "bg-green-500 text-white";
      case "rechazada": return "bg-destructive text-destructive-foreground";
      case "enviada": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (propuestas.length === 0) return null;

  return (
    <div className="space-y-0">
      {propuestas.map((propuesta, index) => {
        const Icon = getIcon(propuesta.estado);
        const isLast = index === propuestas.length - 1;
        const isSelected = propuesta.id === selectedId;

        return (
          <div
            key={propuesta.id}
            className={cn(
              "relative flex gap-3 cursor-pointer group",
              !isLast && "pb-4"
            )}
            onClick={() => onSelect(propuesta)}
          >
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-20px)] bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                getColor(propuesta.estado)
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div
              className={cn(
                "flex-1 p-3 rounded-lg border transition-colors",
                isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">v{propuesta.version}</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {propuesta.estado}
                  </span>
                </div>
                <span className="font-semibold">{formatCurrency(propuesta.importe_total)}</span>
              </div>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {propuesta.titulo}
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(parseISO(propuesta.created_at), "d MMM yyyy", { locale: es })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
