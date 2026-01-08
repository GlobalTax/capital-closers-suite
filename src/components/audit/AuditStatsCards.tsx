import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, Trash2, Edit, Plus } from "lucide-react";
import type { AuditStats } from "@/services/auditLogs";

interface AuditStatsCardsProps {
  stats: AuditStats | null;
  loading: boolean;
}

export function AuditStatsCards({ stats, loading }: AuditStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const topTables = Object.entries(stats.byTable)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Operaciones</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.totalOperations}</div>
          <p className="text-xs text-muted-foreground">Últimos 30 días</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inserciones</CardTitle>
          <Plus className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.byAction.INSERT || 0}</div>
          <p className="text-xs text-muted-foreground">Nuevos registros</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actualizaciones</CardTitle>
          <Edit className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.byAction.UPDATE || 0}</div>
          <p className="text-xs text-muted-foreground">Registros modificados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eliminaciones</CardTitle>
          <Trash2 className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.byAction.DELETE || 0}</div>
          <p className="text-xs text-muted-foreground">Registros eliminados</p>
        </CardContent>
      </Card>

      {topTables.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Tablas Más Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topTables.map(([table, count]) => (
                <div key={table} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{table}</span>
                  <span className="text-sm text-muted-foreground">{count} operaciones</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
