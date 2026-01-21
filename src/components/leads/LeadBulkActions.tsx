import { Button } from "@/components/ui/button";
import { X, Phone, Download, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadBulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  onMarkContacted?: () => void;
  onExport?: () => void;
  onEnrichApollo?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function LeadBulkActions({
  selectedCount,
  onClear,
  onMarkContacted,
  onExport,
  onEnrichApollo,
  onDelete,
  className,
}: LeadBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-2.5 rounded-lg",
        "bg-card border shadow-lg",
        "animate-in slide-in-from-bottom-4 duration-200",
        className
      )}
    >
      <div className="flex items-center gap-2 pr-3 border-r">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {onMarkContacted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkContacted}
            className="h-8 text-xs gap-1.5"
          >
            <Phone className="h-3.5 w-3.5" />
            Contactado
          </Button>
        )}
        {onExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        )}
        {onEnrichApollo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnrichApollo}
            className="h-8 text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Apollo
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
