import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignJustify, StretchHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewDensity = "compact" | "comfortable";

interface ViewDensityToggleProps {
  value: ViewDensity;
  onChange: (density: ViewDensity) => void;
  storageKey?: string;
}

export function ViewDensityToggle({ value, onChange, storageKey }: ViewDensityToggleProps) {
  const handleChange = (density: ViewDensity) => {
    onChange(density);
    if (storageKey) {
      localStorage.setItem(storageKey, density);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          {value === "compact" ? (
            <AlignJustify className="h-4 w-4" />
          ) : (
            <StretchHorizontal className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {value === "compact" ? "Compacta" : "Cómoda"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleChange("compact")}
          className={cn(value === "compact" && "bg-muted")}
        >
          <AlignJustify className="h-4 w-4 mr-2" />
          Vista compacta
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleChange("comfortable")}
          className={cn(value === "comfortable" && "bg-muted")}
        >
          <StretchHorizontal className="h-4 w-4 mr-2" />
          Vista cómoda
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook para persistir preferencia
import { useState, useEffect } from "react";

export function useViewDensity(storageKey: string, defaultValue: ViewDensity = "comfortable") {
  const [density, setDensity] = useState<ViewDensity>(defaultValue);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "compact" || stored === "comfortable") {
      setDensity(stored);
    }
  }, [storageKey]);

  return [density, setDensity] as const;
}
