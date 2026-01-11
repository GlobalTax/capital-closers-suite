import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns3 } from "lucide-react";

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  locked?: boolean; // Columnas que no se pueden ocultar
}

interface ColumnToggleProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
  storageKey?: string;
}

export function ColumnToggle({ columns, onChange, storageKey }: ColumnToggleProps) {
  const [localColumns, setLocalColumns] = useState(columns);

  // Cargar preferencias guardadas
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const savedVisibility = JSON.parse(stored) as Record<string, boolean>;
          const updated = columns.map((col) => ({
            ...col,
            visible: col.locked ? true : (savedVisibility[col.key] ?? col.visible),
          }));
          setLocalColumns(updated);
          onChange(updated);
        }
      } catch (error) {
        console.error("Error loading column preferences:", error);
      }
    }
  }, [storageKey]);

  const handleToggle = (key: string, visible: boolean) => {
    const updated = localColumns.map((col) =>
      col.key === key && !col.locked ? { ...col, visible } : col
    );
    setLocalColumns(updated);
    onChange(updated);

    // Persistir
    if (storageKey) {
      const visibility = Object.fromEntries(
        updated.map((col) => [col.key, col.visible])
      );
      localStorage.setItem(storageKey, JSON.stringify(visibility));
    }
  };

  const visibleCount = localColumns.filter((c) => c.visible).length;
  const totalCount = localColumns.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">Columnas</span>
          <span className="text-xs text-muted-foreground">
            {visibleCount}/{totalCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto py-1">
          {localColumns.map((column) => (
            <label
              key={column.key}
              className="flex items-center gap-3 px-2 py-1.5 hover:bg-muted/50 rounded-sm cursor-pointer"
            >
              <Checkbox
                checked={column.visible}
                onCheckedChange={(checked) => handleToggle(column.key, !!checked)}
                disabled={column.locked}
              />
              <span className="text-sm flex-1">{column.label}</span>
              {column.locked && (
                <span className="text-[10px] text-muted-foreground">Fija</span>
              )}
            </label>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
