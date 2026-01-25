import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_VARIABLES } from "@/services/emailTemplate.service";

interface VariableInsertBarProps {
  onInsert: (variable: string) => void;
  activeField: "subject" | "body";
}

export function VariableInsertBar({ onInsert, activeField }: VariableInsertBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Variables disponibles</span>
        <Badge variant="outline" className="text-xs">
          Insertando en: {activeField === "subject" ? "Asunto" : "Cuerpo"}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_VARIABLES.map((variable) => (
          <Tooltip key={variable.key}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs font-mono"
                onClick={() => onInsert(variable.key)}
              >
                {`{{${variable.key}}}`}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">{variable.label}</p>
              {variable.example && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ejemplo: {variable.example}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
