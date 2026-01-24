import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Users,
  Building2,
  FileText,
  Eye,
  RotateCcw,
  Ban,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  SkipForward,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { QueueItemWithEntity } from "@/hooks/useBrevoQueue";

interface BrevoQueueTableProps {
  items: QueueItemWithEntity[];
  isLoading: boolean;
  onViewItem: (item: QueueItemWithEntity) => void;
  onRetryItem: (itemId: string) => void;
  onIgnoreItem: (itemId: string) => void;
  retryingIds: Set<string>;
  ignoringIds: Set<string>;
}

export function BrevoQueueTable({
  items,
  isLoading,
  onViewItem,
  onRetryItem,
  onIgnoreItem,
  retryingIds,
  ignoringIds,
}: BrevoQueueTableProps) {
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'contact':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'company':
        return <Building2 className="h-4 w-4 text-green-500" />;
      case 'deal':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'contact':
        return 'Contacto';
      case 'company':
        return 'Empresa';
      case 'deal':
        return 'Deal';
      default:
        return entityType;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Procesando
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            Completado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 gap-1">
            <XCircle className="h-3 w-3" />
            Fallido
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
            <SkipForward className="h-3 w-3" />
            Ignorado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge variant="secondary" className="text-xs">Crear</Badge>;
      case 'UPDATE':
        return <Badge variant="secondary" className="text-xs">Actualizar</Badge>;
      case 'DELETE':
        return <Badge variant="secondary" className="text-xs">Eliminar</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{action}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
        <p className="text-lg font-medium">Cola vacía</p>
        <p className="text-sm">No hay items que coincidan con los filtros</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Tipo</TableHead>
          <TableHead>Entidad</TableHead>
          <TableHead className="w-[100px]">Acción</TableHead>
          <TableHead className="w-[80px]">Intentos</TableHead>
          <TableHead className="w-[120px]">Estado</TableHead>
          <TableHead>Error</TableHead>
          <TableHead className="w-[120px]">Creado</TableHead>
          <TableHead className="w-[120px] text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {getEntityIcon(item.entity_type)}
                <span className="text-sm">{getEntityLabel(item.entity_type)}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium truncate max-w-[200px]">
                {item.entityName || item.entity_id.slice(0, 8)}
              </div>
            </TableCell>
            <TableCell>{getActionBadge(item.action)}</TableCell>
            <TableCell>
              <span className={item.attempts >= item.max_attempts ? 'text-red-500' : ''}>
                {item.attempts}/{item.max_attempts}
              </span>
            </TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell>
              {item.error_message ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-red-500 truncate max-w-[200px] block cursor-help">
                      {item.error_message.slice(0, 40)}...
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="text-xs">{item.error_message}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalles</TooltipContent>
                </Tooltip>

                {item.status === 'failed' && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRetryItem(item.id)}
                          disabled={retryingIds.has(item.id)}
                        >
                          {retryingIds.has(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reintentar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => onIgnoreItem(item.id)}
                          disabled={ignoringIds.has(item.id)}
                        >
                          {ignoringIds.has(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ignorar</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
