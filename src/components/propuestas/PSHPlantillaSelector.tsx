import { FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePSHPlantillas } from "@/hooks/usePSHPlantillas";
import type { PSHPlantilla } from "@/types/psh";

interface PSHPlantillaSelectorProps {
  selectedId?: string;
  onSelect: (plantilla: PSHPlantilla) => void;
}

export function PSHPlantillaSelector({ selectedId, onSelect }: PSHPlantillaSelectorProps) {
  const { data: plantillas, isLoading } = usePSHPlantillas();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!plantillas?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay plantillas disponibles
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {plantillas.map((plantilla) => {
        const isSelected = selectedId === plantilla.id;
        const totalDD = Object.values(plantilla.alcance_default || {})
          .filter((a) => a?.incluido)
          .reduce((sum, a) => sum + (a?.importe || 0), 0);

        return (
          <Card
            key={plantilla.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              isSelected && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => onSelect(plantilla)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-medium truncate">{plantilla.nombre}</h4>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  {plantilla.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {plantilla.descripcion}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {plantilla.tipo_servicio.replace('_', ' + ').toUpperCase()}
                </Badge>
                {totalDD > 0 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    Desde {totalDD.toLocaleString('es-ES')} €
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
