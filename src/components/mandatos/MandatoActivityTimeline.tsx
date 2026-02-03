import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MessageSquare, FileText, CheckSquare, StickyNote, RefreshCw, History, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMandatoActivity } from '@/hooks/useMandatoActivity';
import type { MandatoActivityType } from '@/types';

interface MandatoActivityTimelineProps {
  mandatoId: string;
}

const ACTIVITY_CONFIG: Record<MandatoActivityType, { 
  icon: typeof Clock; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  hora: { 
    icon: Clock, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Registro de tiempo'
  },
  interaccion: { 
    icon: MessageSquare, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Interacción'
  },
  documento: { 
    icon: FileText, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Documento'
  },
  tarea: { 
    icon: CheckSquare, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Tarea'
  },
  nota: { 
    icon: StickyNote, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Nota'
  },
  estado_cambio: { 
    icon: RefreshCw, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Cambio de estado'
  },
};

export function MandatoActivityTimeline({ mandatoId }: MandatoActivityTimelineProps) {
  const { activities, isLoading } = useMandatoActivity(mandatoId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Registro de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Registro de Actividad
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {activities.length} registros
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay actividad registrada en este mandato
          </p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.nota;
                  const Icon = config.icon;
                  const userName = activity.created_by_user?.full_name || 'Usuario';
                  const isLast = index === activities.length - 1;
                  
                  return (
                    <div key={activity.id} className="relative pl-10">
                      {/* Icon circle */}
                      <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      
                      {/* Content */}
                      <div className={`pb-4 ${!isLast ? 'border-b border-border/50' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-xs ${config.color} border-current/30`}>
                                {config.label}
                              </Badge>
                              <span className="text-sm font-medium flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {userName}
                              </span>
                            </div>
                            {activity.activity_description && (
                              <p className="text-sm text-foreground mt-1 line-clamp-2">
                                {activity.activity_description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(activity.created_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
