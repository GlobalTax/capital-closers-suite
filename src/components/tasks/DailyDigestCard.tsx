// Daily Digest Card for Phase 3
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Lightbulb, 
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface FocusTask {
  id: string;
  titulo: string;
  prioridad: string;
  fecha_vencimiento?: string;
  why?: string;
}

interface DailyDigest {
  greeting: string;
  focus_tasks: FocusTask[];
  ordered_task_ids: string[];
  warnings: string[];
  suggestions: string[];
  total_estimated_hours: number;
  generated_at: string;
}

export function DailyDigestCard() {
  const navigate = useNavigate();
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDigest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('task-daily-digest', {
        body: { user_id: user.id }
      });

      if (error) throw error;
      if (data.success) {
        setDigest(data.digest);
      }
    } catch (error) {
      console.error('Error loading digest:', error);
      // Silently fail - card just won't show
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDigest();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDigest();
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "urgente": return "destructive";
      case "alta": return "default";
      case "media": return "secondary";
      case "baja": return "outline";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!digest) {
    return null; // Don't show card if no digest
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Tu día con IA
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
        <CardDescription className="text-base">
          {digest.greeting}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Focus Tasks */}
        {digest.focus_tasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Enfócate en esto hoy
            </h4>
            <div className="space-y-2">
              {digest.focus_tasks.slice(0, 3).map((task, index) => (
                <div 
                  key={task.id} 
                  className="p-3 rounded-lg border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate('/tareas')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium text-sm flex-1">{task.titulo}</span>
                    <Badge variant={getPriorityColor(task.prioridad)} className="text-xs">
                      {task.prioridad}
                    </Badge>
                  </div>
                  {task.why && (
                    <p className="text-xs text-muted-foreground mt-1 ml-5">{task.why}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {digest.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </h4>
            <div className="space-y-1">
              {digest.warnings.map((warning, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-6">• {warning}</p>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {digest.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Lightbulb className="h-4 w-4" />
              Sugerencias
            </h4>
            <div className="space-y-1">
              {digest.suggestions.slice(0, 2).map((suggestion, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-6">• {suggestion}</p>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Hours */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>~{digest.total_estimated_hours}h de trabajo estimado</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tareas')}>
            Ver tareas <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
