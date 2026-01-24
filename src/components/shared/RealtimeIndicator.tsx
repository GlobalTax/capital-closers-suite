import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function RealtimeIndicator({ isConnected, className }: RealtimeIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected 
            ? "bg-green-500 animate-pulse" 
            : "bg-destructive"
        )}
      />
      <span className="text-muted-foreground">
        {isConnected ? "Live" : "Desconectado"}
      </span>
    </div>
  );
}
