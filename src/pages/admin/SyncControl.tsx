import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, Pause, Clock, AlertCircle, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface SyncJob {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  last_run: string | null;
  created_empresas_last_run: number;
  total_empresas_created: number;
  errors_last_run: number;
  updated_at: string;
}

export default function SyncControl() {
  const queryClient = useQueryClient();
  const [executingJob, setExecutingJob] = useState<string | null>(null);

  const { data: syncJobs, isLoading } = useQuery({
    queryKey: ['sync-control'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_control')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data as SyncJob[];
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('sync_control')
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-control'] });
      toast.success(variables.is_enabled ? 'Sincronización activada' : 'Sincronización pausada');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

  const executeMutation = useMutation({
    mutationFn: async (jobId: string) => {
      setExecutingJob(jobId);
      const { data, error } = await supabase.functions.invoke(jobId, {
        body: { triggered_by: 'manual' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['sync-control'] });
      toast.success(`Sincronización ${jobId} ejecutada`, {
        description: `Procesados: ${data?.leadsProcessed || data?.operationsProcessed || 0}`
      });
      setExecutingJob(null);
    },
    onError: (error, jobId) => {
      toast.error(`Error ejecutando ${jobId}`, {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setExecutingJob(null);
    }
  });

  const getStatusBadge = (job: SyncJob) => {
    if (!job.is_enabled) {
      return <Badge variant="secondary" className="gap-1"><Pause className="h-3 w-3" /> Pausado</Badge>;
    }
    if (job.errors_last_run > 0) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Errores</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-emerald-500"><Play className="h-3 w-3" /> Activo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Sincronizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las fuentes automáticas que alimentan la base de datos de empresas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['sync-control'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {syncJobs?.map((job) => (
          <Card key={job.id} className={!job.is_enabled ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{job.name}</CardTitle>
                  {getStatusBadge(job)}
                </div>
                <Switch
                  checked={job.is_enabled}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: job.id, is_enabled: checked })}
                />
              </div>
              <CardDescription>{job.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {job.last_run 
                        ? `Hace ${formatDistanceToNow(new Date(job.last_run), { locale: es })}`
                        : 'Nunca ejecutado'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{job.created_empresas_last_run}</span>
                    <span className="text-muted-foreground">última ejecución</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">{job.total_empresas_created}</span>
                    <span className="text-muted-foreground">total creadas</span>
                  </div>
                  {job.errors_last_run > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{job.errors_last_run} errores</span>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!job.is_enabled || executingJob === job.id}
                  onClick={() => executeMutation.mutate(job.id)}
                >
                  {executingJob === job.id ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Ejecutar ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Las sincronizaciones pausadas no se ejecutarán automáticamente por los cron jobs.</p>
          <p>• Puedes ejecutar manualmente cualquier sincronización activa con el botón "Ejecutar ahora".</p>
          <p>• Los contadores se actualizan automáticamente después de cada ejecución.</p>
        </CardContent>
      </Card>
    </div>
  );
}
