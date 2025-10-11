import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, TrendingUp, GripVertical } from "lucide-react";
import { Mandato } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MandatoCardProps {
  mandato: Mandato;
}

export function MandatoCard({ mandato }: MandatoCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mandato.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
      onClick={() => navigate(`/mandatos/${mandato.id}`)}
    >
      <div className="space-y-2">
        {/* Header con drag handle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={mandato.tipo === "venta" ? "default" : "secondary"} className="text-xs">
                {mandato.tipo === "venta" ? "Venta" : "Compra"}
              </Badge>
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <h4 className="font-medium text-sm truncate">
              {mandato.empresa_principal?.nombre || "Sin cliente"}
            </h4>
          </div>
        </div>

        {/* Descripción */}
        {mandato.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {mandato.descripcion}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {mandato.valor && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{mandato.valor.toLocaleString('es-ES')} €</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>{mandato.empresas?.length || 0} targets</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(mandato.updated_at), "dd MMM", { locale: es })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
