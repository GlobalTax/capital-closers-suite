import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Shield, ChevronDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface WatermarkToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  template: string;
  onTemplateChange: (template: string) => void;
}

const DEFAULT_TEMPLATE = "Confidencial — {nombre} — {email} — ID:{id}";

export function WatermarkToggle({
  enabled,
  onEnabledChange,
  template,
  onTemplateChange,
}: WatermarkToggleProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Preview watermark with sample data
  const previewText = template
    .replace("{nombre}", "Juan García")
    .replace("{email}", "juan@ejemplo.com")
    .replace("{id}", "ABC12345");

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label htmlFor="watermark-toggle" className="text-sm font-medium">
              Watermark personalizado
            </Label>
            <p className="text-xs text-muted-foreground">
              Cada destinatario recibirá un PDF único con su nombre
            </p>
          </div>
        </div>
        <Switch
          id="watermark-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
            Personalizar plantilla
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="watermark-template" className="text-xs">
                  Plantilla de watermark
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Variables disponibles:<br />
                        <code>{"{nombre}"}</code> - Nombre del destinatario<br />
                        <code>{"{email}"}</code> - Email del destinatario<br />
                        <code>{"{id}"}</code> - ID único de la campaña
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="watermark-template"
                value={template}
                onChange={(e) => onTemplateChange(e.target.value)}
                placeholder={DEFAULT_TEMPLATE}
                className="text-sm"
              />
            </div>

            <div className="p-3 bg-background rounded border">
              <p className="text-xs text-muted-foreground mb-1">Vista previa:</p>
              <Badge variant="secondary" className="text-xs font-mono">
                {previewText}
              </Badge>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
