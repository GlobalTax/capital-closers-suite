import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Play, RefreshCw, ListPlus, Building2,
  CheckCircle2, XCircle, Clock, Loader2, Globe,
  Users, FileText, Tag, AlertTriangle,
} from "lucide-react";
import { useEnrichmentDashboard } from "@/hooks/queries/useEnrichmentDashboard";
import { EnrichmentBadge } from "@/components/enrichment/EnrichmentBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: "Pendiente", icon: Clock, className: "text-muted-foreground" },
  processing: { label: "Procesando", icon: Loader2, className: "text-blue-500 animate-spin" },
  completed: { label: "Completado", icon: CheckCircle2, className: "text-emerald-500" },
  failed: { label: "Fallido", icon: XCircle, className: "text-destructive" },
  skipped: { label: "Omitido", icon: AlertTriangle, className: "text-yellow-500" },
};

export default function EnrichmentDashboard() {
  const {
    stats, isLoadingStats,
    recentQueue, isLoadingQueue,
    unenriched, isLoadingUnenriched,
    launchBatch, isLaunchingBatch,
    queueAll, isQueueingAll,
    retryFailed, isRetrying,
  } = useEnrichmentDashboard();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === unenriched.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unenriched.map(e => e.id)));
    }
  };

  const coveragePct = stats ? Math.round((stats.enriched / Math.max(stats.total, 1)) * 100) : 0;

  const coverageItems = [
    { label: "Sector", value: stats?.withSector || 0, icon: Tag },
    { label: "Descripción", value: stats?.withDescripcion || 0, icon: FileText },
    { label: "Empleados", value: stats?.withEmpleados || 0, icon: Users },
    { label: "Web", value: stats?.withWeb || 0, icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Enriquecimiento de Empresas
          </h1>
          <p className="text-muted-foreground">
            Enriquece automáticamente los datos de empresas usando IA y webscraping
          </p>
        </div>
        <div className="flex gap-2">
          {(stats?.failedQueue ?? 0) > 0 && (
            <Button variant="outline" onClick={() => retryFailed()} disabled={isRetrying}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? "animate-spin" : ""}`} />
              Reintentar fallidos ({stats?.failedQueue})
            </Button>
          )}
          <Button variant="outline" onClick={() => queueAll()} disabled={isQueueingAll}>
            <ListPlus className="h-4 w-4 mr-2" />
            Encolar todas
          </Button>
          <Button onClick={() => launchBatch({ batchSize: 5 })} disabled={isLaunchingBatch}>
            {isLaunchingBatch ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Procesar cola
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cobertura global</CardDescription>
            <CardTitle className="text-3xl">{coveragePct}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={coveragePct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.enriched || 0} / {stats?.total || 0} empresas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En cola</CardDescription>
            <CardTitle className="text-3xl">{stats?.pendingQueue || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              {(stats?.processingQueue ?? 0) > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {stats?.processingQueue} procesando
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {coverageItems.map(item => {
          const pct = stats ? Math.round((item.value / Math.max(stats.total, 1)) * 100) : 0;
          return (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </CardDescription>
                <CardTitle className="text-2xl">{pct}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{item.value} empresas</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Queue activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividad reciente de la cola</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Campos</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingQueue ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : recentQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay actividad reciente
                    </TableCell>
                  </TableRow>
                ) : (
                  recentQueue.map(item => {
                    const config = statusConfig[item.status] || statusConfig.pending;
                    const Icon = config.icon;
                    const resultData = item.result_data as any;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {(item as any).empresa?.nombre || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className={`h-3 w-3 ${config.className}`} />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {resultData?.fieldsUpdated?.length
                            ? resultData.fieldsUpdated.join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {item.error_message || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.completed_at
                            ? format(new Date(item.completed_at), "d MMM HH:mm", { locale: es })
                            : item.created_at
                            ? format(new Date(item.created_at), "d MMM HH:mm", { locale: es })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Unenriched empresas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Empresas sin enriquecer</CardTitle>
            <CardDescription>{unenriched.length} empresas pendientes (mostrando 100 primeras)</CardDescription>
          </div>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              onClick={() => launchBatch({ empresaIds: Array.from(selectedIds), batchSize: selectedIds.size })}
              disabled={isLaunchingBatch}
            >
              {isLaunchingBatch ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Enriquecer {selectedIds.size} seleccionadas
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === unenriched.length && unenriched.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Web</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Empleados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUnenriched ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : unenriched.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      🎉 ¡Todas las empresas están enriquecidas!
                    </TableCell>
                  </TableRow>
                ) : (
                  unenriched.map(empresa => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(empresa.id)}
                          onCheckedChange={() => toggleSelect(empresa.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{empresa.nombre}</TableCell>
                      <TableCell className="text-xs">
                        {empresa.sitio_web ? (
                          <a href={empresa.sitio_web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {new URL(empresa.sitio_web).hostname}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{empresa.sector || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{empresa.descripcion || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-xs">{empresa.empleados ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
