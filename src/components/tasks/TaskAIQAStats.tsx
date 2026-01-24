import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import type { TaskAIStats } from "@/services/taskAIFeedback.service";

interface TaskAIQAStatsProps {
  stats: TaskAIStats | undefined;
  isLoading: boolean;
}

export function TaskAIQAStats({ stats, isLoading }: TaskAIQAStatsProps) {
  const cards = [
    {
      label: 'Total Eventos',
      value: stats?.total || 0,
      icon: Sparkles,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Alta Confianza',
      value: stats?.highConfidence || 0,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      suffix: stats?.total ? `(${Math.round((stats.highConfidence / stats.total) * 100)}%)` : '',
    },
    {
      label: 'Media Confianza',
      value: stats?.mediumConfidence || 0,
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      suffix: stats?.total ? `(${Math.round((stats.mediumConfidence / stats.total) * 100)}%)` : '',
    },
    {
      label: 'Feedback Positivo',
      value: stats?.withPositiveFeedback || 0,
      icon: ThumbsUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Feedback Negativo',
      value: stats?.withNegativeFeedback || 0,
      icon: ThumbsDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Sin Evaluar',
      value: stats?.pendingFeedback || 0,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {card.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{card.value}</span>
              {card.suffix && (
                <span className="text-xs text-muted-foreground">{card.suffix}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
