import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Bookmark,
  Search,
  SlidersHorizontal,
} from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSection {
  id: string;
  label: string;
  type: "checkbox" | "range" | "search";
  options?: FilterOption[];
  defaultOpen?: boolean;
  // Propiedades para filtros de rango
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
}

export interface FilterPanelProps {
  sections: FilterSection[];
  values: Record<string, string[]>;
  onChange: (sectionId: string, values: string[]) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
  savedSearches?: { id: string; name: string; filters: Record<string, string[]> }[];
  onApplySavedSearch?: (filters: Record<string, string[]>) => void;
  onSaveSearch?: (name: string) => void;
  className?: string;
}

export function FilterPanel({
  sections,
  values,
  onChange,
  onClearAll,
  isOpen,
  onToggle,
  savedSearches = [],
  onApplySavedSearch,
  onSaveSearch,
  className,
}: FilterPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => {
      acc[section.id] = section.defaultOpen ?? true;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [rangeValues, setRangeValues] = useState<Record<string, [number, number]>>({});

  // Inicializar valores de rango desde values prop
  useEffect(() => {
    sections.forEach((section) => {
      if (section.type === "range") {
        const currentValue = values[section.id]?.[0];
        if (currentValue && currentValue.includes("-")) {
          const [min, max] = currentValue.split("-").map(Number);
          if (!isNaN(min) && !isNaN(max)) {
            setRangeValues((prev) => ({ ...prev, [section.id]: [min, max] }));
          }
        } else if (!rangeValues[section.id]) {
          // Inicializar con valores por defecto
          setRangeValues((prev) => ({
            ...prev,
            [section.id]: [section.min ?? 0, section.max ?? 100],
          }));
        }
      }
    });
  }, [sections, values]);

  const totalActiveFilters = Object.values(values).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleCheckboxChange = (
    sectionId: string,
    optionValue: string,
    checked: boolean
  ) => {
    const current = values[sectionId] || [];
    if (checked) {
      onChange(sectionId, [...current, optionValue]);
    } else {
      onChange(sectionId, current.filter((v) => v !== optionValue));
    }
  };

  const handleSearchChange = (sectionId: string, value: string) => {
    setSearchInputs((prev) => ({ ...prev, [sectionId]: value }));
    // Para búsquedas, actualizamos inmediatamente con el valor
    if (value) {
      onChange(sectionId, [value]);
    } else {
      onChange(sectionId, []);
    }
  };

  const handleRangeChange = (sectionId: string, newRange: [number, number]) => {
    setRangeValues((prev) => ({ ...prev, [sectionId]: newRange }));
  };

  const handleRangeCommit = (sectionId: string, range: [number, number]) => {
    // Notificar cambio como "min-max" string
    onChange(sectionId, [`${range[0]}-${range[1]}`]);
  };

  const getFilteredOptions = (section: FilterSection) => {
    const searchValue = searchInputs[section.id]?.toLowerCase() || "";
    if (!searchValue || !section.options) return section.options || [];
    return section.options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue)
    );
  };

  if (!isOpen) {
    return (
      <div 
        className="shrink-0 w-10 md:w-12 flex flex-col items-center py-3 md:py-4 border-r border-border bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        title="Abrir filtros"
      >
        <div className="h-8 w-8 md:h-10 md:w-10 relative flex items-center justify-center">
          <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          {totalActiveFilters > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center text-[9px] md:text-[10px] font-medium"
            >
              {totalActiveFilters}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-56 md:w-64 shrink-0 border-r border-border bg-card animate-fade-in",
        "fixed md:relative inset-y-0 left-0 z-40 md:z-auto",
        "shadow-lg md:shadow-none",
        className
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Filtros</span>
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {totalActiveFilters}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
        <div className="p-4 space-y-4">
          {/* Búsquedas guardadas */}
          {savedSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bookmark className="h-3 w-3" />
                <span>Guardadas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {savedSearches.map((search) => (
                  <Badge
                    key={search.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors text-xs"
                    onClick={() => onApplySavedSearch?.(search.filters)}
                  >
                    {search.name}
                  </Badge>
                ))}
              </div>
              <Separator className="my-3" />
            </div>
          )}

          {/* Secciones de filtros */}
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-accent/50 rounded-md px-2 transition-colors">
                <span className="text-sm">{section.label}</span>
                <div className="flex items-center gap-2">
                  {values[section.id]?.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {values[section.id].length}
                    </Badge>
                  )}
                  {openSections[section.id] ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="pt-2 pb-1">
                {section.type === "checkbox" && section.options && (
                  <div className="space-y-2 pl-2">
                    {section.options.length > 5 && (
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Buscar..."
                          value={searchInputs[section.id] || ""}
                          onChange={(e) =>
                            setSearchInputs((prev) => ({
                              ...prev,
                              [section.id]: e.target.value,
                            }))
                          }
                          className="h-7 text-xs pl-7"
                        />
                      </div>
                    )}
                    {getFilteredOptions(section).map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`${section.id}-${option.value}`}
                          checked={
                            values[section.id]?.includes(option.value) ?? false
                          }
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(
                              section.id,
                              option.value,
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor={`${section.id}-${option.value}`}
                          className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                        >
                          <span>{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {option.count}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === "search" && (
                  <div className="pl-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder={`Buscar ${section.label.toLowerCase()}...`}
                        value={searchInputs[section.id] || ""}
                        onChange={(e) =>
                          handleSearchChange(section.id, e.target.value)
                        }
                        className="h-8 text-sm pl-7"
                      />
                    </div>
                  </div>
                )}

                {section.type === "range" && (
                  <div className="pl-2 pr-4 space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {section.formatValue
                          ? section.formatValue(rangeValues[section.id]?.[0] ?? section.min ?? 0)
                          : rangeValues[section.id]?.[0] ?? section.min ?? 0}
                      </span>
                      <span>
                        {section.formatValue
                          ? section.formatValue(rangeValues[section.id]?.[1] ?? section.max ?? 100)
                          : rangeValues[section.id]?.[1] ?? section.max ?? 100}
                      </span>
                    </div>
                    <Slider
                      min={section.min ?? 0}
                      max={section.max ?? 100}
                      step={section.step ?? 1}
                      value={rangeValues[section.id] ?? [section.min ?? 0, section.max ?? 100]}
                      onValueChange={(val) => handleRangeChange(section.id, val as [number, number])}
                      onValueCommit={(val) => handleRangeCommit(section.id, val as [number, number])}
                      className="w-full"
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Footer con acciones */}
      <div className="p-4 border-t border-border space-y-2">
        {totalActiveFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-2" />
            Limpiar filtros ({totalActiveFilters})
          </Button>
        )}
      </div>
    </div>
  );
}