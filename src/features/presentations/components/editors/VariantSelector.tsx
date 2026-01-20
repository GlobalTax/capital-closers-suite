import { cn } from "@/lib/utils";
import { LayoutVariant } from "@/types/presentations";
import { LayoutGrid, Grid3X3, Layers } from "lucide-react";
import { Label } from "@/components/ui/label";

interface VariantSelectorProps {
  value: LayoutVariant;
  onChange: (variant: LayoutVariant) => void;
  layout: string;
}

const VARIANT_INFO: Record<LayoutVariant, { label: string; icon: React.ElementType; description: string }> = {
  A: { label: 'Clásico', icon: LayoutGrid, description: 'Layout tradicional' },
  B: { label: 'Grid', icon: Grid3X3, description: 'Con iconos/grid' },
  C: { label: 'Hero', icon: Layers, description: 'Destacado principal' },
};

const LAYOUT_VARIANT_NAMES: Record<string, Record<LayoutVariant, string>> = {
  stats: { A: 'Cards', B: 'Grid con iconos', C: 'Hero stat' },
  bullets: { A: 'Lista simple', B: '2 columnas', C: 'Cards' },
  team: { A: 'Grid 4 cols', B: 'Cards horizontal', C: 'Lista ejecutiva' },
  comparison: { A: '2 columnas', B: 'Tabla', C: 'Cards enfrentados' },
  timeline: { A: 'Vertical', B: 'Horizontal', C: 'Cards timeline' },
  financials: { A: 'Métricas grid', B: 'KPIs destacados', C: 'Tabla evolución' },
  overview: { A: 'Texto + bullets', B: 'Split 50/50', C: 'Full width' },
};

export function VariantSelector({ value, onChange, layout }: VariantSelectorProps) {
  const variantNames = LAYOUT_VARIANT_NAMES[layout] || { A: 'Variante A', B: 'Variante B', C: 'Variante C' };
  
  return (
    <div className="space-y-2">
      <Label>Variante de diseño</Label>
      <div className="grid grid-cols-3 gap-2">
        {(['A', 'B', 'C'] as LayoutVariant[]).map((variant) => {
          const info = VARIANT_INFO[variant];
          const Icon = info.icon;
          const isSelected = value === variant;
          
          return (
            <button
              key={variant}
              type="button"
              onClick={() => onChange(variant)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                "hover:bg-accent/50",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-background"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}>
                {variantNames[variant]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VariantSelector;
