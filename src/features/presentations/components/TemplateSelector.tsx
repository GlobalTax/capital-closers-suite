import { 
  FileText, 
  Building2, 
  Users, 
  Target, 
  FileType,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { PresentationType } from "@/types/presentations";
import { TEMPLATE_DEFINITIONS } from "@/types/presentations";

interface TemplateSelectorProps {
  selectedType: PresentationType | null;
  onSelect: (type: PresentationType) => void;
}

const TEMPLATE_ICONS: Record<PresentationType, React.ElementType> = {
  teaser_sell: Target,
  firm_deck: Building2,
  client_deck: Users,
  mandate_deck: FileText,
  one_pager: FileType,
  custom: Sparkles,
};

const TEMPLATE_COLORS: Record<PresentationType, string> = {
  teaser_sell: 'text-blue-500',
  firm_deck: 'text-emerald-500',
  client_deck: 'text-violet-500',
  mandate_deck: 'text-amber-500',
  one_pager: 'text-rose-500',
  custom: 'text-slate-500',
};

export function TemplateSelector({ selectedType, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {(Object.entries(TEMPLATE_DEFINITIONS) as [PresentationType, typeof TEMPLATE_DEFINITIONS[PresentationType]][]).map(
        ([type, def]) => {
          const Icon = TEMPLATE_ICONS[type];
          const isSelected = selectedType === type;

          return (
            <Card
              key={type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(type)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                    "bg-muted"
                  )}>
                    <Icon className={cn("h-6 w-6", TEMPLATE_COLORS[type])} />
                  </div>
                  <h3 className="text-base mb-1">{def.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {def.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {def.slideCount} slides
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        }
      )}
    </div>
  );
}

export default TemplateSelector;
