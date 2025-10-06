import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Check, X, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { deleteTimeEntry, approveTimeEntry, rejectTimeEntry, submitTimeEntry } from "@/services/timeTracking";
import type { TimeEntry } from "@/types";

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  currentUserId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function TimeEntriesTable({
  entries,
  currentUserId,
  isAdmin,
  onRefresh
}: TimeEntriesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Tarea</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.user?.full_name || 'Usuario'}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={entry.task?.tarea}>
                    {entry.task?.tarea || 'Tarea'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.task?.fase}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(entry.start_time), 'dd MMM yyyy', { locale: es })}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(entry.start_time), 'HH:mm')}
                    {entry.end_time && ` - ${format(new Date(entry.end_time), 'HH:mm')}`}
                  </div>
                </TableCell>
                <TableCell>{formatDuration(entry.duration_minutes)}</TableCell>
                <TableCell>
                  <span className="text-sm">{entry.work_type}</span>
                  {entry.is_billable && (
                    <Badge variant="outline" className="ml-2">💰</Badge>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(entry.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {entry.user_id === currentUserId && entry.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmit(entry.id)}
                        >
                          Enviar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isAdmin && entry.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(entry.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectId(entry.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
