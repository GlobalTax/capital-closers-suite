import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Check, X, Clock, ChevronLeft, ChevronRight, Eye, Pencil, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { deleteTimeEntry, approveTimeEntry, rejectTimeEntry, submitTimeEntry } from "@/services/timeTracking";
import { cn } from "@/lib/utils";
import type { TimeEntry, TimeEntryValueType, VALUE_TYPE_CONFIG } from "@/types";

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  currentUserId: string;
  isAdmin: boolean;
  onRefresh: () => void;
  showMandato?: boolean;
  pageSize?: number;
  onEditEntry?: (entry: TimeEntry) => void;
}

// Value type badge configuration
const VALUE_TYPE_STYLES: Record<TimeEntryValueType, { label: string; color: string; bgClass: string }> = {
  core_ma: { label: 'Core M&A', color: '#10B981', bgClass: 'bg-emerald-500' },
  soporte: { label: 'Soporte', color: '#F59E0B', bgClass: 'bg-amber-500' },
  bajo_valor: { label: 'Bajo Valor', color: '#EF4444', bgClass: 'bg-red-500' }
};

export function TimeEntriesTable({
  entries,
  currentUserId,
  isAdmin,
  onRefresh,
  showMandato = false,
  pageSize = 20,
  onEditEntry
}: TimeEntriesTableProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(entries.length / pageSize);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Borrador' },
      submitted: { variant: 'default', label: 'Enviado' },
      approved: { variant: 'default', label: 'Aprobado' },
      rejected: { variant: 'destructive', label: 'Rechazado' }
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getValueTypeBadge = (valueType?: TimeEntryValueType) => {
    if (!valueType) return <Badge variant="outline" className="text-xs">Sin tipo</Badge>;
    
    const config = VALUE_TYPE_STYLES[valueType];
    return (
      <Badge 
        className="text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </Badge>
    );
  };

  const getMandatoEstadoBadge = (estado?: string) => {
    if (!estado) return null;
    const estadoConfig: Record<string, string> = {
      prospecto: 'bg-slate-100 text-slate-700',
      activo: 'bg-emerald-100 text-emerald-700',
      en_negociacion: 'bg-blue-100 text-blue-700',
      cerrado: 'bg-purple-100 text-purple-700',
      cancelado: 'bg-red-100 text-red-700'
    };
    return (
      <Badge variant="outline" className={cn("text-xs", estadoConfig[estado])}>
        {estado}
      </Badge>
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTimeEntry(id);
      toast({
        title: "Éxito",
        description: "Registro eliminado correctamente"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el registro",
        variant: "destructive"
      });
    }
    setDeleteId(null);
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitTimeEntry(id);
      toast({
        title: "Éxito",
        description: "Registro enviado para aprobación"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el registro",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTimeEntry(id, currentUserId);
      toast({
        title: "Éxito",
        description: "Registro aprobado correctamente"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el registro",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo del rechazo",
        variant: "destructive"
      });
      return;
    }

    try {
      await rejectTimeEntry(rejectId, rejectionReason);
      toast({
        title: "Éxito",
        description: "Registro rechazado"
      });
      onRefresh();
      setRejectId(null);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el registro",
        variant: "destructive"
      });
    }
  };

  const handleViewMandato = (mandatoId: string) => {
    navigate(`/mandatos/${mandatoId}`);
  };

  // Check if entry has audit concerns
  const hasAuditConcern = (entry: TimeEntry) => {
    // Flag: bajo_valor with duration > 2h
    if (entry.value_type === 'bajo_valor' && (entry.duration_minutes || 0) > 120) {
      return true;
    }
    return false;
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay registros de tiempo aún</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Acciones</TableHead>
              <TableHead>Usuario</TableHead>
              {showMandato && <TableHead>Mandato</TableHead>}
              <TableHead>Fecha</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Tipo Valor</TableHead>
              <TableHead className="hidden md:table-cell">Tipo Trabajo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.map((entry) => {
              const canEdit = entry.user_id === currentUserId && entry.status === 'draft';
              const showApprovalActions = isAdmin && entry.status === 'submitted';
              
              return (
                <TableRow 
                  key={entry.id}
                  className={cn(
                    hasAuditConcern(entry) && "bg-red-50/50 dark:bg-red-900/10",
                    entry.status === 'rejected' && "opacity-60"
                  )}
                >
                  {/* ACCIONES - Primero */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Ver detalles */}
                      {entry.mandato && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleViewMandato(entry.mandato!.id)}
                          title="Ver mandato"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Editar (solo borrador propio) */}
                      {canEdit && onEditEntry && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onEditEntry(entry)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Enviar (solo borrador propio) */}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleSubmit(entry.id)}
                        >
                          Enviar
                        </Button>
                      )}
                      
                      {/* Eliminar (solo borrador propio) */}
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(entry.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Aprobar/Rechazar (admin + enviado) */}
                      {showApprovalActions && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleApprove(entry.id)}
                            title="Aprobar"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setRejectId(entry.id)}
                            title="Rechazar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* USUARIO */}
                  <TableCell>
                    <span className="font-medium">{entry.user?.full_name || 'Usuario'}</span>
                  </TableCell>
                  
                  {/* MANDATO or LEAD (clickable) */}
                  {showMandato && (
                    <TableCell>
                      {entry.mandato ? (
                        <Link 
                          to={`/mandatos/${entry.mandato.id}`}
                          className="hover:underline group block"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-medium text-primary group-hover:text-primary/80">
                              {entry.mandato.codigo || 'Sin código'}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {entry.mandato.descripcion || 'Sin descripción'}
                          </div>
                          <div className="mt-1">
                            {getMandatoEstadoBadge(entry.mandato.estado)}
                          </div>
                        </Link>
                      ) : entry.contacto ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                              Lead
                            </Badge>
                          </div>
                          <div className="text-sm font-medium mt-0.5">
                            {entry.contacto.empresa_principal?.nombre || 
                             `${entry.contacto.nombre} ${entry.contacto.apellidos || ''}`.trim()}
                          </div>
                          {entry.contacto.email && (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {entry.contacto.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin asignar</span>
                      )}
                    </TableCell>
                  )}
                  
                  {/* FECHA */}
                  <TableCell>
                    <div className="font-medium">
                      {format(new Date(entry.start_time), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(entry.start_time), 'HH:mm')}
                      {entry.end_time && ` - ${format(new Date(entry.end_time), 'HH:mm')}`}
                    </div>
                  </TableCell>
                  
                  {/* DURACIÓN */}
                  <TableCell>
                    <span className="font-medium">{formatDuration(entry.duration_minutes)}</span>
                    {entry.is_billable && (
                      <Badge variant="outline" className="ml-2 text-xs">💰</Badge>
                    )}
                  </TableCell>
                  
                  {/* TIPO VALOR (nuevo) */}
                  <TableCell>
                    {getValueTypeBadge(entry.value_type)}
                    {hasAuditConcern(entry) && (
                      <div className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ Revisar
                      </div>
                    )}
                  </TableCell>
                  
                  {/* TIPO TRABAJO */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">
                      {entry.work_task_type?.name || entry.work_type || 'Sin tipo'}
                    </span>
                  </TableCell>
                  
                  {/* ESTADO */}
                  <TableCell>
                    {getStatusBadge(entry.status)}
                    {entry.status === 'rejected' && entry.rejection_reason && (
                      <div className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={entry.rejection_reason}>
                        {entry.rejection_reason}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, entries.length)} de {entries.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de tiempo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectId} onOpenChange={() => {
        setRejectId(null);
        setRejectionReason("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Proporciona un motivo para el rechazo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ej: Falta justificación del tiempo invertido"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
