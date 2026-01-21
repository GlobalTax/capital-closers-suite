import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export type QuickFilterKey = 
  | 'tech_1m' 
  | 'nuevos_hoy' 
  | 'sin_contactar' 
  | 'ebitda_alto' 
  | 'apollo_pendiente';

interface QuickFilter {
  key: QuickFilterKey;
  label: string;
  description?: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { key: 'tech_1m', label: 'Tech >1M', description: 'Sector tecnología con facturación >1M' },
  { key: 'nuevos_hoy', label: 'Nuevos hoy', description: 'Creados en las últimas 24h' },
  { key: 'sin_contactar', label: 'Sin contactar', description: 'Status = new' },
  { key: 'ebitda_alto', label: 'EBITDA alto', description: 'EBITDA > 500K' },
  { key: 'apollo_pendiente', label: 'Apollo pendiente', description: 'Sin enriquecer' },
];

interface LeadQuickFiltersProps {
  activeFilters: QuickFilterKey[];
  onToggleFilter: (key: QuickFilterKey) => void;
  className?: string;
}

export function LeadQuickFilters({ activeFilters, onToggleFilter, className }: LeadQuickFiltersProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Zap className="w-3.5 h-3.5" />
        <span>Rápido:</span>
      </div>
      {QUICK_FILTERS.map((filter) => {
        const isActive = activeFilters.includes(filter.key);
        return (
          <Button
            key={filter.key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFilter(filter.key)}
            className={cn(
              "h-7 text-xs px-2.5 rounded-full",
              isActive && "bg-primary text-primary-foreground"
            )}
            title={filter.description}
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

// Helper function to apply quick filters to leads
export function applyQuickFilters<T extends {
  tipo: string;
  sector?: string;
  facturacion?: number;
  ebitda?: number;
  fecha: string;
  status: string;
  apolloStatus?: string;
}>(
  leads: T[],
  activeFilters: QuickFilterKey[]
): T[] {
  if (activeFilters.length === 0) return leads;

  return leads.filter(lead => {
    // All active filters must match (AND logic)
    return activeFilters.every(filter => {
      switch (filter) {
        case 'tech_1m':
          return (
            lead.sector?.toLowerCase().includes('tech') || 
            lead.sector?.toLowerCase().includes('tecnología')
          ) && (lead.facturacion || 0) > 1000000;
        
        case 'nuevos_hoy': {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const leadDate = new Date(lead.fecha);
          return leadDate >= today;
        }
        
        case 'sin_contactar':
          return lead.status === 'new';
        
        case 'ebitda_alto':
          return (lead.ebitda || 0) > 500000;
        
        case 'apollo_pendiente':
          return !lead.apolloStatus || lead.apolloStatus === 'none';
        
        default:
          return true;
      }
    });
  });
}
