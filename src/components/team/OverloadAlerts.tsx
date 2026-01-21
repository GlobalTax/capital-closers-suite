import { useQuery } from "@tanstack/react-query";
import { getTeamWorkload } from "@/services/workloadService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface OverloadAlertsProps {
  onViewUser?: (userId: string) => void;
}

export function OverloadAlerts({ onViewUser }: OverloadAlertsProps) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-workload'],
    queryFn: getTeamWorkload,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <Card><CardContent className="py-6"><Skeleton className="h-16 w-full" /></CardContent></Card>;

  const overloaded = members.filter(m => {
    const weeklyCapacity = m.daily_capacity * 5;
    return weeklyCapacity > 0 && (m.hours_this_week / weeklyCapacity) >= 0.8;
  });

  if (overloaded.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-600 mb-2">✓</div>
          <p className="font-medium text-green-700 dark:text-green-400">Equipo balanceado</p>
          <p className="text-sm text-muted-foreground">Ningún miembro sobrecargado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Alertas de Sobrecarga
          <Badge variant="destructive" className="ml-auto">{overloaded.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overloaded.map((m) => {
          const pct = Math.round((m.hours_this_week / (m.daily_capacity * 5)) * 100);
          return (
            <div key={m.user_id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-destructive/20 flex items-center justify-center text-xs font-medium text-destructive">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-destructive">{pct}% capacidad</p>
                </div>
              </div>
              {onViewUser && <Button variant="ghost" size="sm" onClick={() => onViewUser(m.user_id)}>Ver<ArrowRight className="h-3 w-3 ml-1" /></Button>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
