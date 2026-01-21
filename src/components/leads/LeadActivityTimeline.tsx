import { useQuery } from "@tanstack/react-query";
import { Phone, Video, Users, Clock, FileText, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLeadActivities, type LeadActivity } from "@/services/leadActivities";

interface LeadActivityTimelineProps {
  leadId: string;
  leadType: 'contact' | 'valuation' | 'collaborator';
}

const activityIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Llamadas': Phone,
  'llamada': Phone,
  'Reuniones': Users,
  'videollamada': Video,
  'reunion': Users,
  'Trabajo': Clock,
  'default': FileText,
};

const activityColorMap: Record<string, string> = {
  'Llamadas': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'llamada': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'Reuniones': 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'videollamada': 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  'reunion': 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'default': 'text-gray-500 bg-gray-50 dark:bg-gray-950/30',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function LeadActivityTimeline({ leadId, leadType }: LeadActivityTimelineProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['lead-activities', leadId, leadType],
    queryFn: () => fetchLeadActivities(leadId, leadType),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No hay actividades registradas</p>
        <p className="text-xs text-muted-foreground mt-1">
          Registra llamadas, reuniones o tiempo dedicado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const Icon = activityIconMap[activity.activityType] || activityIconMap.default;
        const colorClass = activityColorMap[activity.activityType] || activityColorMap.default;

        return (
          <div key={activity.id} className="relative pl-8">
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-border" />
            )}

            {/* Icon */}
            <div className={`absolute left-0 top-0 p-1.5 rounded-full border-2 border-background ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content */}
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{activity.title}</span>
                      {activity.durationMinutes && activity.durationMinutes > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formatDuration(activity.durationMinutes)}
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(activity.date), "d MMM, HH:mm", { locale: es })}
                      </span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: es })}
                      </span>
                      {activity.createdByName && (
                        <>
                          <span>·</span>
                          <span>{activity.createdByName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
