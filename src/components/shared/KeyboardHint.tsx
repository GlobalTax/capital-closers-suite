import { cn } from "@/lib/utils";

interface KeyboardHintProps {
  shortcut: string;
  className?: string;
}

export function KeyboardHint({ shortcut, className }: KeyboardHintProps) {
  return (
    <kbd
      className={cn(
        "hidden md:inline-flex items-center justify-center",
        "h-5 min-w-[20px] px-1.5 rounded",
        "bg-muted/80 border border-border/50",
        "text-[10px] font-medium text-muted-foreground",
        "font-mono tracking-wide",
        className
      )}
    >
      {shortcut}
    </kbd>
  );
}

interface KeyboardHintGroupProps {
  shortcuts: string[];
  separator?: string;
  className?: string;
}

export function KeyboardHintGroup({ 
  shortcuts, 
  separator = "+",
  className 
}: KeyboardHintGroupProps) {
  return (
    <span className={cn("hidden md:inline-flex items-center gap-0.5", className)}>
      {shortcuts.map((shortcut, index) => (
        <span key={shortcut} className="flex items-center gap-0.5">
          <KeyboardHint shortcut={shortcut} />
          {index < shortcuts.length - 1 && (
            <span className="text-[10px] text-muted-foreground">{separator}</span>
          )}
        </span>
      ))}
    </span>
  );
}
