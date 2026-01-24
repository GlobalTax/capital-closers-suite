import { useState, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Send, Check, X, ExternalLink, Timer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Group entries by day
interface DayGroup {
  date: Date;
  entries: TimeEntry[];
  totalMinutes: number;
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

  // Group entries by day
  const dayGroups = useMemo(() => {
    const groups: Map<string, DayGroup> = new Map();
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.start_time);
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: entryDate,
          entries: [],
          totalMinutes: 0
        });
      }
      
      const group = groups.get(dateKey)!;
      group.entries.push(entry);
      group.totalMinutes += entry.duration_minutes || 0;
    });
    
    // Sort groups by date descending
    return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries]);

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

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
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

  // Render entries grouped by visible days
  const visibleDayGroups = dayGroups.map(group => ({
    ...group,
    entries: group.entries.filter(e => allEntries.some(ae => ae.id === e.id))
  })).filter(g => g.entries.length > 0);

  return (
    <>
      <div className="space-y-1">
        {visibleDayGroups.map((group) => (
          <div key={format(group.date, 'yyyy-MM-dd')}>
            {/* Day Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 px-1 flex items-center justify-between border-b border-border/50">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {getDayLabel(group.date)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(group.entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0))}
              </span>
            </div>

            {/* Entries */}
            <div className="divide-y divide-border/30">
              {group.entries.map((entry) => {
                const canEdit = entry.user_id === currentUserId && entry.status === 'draft';
                const canDelete = entry.user_id === currentUserId || isAdmin;
                const canApprove = isAdmin && entry.status === 'submitted';
                const startTime = format(new Date(entry.start_time), 'HH:mm');

                // Build lead/company display from contacto
                const leadDisplay = entry.contacto ? (
                  entry.contacto.empresa_principal?.nombre || 
                  `${entry.contacto.nombre} ${entry.contacto.apellidos || ''}`.trim()
                ) : null;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "group hover:bg-muted/30 transition-colors rounded-md border-l-2 py-2 px-2",
                      getStatusIndicator(entry.status),
                      entry.status === 'rejected' && "opacity-60"
                    )}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3">
                      {/* Start Time */}
                      <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0 w-10">
                        {startTime}
                      </span>

                      {/* Mandato */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {entry.mandato ? (
                            <Link 
                              to={`/mandatos/${entry.mandato.id}`}
                              className="hover:underline inline-flex items-center gap-1 group/link"
                            >
                              <span className="font-mono text-sm font-medium text-primary">
                                {entry.mandato.codigo || 'M'}
                              </span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-sm truncate max-w-[140px]">
                                {entry.work_task_type?.name || entry.mandato.descripcion || 'Sin descripción'}
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin asignar</span>
                          )}
                        </div>
                      </div>

                      {/* Lead/Company */}
                      {leadDisplay && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden md:inline">
                          {leadDisplay}
                        </span>
                      )}

                      {/* Duration */}
                      <span className="font-mono text-sm font-medium tabular-nums shrink-0">
                        {formatDuration(entry.duration_minutes)}
                      </span>
                    </div>

                    {/* Description row */}
                    {entry.description && entry.description !== 'Trabajo registrado manualmente' && (
                      <div className="mt-1 ml-[52px] text-xs text-muted-foreground truncate max-w-[400px]">
                        {entry.description}
                      </div>
                    )}

                    {/* Status Badge for rejected */}
                    {entry.status === 'rejected' && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 ml-[52px] mt-1">
                        Rechazado
                      </Badge>
                    )}

                    {/* Actions (hover) */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
