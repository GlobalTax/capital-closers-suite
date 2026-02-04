import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, AlertCircle, FileX, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserCompliance, DayCompliance } from "@/hooks/usePlanCompliance";
import type { DailyPlanStatus } from "@/types/dailyPlans";

interface WeeklyComplianceGridProps {
  compliance: UserCompliance[];
  weekDays: Date[];
  onCellClick?: (userId: string, date: string, planId?: string, status?: DailyPlanStatus | 'none') => void;
  loading?: boolean;
}

const statusConfig = {
  approved: { 
    icon: CheckCircle2, 
    bg: 'bg-green-500/20 hover:bg-green-500/30', 
    text: 'text-green-600',
    label: 'Aprobado'
  },
  submitted: { 
    icon: Send, 
    bg: 'bg-blue-500/20 hover:bg-blue-500/30', 
    text: 'text-blue-600',
    label: 'Pendiente de revisión'
  },
  draft: { 
    icon: Clock, 
    bg: 'bg-yellow-500/20 hover:bg-yellow-500/30', 
    text: 'text-yellow-600',
    label: 'Borrador'
  },
  rejected: { 
    icon: AlertCircle, 
    bg: 'bg-red-500/20 hover:bg-red-500/30', 
    text: 'text-red-600',
    label: 'Rechazado'
  },
  none: { 
    icon: FileX, 
    bg: 'bg-muted/50 hover:bg-muted', 
    text: 'text-muted-foreground',
    label: 'Sin plan'
  }
};

function ComplianceCell({ 
  day, 
  date,
  onClick,
  isToday,
  isFuture
}: { 
  day: DayCompliance;
  date: Date;
  onClick?: () => void;
  isToday: boolean;
  isFuture: boolean;
}) {
  const config = statusConfig[day.status];
  const Icon = config.icon;
  const hours = (day.totalMinutes / 60).toFixed(1);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "w-full aspect-square rounded-md transition-colors cursor-pointer",
              "flex flex-col items-center justify-center gap-0.5",
              config.bg,
              isToday && "ring-2 ring-primary ring-offset-1",
              isFuture && day.status === 'none' && "opacity-50"
            )}
          >
            <Icon className={cn("h-4 w-4", config.text)} />
            {day.status !== 'none' && (
              <span className={cn("text-[10px] font-medium", config.text)}>
                {hours}h
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <p className="font-medium">{format(date, "EEEE d", { locale: es })}</p>
            <p className={config.text}>{config.label}</p>
            {day.status !== 'none' && (
              <p>{day.itemCount} tareas · {hours}h planificadas</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WeeklyComplianceGrid({ 
  compliance, 
  weekDays, 
  onCellClick,
  loading = false
}: WeeklyComplianceGridProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-32 h-10 bg-muted/30 rounded animate-pulse" />
            {[...Array(7)].map((_, j) => (
              <div key={j} className="w-10 h-10 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground pb-2 w-40">
              Usuario
            </th>
            {weekDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = dateStr === today;
              return (
                <th 
                  key={dateStr} 
                  className={cn(
                    "text-center text-xs font-medium pb-2 w-12",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div>{format(day, 'EEE', { locale: es })}</div>
                  <div className={cn(
                    "text-sm",
                    isToday && "font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                </th>
              );
            })}
            <th className="text-center text-xs font-medium text-muted-foreground pb-2 w-16">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {compliance.map(user => (
            <tr key={user.userId}>
              <td className="py-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10">
                      {user.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate max-w-[120px]">
                      {user.userName}
                    </p>
                  </div>
                </div>
              </td>
              {user.days.map((day, idx) => {
                const date = weekDays[idx];
                const dateStr = format(date, 'yyyy-MM-dd');
                const isToday = dateStr === today;
                const isFuture = dateStr > today;
                
                return (
                  <td key={dateStr} className="p-0.5">
                    <ComplianceCell
                      day={day}
                      date={date}
                      isToday={isToday}
                      isFuture={isFuture}
                      onClick={() => onCellClick?.(user.userId, dateStr, day.planId, day.status)}
                    />
                  </td>
                );
              })}
              <td className="text-center">
                <span className={cn(
                  "text-sm font-semibold",
                  user.complianceRate >= 80 ? "text-green-600" :
                  user.complianceRate >= 50 ? "text-yellow-600" :
                  "text-red-600"
                )}>
                  {user.complianceRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
