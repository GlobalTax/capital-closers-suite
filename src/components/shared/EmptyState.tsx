import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
  accionLabel?: string;
  onAccion?: () => void;
  variant?: "default" | "card";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  titulo,
  descripcion,
  accionLabel,
  onAccion,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        "animate-in fade-in-0 duration-300",
        variant === "card" && "border-2 border-dashed rounded-lg bg-muted/20",
        className
      )}
    >
      {/* Icono con decoración sutil */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl scale-150" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center border border-border/50">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      </div>
      
      {/* Título */}
      <h3 className="text-lg text-foreground mb-2">{titulo}</h3>
      
      {/* Descripción */}
      {descripcion && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {descripcion}
        </p>
      )}
      
      {/* CTA prominente */}
      {accionLabel && onAccion && (
        <Button 
          onClick={onAccion} 
          size="lg"
          className="gap-2 shadow-sm hover:shadow-md transition-shadow"
        >
          {accionLabel}
        </Button>
      )}
    </div>
  );
}
