import { useTaskEvents } from "@/hooks/useTaskEvents";
import { 
  Sparkles, 
  GitBranch, 
  UserCheck, 
  ArrowUpDown, 
  Pencil, 
  RefreshCw,
  ChevronDown,
  Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskEventHistoryProps {
  taskId: string;
  taskType?: 'tarea' | 'checklist';
  className?: string;
}

const EVENT_CONFIG = {
  AI_CREATED: {
    icon: Sparkles,
    label: 'Creada por IA',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  AI_SPLIT: {
    icon: GitBranch,
    label: 'Dividida por IA',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  AI_REASSIGNED: {
    icon: UserCheck,
    label: 'Reasignada por IA',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  AI_REPRIORITIZED: {
    icon: ArrowUpDown,
    label: 'Repriorizada por IA',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  MANUAL_EDIT: {
    icon: Pencil,
    label: 'Editada manualmente',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  STATUS_CHANGE: {
    icon: RefreshCw,
    label: 'Cambio de estado',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
} as const;

export function TaskEventHistory({ taskId, taskType = 'tarea', className }: TaskEventHistoryProps) {
  const { data: events, isLoading, error } = useTaskEvents(taskId, taskType);

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !events?.length) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">Historial IA</h4>
        <Badge variant="secondary" className="text-xs">
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-3">
          {events.map((event, index) => {
            const config = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG] || EVENT_CONFIG.MANUAL_EDIT;
            const Icon = config.icon;
            const payload = event.payload as Record<string, unknown>;

            return (
              <div key={event.id} className="relative pl-8">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center",
                  config.bgColor
                )}>
                  <Icon className={cn("h-3 w-3", config.color)} />
                </div>

                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn("text-sm font-medium", config.color)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(event.created_at), "d MMM, HH:mm", { locale: es })}
                    </span>
                  </div>

                  {/* Event details */}
                  {Object.keys(payload).length > 0 && (
                    <Accordion type="single" collapsible className="mt-2">
                      <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                          <span className="flex items-center gap-1">
                            Ver detalles
                            <ChevronDown className="h-3 w-3" />
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {JSON.stringify(payload, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
