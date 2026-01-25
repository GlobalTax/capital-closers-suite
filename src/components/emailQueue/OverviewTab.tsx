import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Send, Clock, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import type { QueueStats } from "@/hooks/useEmailQueue";

interface OverviewTabProps {
  stats: QueueStats[];
}

export function OverviewTab({ stats }: OverviewTabProps) {
  // Group stats by queue_type
  const byType = stats.reduce((acc, s) => {
    if (!acc[s.queue_type]) {
      acc[s.queue_type] = { sent: 0, pending: 0, failed: 0, queued: 0, sending: 0, total: 0 };
    }
    acc[s.queue_type][s.status as keyof typeof acc[string]] = s.count;
    acc[s.queue_type].total += s.count;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Calculate totals
  const totals = stats.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + s.count;
      acc.total += s.count;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  const successRate = totals.total > 0 
    ? (((totals.sent || 0) / totals.total) * 100).toFixed(1) 
    : "0";

  const pendingTotal = (totals.pending || 0) + (totals.queued || 0) + (totals.sending || 0);
  const etaMinutes = Math.ceil(pendingTotal / 20);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total (24h)</p>
                <p className="text-2xl font-bold">{totals.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
                <p className="text-2xl font-bold text-emerald-600">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{pendingTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fallidos</p>
                <p className="text-2xl font-bold text-destructive">{(totals.failed || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ETA Card */}
      {pendingTotal > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Cola en proceso</p>
                  <p className="text-sm text-amber-600">
                    {pendingTotal} emails pendientes • ETA ~{etaMinutes} {etaMinutes === 1 ? "minuto" : "minutos"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                ~20 emails/min
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desglose por Tipo de Email</CardTitle>
          <CardDescription>Estado de la cola por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(byType).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay emails en la cola (últimas 24h)
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(byType).map(([type, data]) => {
                const typeTotal = data.total || 1;
                const sentPercent = ((data.sent || 0) / typeTotal) * 100;
                const pendingPercent = (((data.pending || 0) + (data.queued || 0) + (data.sending || 0)) / typeTotal) * 100;
                const failedPercent = ((data.failed || 0) / typeTotal) * 100;

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{type}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {data.total.toLocaleString()} total
                      </span>
                    </div>

                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${sentPercent}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${pendingPercent}%` }}
                      />
                      <div
                        className="bg-destructive transition-all"
                        style={{ width: `${failedPercent}%` }}
                      />
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Enviados: {data.sent || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        Pendientes: {(data.pending || 0) + (data.queued || 0) + (data.sending || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        Fallidos: {data.failed || 0}
                      </span>
                    </div>

                    <Separator />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Rate Limit</p>
              <p className="font-medium">~20 emails/min</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Max Reintentos</p>
              <p className="font-medium">3 intentos</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Proveedor</p>
              <p className="font-medium">Resend (capittal.es)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
