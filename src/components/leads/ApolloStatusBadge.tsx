import { cn } from "@/lib/utils";
import { Check, Circle, Clock, AlertCircle } from "lucide-react";

type ApolloStatus = 'none' | 'pending' | 'ok' | 'error' | string | null | undefined;

interface ApolloStatusBadgeProps {
  status: ApolloStatus;
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Check; color: string; bg: string; label: string }> = {
  ok: {
    icon: Check,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    label: "ok"
  },
  pending: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "pending"
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "error"
  },
  none: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/50 border-muted",
    label: "none"
  }
};

export function ApolloStatusBadge({ status, className }: ApolloStatusBadgeProps) {
  const normalizedStatus = status || 'none';
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.none;
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium",
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}
