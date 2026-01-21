// Task Health Alerts for Phase 4
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Clock, 
  UserX, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HealthIssue {
  task_id: string;
  task_title: string;
  issue_type: 'overdue' | 'stalled' | 'blocked' | 'orphan' | 'overloaded';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  assigned_to?: string;
  days_since_activity?: number;
  days_overdue?: number;
}

interface HealthSummary {
  total_tasks: number;
  healthy: number;
  at_risk: number;
  overdue: number;
  blocked: number;
}

interface TaskHealthAlertsProps {
  scope?: 'user' | 'team';
  compact?: boolean;
  onTaskClick?: (taskId: string) => void;
}

export function TaskHealthAlerts({ scope = 'user', compact = false, onTaskClick }: TaskHealthAlertsProps) {
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHealthCheck = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('task-health-check', {
        body: { user_id: user.id, scope }
      });

      if (error) throw error;
      if (data.success) {
        setIssues(data.issues);
        setSummary(data.summary);
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error loading health check:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthCheck();
  }, [scope]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHealthCheck();
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'overdue': return AlertCircle;
      case 'stalled': return Clock;
      case 'orphan': return UserX;
      case 'overloaded': return TrendingDown;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'overdue': return 'Vencida';
      case 'stalled': return 'Estancada';
      case 'orphan': return 'Sin asignar';
      case 'overloaded': return 'Sobrecarga';
      case 'blocked': return 'Bloqueada';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if no issues
  if (issues.length === 0) {
    if (compact) return null;
    
    return (
      <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Todo en orden</p>
              <p className="text-sm text-muted-foreground">No hay tareas con problemas detectados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highPriorityIssues = issues.filter(i => i.severity === 'high');
  const displayIssues = compact ? issues.slice(0, 3) : issues;

  return (
    <Card className={cn(
      "border-orange-200 dark:border-orange-900",
      highPriorityIssues.length > 0 && "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={cn(
              "h-5 w-5",
              highPriorityIssues.length > 0 ? "text-red-500" : "text-orange-500"
            )} />
            Salud de Tareas
            <Badge variant="secondary" className="ml-2">
              {issues.length} {issues.length === 1 ? 'problema' : 'problemas'}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary badges */}
        {summary && !compact && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-green-600">
              {summary.healthy} saludables
            </Badge>
            <Badge variant="outline" className="text-orange-600">
              {summary.at_risk} en riesgo
            </Badge>
            <Badge variant="outline" className="text-red-600">
              {summary.overdue} vencidas
            </Badge>
          </div>
        )}

        {/* Issues list */}
        <div className="space-y-2">
          {displayIssues.map((issue) => {
            const Icon = getIssueIcon(issue.issue_type);
            return (
              <div 
                key={`${issue.task_id}-${issue.issue_type}`}
                className={cn(
                  "p-3 rounded-lg border bg-background",
                  onTaskClick && "cursor-pointer hover:bg-accent/50 transition-colors"
                )}
                onClick={() => onTaskClick?.(issue.task_id)}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn(
                    "h-4 w-4 mt-0.5",
                    issue.severity === 'high' && "text-red-500",
                    issue.severity === 'medium' && "text-orange-500",
                    issue.severity === 'low' && "text-yellow-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{issue.task_title}</span>
                      <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                        {getIssueTypeLabel(issue.issue_type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                    {!compact && (
                      <p className="text-xs text-primary mt-1">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more button */}
        {compact && issues.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full">
            Ver {issues.length - 3} más
          </Button>
        )}

        {/* Recommendations */}
        {!compact && recommendations.length > 0 && (
          <div className="pt-3 border-t space-y-1">
            {recommendations.map((rec, i) => (
              <p key={i} className="text-xs text-muted-foreground">📌 {rec}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
