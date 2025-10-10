import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AuditFiltersComponent } from "@/components/audit/AuditFilters";
import { AuditLogDetail } from "@/components/audit/AuditLogDetail";
import { AuditStatsCards } from "@/components/audit/AuditStatsCards";
import { fetchAuditLogs, getAuditStats, type AuditLog, type AuditFilters, type AuditStats } from "@/services/auditLogs";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters, page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await fetchAuditLogs(filters, page, 50);
      setLogs(result.logs);
      setTotalPages(result.totalPages);
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getAuditStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-500/10 text-green-500';
      case 'UPDATE': return 'bg-blue-500/10 text-blue-500';
      case 'DELETE': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Registro completo de todas las operaciones en el sistema"
      />

      <AuditStatsCards stats={stats} loading={loading && !stats} />

      <Card className="p-6">
        <div className="space-y-4">
          <AuditFiltersComponent filters={filters} onFiltersChange={setFilters} />

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Registro ID</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando registros...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros de auditoría
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user_email || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.table_name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.record_id ? log.record_id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <AuditLogDetail
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
