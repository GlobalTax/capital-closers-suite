import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AuditLog } from "@/services/auditLogs";

interface AuditLogDetailProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetail({ log, open, onClose }: AuditLogDetailProps) {
  if (!log) return null;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-500/10 text-green-500';
      case 'UPDATE': return 'bg-blue-500/10 text-blue-500';
      case 'DELETE': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted';
    }
  };

  const renderJsonDiff = () => {
    if (log.action === 'INSERT') {
      return (
        <div>
          <h4 className="font-medium mb-2">Valores Nuevos:</h4>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(log.new_values, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === 'DELETE') {
      return (
        <div>
          <h4 className="font-medium mb-2">Valores Anteriores:</h4>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(log.old_values, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === 'UPDATE') {
      return (
        <div className="space-y-4">
          {log.changed_fields && log.changed_fields.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Campos Modificados:</h4>
              <div className="flex flex-wrap gap-2">
                {log.changed_fields.map((field) => (
                  <Badge key={field} variant="outline">{field}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-destructive">Valores Anteriores:</h4>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-green-600">Valores Nuevos:</h4>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalle de Auditoría</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Usuario</p>
                <p className="font-medium">{log.user_email || 'Sistema'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Acción</p>
                <Badge className={getActionColor(log.action)}>{log.action}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tabla</p>
                <p className="font-medium">{log.table_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha</p>
                <p className="font-medium">
                  {format(new Date(log.created_at), "PPp", { locale: es })}
                </p>
              </div>
              {log.record_id && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">ID de Registro</p>
                  <p className="font-mono text-xs">{log.record_id}</p>
                </div>
              )}
              {log.ip_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IP</p>
                  <p className="font-mono text-xs">{log.ip_address}</p>
                </div>
              )}
              {log.user_agent && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User Agent</p>
                  <p className="text-xs truncate" title={log.user_agent}>
                    {log.user_agent}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              {renderJsonDiff()}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
