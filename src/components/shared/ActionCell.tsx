import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface ActionItem {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "ghost" | "destructive";
  disabled?: boolean;
}

interface ActionCellProps {
  actions: ActionItem[];
  className?: string;
  alwaysVisible?: boolean;
}

export function ActionCell({
  actions,
  className,
  alwaysVisible = false,
}: ActionCellProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex items-center gap-0.5",
          !alwaysVisible && "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          className
        )}
      >
        {actions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-md transition-colors",
                  action.variant === "destructive" &&
                    "hover:bg-destructive/10 hover:text-destructive"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                }}
                disabled={action.disabled}
              >
                <action.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
