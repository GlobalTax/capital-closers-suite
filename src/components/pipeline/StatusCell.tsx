import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StatusConfig } from "@/types/pipeline-tracker";

interface StatusCellProps {
  value: string | null | undefined;
  options: { value: string; label: string }[];
  config: Record<string, StatusConfig>;
  onUpdate: (value: string | null) => void;
  disabled?: boolean;
}

export function StatusCell({ value, options, config, onUpdate, disabled }: StatusCellProps) {
  const [open, setOpen] = useState(false);

  const currentConfig = value ? config[value] : null;
  const displayLabel = currentConfig?.label || '-';

  const handleSelect = (newValue: string) => {
    onUpdate(newValue === value ? null : newValue);
    setOpen(false);
  };

  if (disabled) {
    return (
      <div
        className={cn(
          "px-2 py-1 text-xs font-medium rounded text-center border",
          currentConfig?.bgColor || 'bg-muted',
          currentConfig?.textColor || 'text-muted-foreground',
          currentConfig?.borderColor || 'border-border'
        )}
      >
        {displayLabel}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full px-2 py-1 text-xs font-medium rounded text-center border cursor-pointer transition-all hover:opacity-80",
            currentConfig?.bgColor || 'bg-muted',
            currentConfig?.textColor || 'text-muted-foreground',
            currentConfig?.borderColor || 'border-border'
          )}
        >
          {displayLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="center">
        <div className="grid gap-1">
          {options.map((option) => {
            const optConfig = config[option.value];
            return (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start text-xs h-7",
                  value === option.value && "bg-accent"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    optConfig?.bgColor?.replace('/20', '')
                  )}
                />
                {option.label}
              </Button>
            );
          })}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-xs h-7 text-muted-foreground"
              onClick={() => handleSelect('')}
            >
              Limpiar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
