import { useState, useRef, useEffect } from "react";
import { Search, Building2, User, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useGlobalLeadSearch,
  GlobalLead,
  getSourceLabel,
  getSourceColor,
} from "@/hooks/useGlobalLeadSearch";

interface GlobalLeadSearchProps {
  value: GlobalLead | null;
  onSelect: (lead: GlobalLead | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function GlobalLeadSearch({
  value,
  onSelect,
  placeholder = "Buscar lead o prospecto...",
  disabled = false,
  className,
}: GlobalLeadSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { leads, isLoading } = useGlobalLeadSearch(searchTerm);

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (lead: GlobalLead) => {
    onSelect(lead);
    setSearchTerm("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {value ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="truncate">{value.companyName}</span>
              <Badge variant="secondary" className={cn("text-xs shrink-0", getSourceColor(value.source))}>
                {getSourceLabel(value.source)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-auto shrink-0 hover:bg-destructive/10"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder="Escribe para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {searchTerm.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados
            </div>
          ) : (
            <div className="py-1">
              {leads.map((lead) => (
                <button
                  key={`${lead.sourceTable}-${lead.id}`}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-start gap-3 transition-colors"
                  onClick={() => handleSelect(lead)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{lead.companyName}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs shrink-0", getSourceColor(lead.source))}
                      >
                        {getSourceLabel(lead.source)}
                      </Badge>
                    </div>
                    {(lead.contactName || lead.contactEmail) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <User className="h-3 w-3" />
                        <span className="truncate">
                          {lead.contactName}
                          {lead.contactName && lead.contactEmail && " · "}
                          {lead.contactEmail}
                        </span>
                      </div>
                    )}
                    {lead.source === 'mandate_lead' && lead.mandatoName && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Mandato: {lead.mandatoName}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
