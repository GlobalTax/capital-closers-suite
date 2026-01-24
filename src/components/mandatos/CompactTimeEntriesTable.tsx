import { useState, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Send, Check, X, ExternalLink, Timer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { cn } from "@/lib/utils";
import type { TimeEntry } from "@/types";

interface CompactTimeEntriesTableProps {
  entries: TimeEntry[];
  currentUserId: string;
  isAdmin: boolean;
  onRefresh: () => void;
  onEditEntry?: (entry: TimeEntry) => void;
  onOpenDialog?: () => void;
  initialDisplayCount?: number;
}

export function CompactTimeEntriesTable({
  entries,
  currentUserId,
  isAdmin,
  onRefresh,
  onEditEntry,
  onOpenDialog,
  initialDisplayCount = 15
}: CompactTimeEntriesTableProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);

  // Flatten for display count
  const allEntries = useMemo(() => entries.slice(0, displayCount), [entries, displayCount]);
  const hasMore = entries.length > displayCount;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getStatusIndicator = (status: string) => {
    const indicators: Record<string, string> = {
      draft: 'border-l-amber-400',
      submitted: 'border-l-blue-400',
      approved: 'border-l-emerald-400',
      rejected: 'border-l-red-400'
    };
    return indicators[status] || indicators.draft;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTimeEntry(id);
      toast({ title: "Registro eliminado" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitTimeEntry(id);
      toast({ title: "Registro enviado para aprobación" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTimeEntry(id, currentUserId);
      toast({ title: "Registro aprobado" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectionReason.trim()) {
      toast({ title: "Error", description: "Proporciona un motivo", variant: "destructive" });
      return;
    }
    try {
      await rejectTimeEntry(rejectId, rejectionReason);
      toast({ title: "Registro rechazado" });
      onRefresh();
      setRejectId(null);
      setRejectionReason("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in-50 duration-300">
        <Timer className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-base font-medium text-foreground">Sin registros en este período</p>
        <p className="text-sm text-muted-foreground mt-1">
          Usa el formulario de arriba para registrar tiempo
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead className="w-[60px]">Hora</TableHead>
              <TableHead className="min-w-[140px]">Cliente</TableHead>
              <TableHead className="min-w-[180px]">Proyecto</TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="min-w-[100px]">Tipo Tarea</TableHead>
              <TableHead className="w-[80px] text-right">Duración</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allEntries.map((entry) => {
              const canEdit = entry.user_id === currentUserId && entry.status === 'draft';
              const canDelete = entry.user_id === currentUserId || isAdmin;
              const canApprove = isAdmin && entry.status === 'submitted';
              
              const entryDate = new Date(entry.start_time);
              const fechaDisplay = format(entryDate, 'dd/MM/yyyy');
              const horaDisplay = format(entryDate, 'HH:mm');

              // Build client display from contacto or mandato empresa
              const clienteDisplay = entry.contacto?.empresa_principal?.nombre 
                || entry.mandato?.empresa_principal?.nombre 
                || (entry.contacto ? `${entry.contacto.nombre} ${entry.contacto.apellidos || ''}`.trim() : null)
                || 'Sin cliente';

              const proyectoDisplay = entry.mandato?.descripcion || '-';
              const idDisplay = entry.mandato?.codigo || '-';
              const tipoTareaDisplay = entry.work_task_type?.name || '-';

              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "border-l-2",
                    getStatusIndicator(entry.status),
                    entry.status === 'rejected' && "opacity-60"
                  )}
                >
                  {/* Fecha */}
                  <TableCell className="font-medium text-sm">
                    {fechaDisplay}
                  </TableCell>

                  {/* Hora */}
                  <TableCell className="font-mono text-sm text-muted-foreground tabular-nums">
                    {horaDisplay}
                  </TableCell>

                  {/* Cliente */}
                  <TableCell>
                    <span className="text-sm font-medium truncate block max-w-[180px]">
                      {clienteDisplay}
                    </span>
                  </TableCell>

                  {/* Proyecto */}
                  <TableCell>
                    {entry.mandato ? (
                      <Link 
                        to={`/mandatos/${entry.mandato.id}`}
                        className="hover:underline inline-flex items-center gap-1 group/link text-sm text-muted-foreground"
                      >
                        <span className="truncate max-w-[200px]">{proyectoDisplay}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* ID */}
                  <TableCell>
                    <span className="font-mono text-xs text-primary font-medium">
                      {idDisplay}
                    </span>
                  </TableCell>

                  {/* Tipo Tarea */}
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {tipoTareaDisplay}
                    </Badge>
                    {entry.status === 'rejected' && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 ml-2">
                        Rechazado
                      </Badge>
                    )}
                  </TableCell>

                  {/* Duración */}
                  <TableCell className="text-right">
                    <span className="font-mono text-sm font-medium tabular-nums">
                      {formatDuration(entry.duration_minutes)}
                    </span>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {entry.mandato && (
                          <DropdownMenuItem onClick={() => navigate(`/mandatos/${entry.mandato!.id}`)}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Ver mandato
                          </DropdownMenuItem>
                        )}
                        
                        {canEdit && onEditEntry && (
                          <DropdownMenuItem onClick={() => onEditEntry(entry)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        
                        {canEdit && (
                          <DropdownMenuItem onClick={() => handleSubmit(entry.id)}>
                            <Send className="mr-2 h-3.5 w-3.5" />
                            Enviar
                          </DropdownMenuItem>
                        )}
                        
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(entry.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {canApprove && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleApprove(entry.id)}
                              className="text-emerald-600"
                            >
                              <Check className="mr-2 h-3.5 w-3.5" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setRejectId(entry.id)}
                              className="text-destructive"
                            >
                              <X className="mr-2 h-3.5 w-3.5" />
                              Rechazar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setDisplayCount(prev => prev + 20)}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-t mt-2"
        >
          Ver más ({displayCount} de {entries.length})
        </button>
      )}

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar registro de horas"
        description="Este registro quedará marcado como eliminado y podrá consultarse en auditoría."
        onConfirm={async () => {
          if (deleteId) await handleDelete(deleteId);
        }}
      />

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectionReason(""); }}>
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
            placeholder="Ej: Falta justificación"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Rechazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
