import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Clock
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { UnifiedLogEntry } from "@/hooks/useSyncCenter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UnifiedLogsTableProps {
  logs: UnifiedLogEntry[];
  isLoading?: boolean;
}

const statusConfig = {
  completed: {
    label: 'Completado',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  failed: {
    label: 'Fallido',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  partial: {
    label: 'Parcial',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  running: {
    label: 'En progreso',
    icon: Loader2,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
};

const sourceColors: Record<string, string> = {
  brevo: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  capittal: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  operations: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  leads: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export function UnifiedLogsTable({ logs, isLoading }: UnifiedLogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredLogs = sourceFilter === 'all' 
    ? logs 
    : logs.filter(log => log.source === sourceFilter);

  const uniqueSources = Array.from(new Set(logs.map(log => log.source)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Sin historial de sincronización</p>
        <p className="text-sm">Ejecuta una sincronización para ver los logs aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex justify-end">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fuentes</SelectItem>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Ejecutado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Creados</TableHead>
              <TableHead className="text-right">Actualizados</TableHead>
              <TableHead className="text-right">Errores</TableHead>
              <TableHead>Duración</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => {
              const statusInfo = statusConfig[log.status];
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedRows.has(log.id);
              const hasErrors = log.errorsCount > 0 && log.errors.length > 0;

              return (
                <Collapsible key={log.id} asChild open={isExpanded}>
                  <>
                    <TableRow 
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        hasErrors && "hover:bg-destructive/5"
                      )}
                      onClick={() => hasErrors && toggleRow(log.id)}
                    >
                      <TableCell className="w-8">
                        {hasErrors && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", sourceColors[log.source])}
                        >
                          {log.sourceLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {formatDistanceToNow(new Date(log.executedAt), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.executedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", statusInfo.className)}
                        >
                          <StatusIcon className={cn(
                            "h-3 w-3 mr-1",
                            log.status === 'running' && "animate-spin"
                          )} />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {log.createdCount > 0 ? (
                          <span className="text-emerald-600">+{log.createdCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {log.updatedCount > 0 ? (
                          <span className="text-blue-600">{log.updatedCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {log.errorsCount > 0 ? (
                          <span className="text-destructive">{log.errorsCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.durationMs 
                          ? `${(log.durationMs / 1000).toFixed(1)}s`
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                    
                    {hasErrors && (
                      <CollapsibleContent asChild>
                        <TableRow className="bg-destructive/5 hover:bg-destructive/5">
                          <TableCell colSpan={8} className="py-3">
                            <div className="pl-8 space-y-2">
                              <p className="text-sm font-medium text-destructive">
                                Errores ({log.errorsCount}):
                              </p>
                              <ul className="space-y-1">
                                {log.errors.map((error, idx) => (
                                  <li 
                                    key={idx} 
                                    className="text-xs text-muted-foreground bg-background rounded px-2 py-1 font-mono"
                                  >
                                    {error}
                                  </li>
                                ))}
                                {log.errorsCount > log.errors.length && (
                                  <li className="text-xs text-muted-foreground italic">
                                    ... y {log.errorsCount - log.errors.length} errores más
                                  </li>
                                )}
                              </ul>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    )}
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
