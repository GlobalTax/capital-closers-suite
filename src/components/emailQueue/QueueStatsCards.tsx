import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, CheckCircle, XCircle, Ban, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueStatsCardsProps {
  stats: Record<string, number>;
  loading: boolean;
  onStatusClick: (status: string) => void;
}

const statusConfig = [
  {
    key: "pending",
    label: "Pendientes",
    icon: Clock,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    key: "sending",
    label: "Enviando",
    icon: Loader2,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    key: "sent",
    label: "Enviados",
    icon: CheckCircle,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    key: "failed",
    label: "Fallidos",
    icon: XCircle,
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10 hover:bg-destructive/20",
  },
  {
    key: "cancelled",
    label: "Cancelados",
    icon: Ban,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted hover:bg-muted/80",
  },
  {
    key: "queued",
    label: "En cola",
    icon: Send,
    colorClass: "text-indigo-500",
    bgClass: "bg-indigo-500/10 hover:bg-indigo-500/20",
  },
];

export function QueueStatsCards({ stats, loading, onStatusClick }: QueueStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statusConfig.map((config) => (
          <Card key={config.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statusConfig.map((config) => {
        const Icon = config.icon;
        const count = stats[config.key] || 0;
        
        return (
          <Card
            key={config.key}
            className={cn(
              "cursor-pointer transition-colors",
              config.bgClass
            )}
            onClick={() => onStatusClick(config.key)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                  <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                </div>
                <Icon className={cn("h-8 w-8", config.colorClass)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
