import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  const getFilteredOptions = (section: FilterSection) => {
    const searchValue = searchInputs[section.id]?.toLowerCase() || "";
    if (!searchValue || !section.options) return section.options || [];
    return section.options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue)
    );
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2 h-9"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {totalActiveFilters > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {totalActiveFilters}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "w-64 shrink-0 border-r border-border bg-card animate-fade-in",
        className
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Filtros</span>
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

      <ScrollArea className="h-[calc(100vh-200px)]">
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
                <span className="text-sm font-medium">{section.label}</span>
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
