import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
  accionLabel?: string;
  onAccion?: () => void;
}

export function EmptyState({
  icon: Icon,
  titulo,
  descripcion,
  accionLabel,
  onAccion,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{titulo}</h3>
      {descripcion && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{descripcion}</p>
      )}
      {accionLabel && onAccion && (
        <Button onClick={onAccion}>{accionLabel}</Button>
      )}
    </div>
  );
}
