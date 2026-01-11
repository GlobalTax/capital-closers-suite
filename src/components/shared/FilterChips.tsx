import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  sectionId: string;
  sectionLabel: string;
  value: string;
  label: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (sectionId: string, value: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterChips({
  chips,
  onRemove,
  onClearAll,
  className,
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap py-2 animate-fade-in",
        className
      )}
    >
      <span className="text-xs text-muted-foreground">Filtros activos:</span>
      {chips.map((chip, index) => (
        <Badge
          key={`${chip.sectionId}-${chip.value}-${index}`}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-1 text-xs font-normal hover:bg-secondary/80 transition-colors group"
        >
          <span className="text-muted-foreground">{chip.sectionLabel}:</span>
          <span>{chip.label}</span>
          <button
            onClick={() => onRemove(chip.sectionId, chip.value)}
            className="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpiar todo
        </Button>
      )}
    </div>
  );
}
