import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, AlertTriangle, AlertCircle, Info, RefreshCw, 
  Check, X, Eye, EyeOff, Search, ExternalLink, Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  useActiveAlerts,
  useAlertStats,
  useGenerateAlerts,
  useMarkAlertAsRead,
  useDismissAlert,
  useMarkAllAlertsAsRead,
  useDismissAllReadAlerts,
} from "@/hooks/useAlerts";
import { useDismissedAlerts } from "@/hooks/useDismissedAlerts";
import type { ActiveAlert, AlertType, AlertSeverity, MandatoAlert } from "@/types/alerts";

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
  critical: { icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500/10", label: "Crítica" },
  warning: { icon: AlertCircle, color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Advertencia" },
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Info" },
};

const alertTypeLabels: Record<AlertType, string> = {
  inactive_mandate: 'Mandato Inactivo',
  overdue_task: 'Tarea Vencida',
  stuck_deal: 'Deal Estancado',
  upcoming_deadline: 'Fecha Límite Próxima',
  missing_document: 'Documento Faltante',
  low_probability: 'Baja Probabilidad',
  critical_task_overdue: 'Tarea Crítica Vencida',
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Bell; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Alertas() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [showDismissed, setShowDismissed] = useState(false);

  const { data: alerts = [], isLoading } = useActiveAlerts();
  const { data: stats } = useAlertStats();
  const { data: dismissedAlerts = [], isLoading: loadingDismissed } = useDismissedAlerts(showDismissed);
  const generateAlerts = useGenerateAlerts();
  const markAsRead = useMarkAlertAsRead();
  const dismissAlert = useDismissAlert();
  const markAllAsRead = useMarkAllAlertsAsRead();
  const dismissAllRead = useDismissAllReadAlerts();

  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts] as (ActiveAlert | MandatoAlert)[];
    
    if (showDismissed) {
      filtered = [...filtered, ...dismissedAlerts];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(q) ||
        (a.description?.toLowerCase().includes(q)) ||
        ('empresa_nombre' in a && a.empresa_nombre?.toLowerCase().includes(q))
      );
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(a => a.alert_type === typeFilter);
    }

    if (readFilter === "unread") {
      filtered = filtered.filter(a => !a.is_read);
    } else if (readFilter === "read") {
      filtered = filtered.filter(a => a.is_read);
    }

    return filtered;
  }, [alerts, dismissedAlerts, showDismissed, searchQuery, severityFilter, typeFilter, readFilter]);

  const handleAlertClick = (alert: ActiveAlert | MandatoAlert) => {
    if (!alert.is_read) {
      markAsRead.mutate(alert.id);
    }
    navigate(`/mandatos/${alert.mandato_id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Centro de Alertas</h1>
            <p className="text-sm text-muted-foreground">Gestiona y monitoriza todas las alertas del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateAlerts.mutate()}
            disabled={generateAlerts.isPending}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", generateAlerts.isPending && "animate-spin")} />
            Generar Alertas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={!stats?.unread}
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar todas leídas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dismissAllRead.mutate()}
          >
            <Archive className="h-4 w-4 mr-2" />
            Descartar leídas
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Activas" value={stats?.total || 0} icon={Bell} color="bg-muted text-foreground" />
        <StatCard label="Críticas" value={stats?.critical || 0} icon={AlertTriangle} color="bg-red-500/10 text-red-500" />
        <StatCard label="Advertencias" value={stats?.warning || 0} icon={AlertCircle} color="bg-amber-500/10 text-amber-500" />
        <StatCard label="Informativas" value={stats?.info || 0} icon={Info} color="bg-blue-500/10 text-blue-500" />
        <StatCard label="Sin Leer" value={stats?.unread || 0} icon={EyeOff} color="bg-primary/10 text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0">
              <Label className="text-xs text-muted-foreground mb-1 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, descripción o empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Severidad</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(alertTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Estado</Label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Sin leer</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Switch id="show-dismissed" checked={showDismissed} onCheckedChange={setShowDismissed} />
              <Label htmlFor="show-dismissed" className="text-xs whitespace-nowrap cursor-pointer">Historial</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || (showDismissed && loadingDismissed) ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Bell className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No se encontraron alertas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => {
                    const config = severityConfig[alert.severity] || severityConfig.info;
                    const Icon = config.icon;
                    const isDismissed = alert.is_dismissed;

                    return (
                      <TableRow 
                        key={alert.id}
                        className={cn(
                          "cursor-pointer",
                          !alert.is_read && !isDismissed && "bg-muted/30",
                          isDismissed && "opacity-50"
                        )}
                        onClick={() => handleAlertClick(alert)}
                      >
                        <TableCell>
                          <div className={cn("p-1.5 rounded-md inline-flex", config.bgColor)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <p className={cn("text-sm truncate", !alert.is_read && !isDismissed && "font-semibold")}>
                                {alert.title}
                              </p>
                              {alert.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                  {alert.description}
                                </p>
                              )}
                            </div>
                            {!alert.is_read && !isDismissed && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {'empresa_nombre' in alert ? alert.empresa_nombre || '—' : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-[10px]">
                            {alertTypeLabels[alert.alert_type] || alert.alert_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {!isDismissed && (
                              <>
                                {!alert.is_read && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead.mutate(alert.id)}>
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Marcar como leída</TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dismissAlert.mutate(alert.id)}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Descartar</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/mandatos/${alert.mandato_id}`)}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ir al mandato</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
