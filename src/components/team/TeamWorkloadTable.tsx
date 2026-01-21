import { useQuery } from "@tanstack/react-query";
import { getTeamWorkload, type UserWorkload } from "@/services/workloadService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, ListTodo, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamWorkloadTableProps {
  onUserClick?: (userId: string) => void;
}

export function TeamWorkloadTable({ onUserClick }: TeamWorkloadTableProps) {
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['team-workload'],
    queryFn: getTeamWorkload,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !members.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>No hay datos de carga de trabajo disponibles</p>
      </div>
    );
  }

  const getCapacityInfo = (member: UserWorkload) => {
    const weeklyCapacity = member.daily_capacity * 5;
    const percentage = weeklyCapacity > 0 ? Math.min(100, Math.round((member.hours_this_week / weeklyCapacity) * 100)) : 0;
    const isOverloaded = percentage >= 80;
    return { percentage, isOverloaded, weeklyCapacity };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const { percentage, isOverloaded, weeklyCapacity } = getCapacityInfo(member);

        return (
          <div 
            key={member.user_id}
            className={cn(
              "flex items-center gap-4 p-4 border rounded-lg transition-all hover:shadow-md",
              isOverloaded && "border-destructive/50 bg-destructive/5",
              onUserClick && "cursor-pointer"
            )}
            onClick={() => onUserClick?.(member.user_id)}
          >
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium",
              isOverloaded ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
            )}>
              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{member.name}</span>
                <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                {isOverloaded && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all", getProgressColor(percentage))} style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-xs font-medium w-10 text-right">{percentage}%</span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ListTodo className="h-3 w-3" />
                  <span>{member.pending_tasks} pendientes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{member.hours_this_week.toFixed(1)}h / {weeklyCapacity}h</span>
                </div>
              </div>
            </div>

            {member.skills.length > 0 && (
              <div className="hidden lg:flex gap-1">
                {member.skills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
