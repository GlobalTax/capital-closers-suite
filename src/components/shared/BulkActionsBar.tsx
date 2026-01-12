import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { X, Download, Trash2, Tag, UserPlus, CheckSquare } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface BulkAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-foreground text-background shadow-lg",
        "animate-slide-in-up",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4" />
        <span className="text-sm">
          {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator orientation="vertical" className="h-5 bg-background/20" />

      <div className="flex items-center gap-1">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "h-8 px-3 text-background/90 hover:text-background hover:bg-background/10",
              action.variant === "destructive" && "hover:bg-destructive hover:text-destructive-foreground"
            )}
          >
            <action.icon className="h-4 w-4 mr-1.5" />
            {action.label}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-5 bg-background/20" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="h-8 px-2 text-background/70 hover:text-background hover:bg-background/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Acciones comunes predefinidas
export const commonBulkActions = {
  export: (onClick: () => void): BulkAction => ({
    icon: Download,
    label: "Exportar",
    onClick,
  }),
  delete: (onClick: () => void): BulkAction => ({
    icon: Trash2,
    label: "Eliminar",
    onClick,
    variant: "destructive",
  }),
  tag: (onClick: () => void): BulkAction => ({
    icon: Tag,
    label: "Etiquetar",
    onClick,
  }),
  assign: (onClick: () => void): BulkAction => ({
    icon: UserPlus,
    label: "Asignar",
    onClick,
  }),
};
