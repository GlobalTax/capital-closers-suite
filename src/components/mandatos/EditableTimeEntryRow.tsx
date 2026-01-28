import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Check, X, Pencil, Trash2, Loader2, Edit, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MandatoSelect } from "@/components/shared/MandatoSelect";
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import { updateTimeEntry, deleteTimeEntry } from "@/services/timeTracking";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TimeEntry } from "@/types";

interface EditableTimeEntryRowProps {
  entry: TimeEntry;
  onSave: () => void;
  currentUserId: string;
  isAdmin: boolean;
}

export function EditableTimeEntryRow({
  entry,
  onSave,
  currentUserId,
  isAdmin
}: EditableTimeEntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditReasonDialog, setShowEditReasonDialog] = useState(false);
  const [editReason, setEditReason] = useState('');
  
  // Editable fields
  const [startTime, setStartTime] = useState(format(new Date(entry.start_time), 'HH:mm'));
  const [mandatoId, setMandatoId] = useState(entry.mandato_id || '');
  const [workTaskTypeId, setWorkTaskTypeId] = useState(entry.work_task_type_id || '');
  const [description, setDescription] = useState(entry.description || '');
  const [hours, setHours] = useState(String(Math.floor((entry.duration_minutes || 0) / 60)));
  const [minutes, setMinutes] = useState(String((entry.duration_minutes || 0) % 60));

  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(mandatoId);

  // Reset form when entry changes or editing toggled off
  useEffect(() => {
    if (!isEditing) {
      setStartTime(format(new Date(entry.start_time), 'HH:mm'));
      setMandatoId(entry.mandato_id || '');
      setWorkTaskTypeId(entry.work_task_type_id || '');
      setDescription(entry.description || '');
      setHours(String(Math.floor((entry.duration_minutes || 0) / 60)));
      setMinutes(String((entry.duration_minutes || 0) % 60));
      setEditReason('');
    }
  }, [entry, isEditing]);

  // Reset work task type when mandato changes
  useEffect(() => {
    if (isEditing && mandatoId !== entry.mandato_id) {
      setWorkTaskTypeId('');
    }
  }, [mandatoId, isEditing, entry.mandato_id]);

  const canEdit = entry.user_id === currentUserId || isAdmin;
  const canDelete = entry.user_id === currentUserId || isAdmin;

  const formatDuration = (mins?: number) => {
    if (!mins) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-amber-500/20 text-amber-700',
      submitted: 'bg-blue-500/20 text-blue-700',
      approved: 'bg-emerald-500/20 text-emerald-700',
      rejected: 'bg-red-500/20 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const handleSaveClick = async () => {
    // If entry is approved, show reason dialog first
    if (entry.status === 'approved') {
      setShowEditReasonDialog(true);
      return;
    }
    
    await doSave();
  };

  const doSave = async (reason?: string) => {
    try {
      setLoading(true);

      const durationMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      
      if (durationMinutes <= 0) {
        toast.error("La duración debe ser mayor a 0");
        return;
      }

      if (!mandatoId) {
        toast.error("Debes seleccionar un mandato");
        return;
      }

      if (!workTaskTypeId) {
        toast.error("Debes seleccionar un tipo de tarea");
        return;
      }

      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 0 && trimmedDescription.length < 10) {
        toast.error("La descripción debe tener al menos 10 caracteres");
        return;
      }

      // Parse the date from original entry and update time
      const originalDate = new Date(entry.start_time);
      const [newHours, newMins] = startTime.split(':').map(Number);
      const newStartTime = new Date(originalDate);
      newStartTime.setHours(newHours, newMins, 0, 0);
      const newEndTime = new Date(newStartTime.getTime() + durationMinutes * 60000);

      await updateTimeEntry(entry.id, {
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        duration_minutes: durationMinutes,
        mandato_id: mandatoId,
        work_task_type_id: workTaskTypeId,
        description: trimmedDescription || 'Trabajo registrado',
      }, reason); // Pass the edit reason for approved entries

      if (reason) {
        toast.success("Entrada actualizada. Será revisada de nuevo.");
      } else {
        toast.success("Entrada actualizada");
      }
      
      setIsEditing(false);
      setShowEditReasonDialog(false);
      setEditReason('');
      onSave();
    } catch (error: any) {
      console.error('Error updating entry:', error);
      toast.error(error.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTimeEntry(entry.id);
      toast.success("Entrada eliminada");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  const totalDuration = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  const isValid = mandatoId && workTaskTypeId && totalDuration > 0;

  // Edit history badge component
  const EditHistoryBadge = () => {
    if (!entry.edit_count || entry.edit_count === 0) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 gap-1 cursor-help">
              <Edit className="h-3 w-3" />
              {entry.edit_count}x
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">
              Editada {entry.edit_count} {entry.edit_count === 1 ? 'vez' : 'veces'}
            </p>
            {entry.edited_at && (
              <p className="text-xs text-muted-foreground">
                Última: {format(new Date(entry.edited_at), 'dd/MM HH:mm')}
              </p>
            )}
            {entry.edit_reason && (
              <p className="text-xs italic mt-1 border-t pt-1">"{entry.edit_reason}"</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Read-only view
  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group">
        {/* Time */}
        <span className="font-mono text-sm text-muted-foreground w-12 shrink-0">
          {format(new Date(entry.start_time), 'HH:mm')}
        </span>

        {/* Mandato */}
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs text-primary font-medium">
            {entry.mandato?.codigo || '-'}
          </span>
          <span className="text-sm text-muted-foreground ml-2 truncate">
            {entry.mandato?.descripcion || 'Sin mandato'}
          </span>
        </div>

        {/* Task Type */}
        <Badge variant="secondary" className="text-xs shrink-0">
          {entry.work_task_type?.name || '-'}
        </Badge>

        {/* Description */}
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {entry.description || '-'}
        </span>

        {/* Duration */}
        <span className="font-mono text-sm font-medium w-16 text-right shrink-0">
          {formatDuration(entry.duration_minutes)}
        </span>

        {/* Status */}
        <Badge className={cn("text-[10px] px-1.5 shrink-0", getStatusColor(entry.status))}>
          {entry.status}
        </Badge>

        {/* Edit History Badge */}
        <EditHistoryBadge />

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Eliminar entrada"
          description="¿Estás seguro de que quieres eliminar esta entrada de tiempo?"
          onConfirm={handleDelete}
        />
      </div>
    );
  }

  // Editing view
  return (
    <>
      <div className="p-3 rounded-md border-2 border-primary/30 bg-primary/5 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Start Time */}
          <div className="w-20">
            <label className="text-xs text-muted-foreground">Hora</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9 font-mono"
            />
          </div>

          {/* Mandato */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Mandato</label>
            <MandatoSelect
              value={mandatoId}
              onValueChange={setMandatoId}
              includeGeneralWork={true}
            />
          </div>

          {/* Work Task Type */}
          <div className="min-w-[150px]">
            <label className="text-xs text-muted-foreground">Tipo de tarea</label>
            <Select
              value={workTaskTypeId}
              onValueChange={setWorkTaskTypeId}
              disabled={loadingWorkTaskTypes}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={loadingWorkTaskTypes ? "..." : "Seleccionar"} />
              </SelectTrigger>
              <SelectContent>
                {workTaskTypes.map((taskType) => (
                  <SelectItem key={taskType.id} value={taskType.id}>
                    {taskType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="flex items-end gap-1">
            <div className="w-14">
              <label className="text-xs text-muted-foreground">H</label>
              <Input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-9 text-center font-mono"
              />
            </div>
            <span className="text-muted-foreground pb-2">:</span>
            <div className="w-14">
              <label className="text-xs text-muted-foreground">M</label>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="h-9 text-center font-mono"
              />
            </div>
          </div>
        </div>

        {/* Description row */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Descripción</label>
              {description.trim().length > 0 && description.trim().length < 10 && (
                <span className="text-xs text-destructive">{description.trim().length}/10 mín</span>
              )}
            </div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del trabajo..."
              className={cn(
                "h-9",
                description.trim().length > 0 && description.trim().length < 10 && "border-destructive"
              )}
            />
          </div>

          {/* Save/Cancel buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9"
              onClick={handleSaveClick}
              disabled={loading || !isValid}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Show warning if entry is approved */}
        {entry.status === 'approved' && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Esta entrada ya fue aprobada. Al guardar, volverá a estado "pendiente de aprobación".
          </div>
        )}
      </div>

      {/* Edit Reason Dialog for Approved Entries */}
      <AlertDialog open={showEditReasonDialog} onOpenChange={setShowEditReasonDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Motivo de la edición</AlertDialogTitle>
            <AlertDialogDescription>
              Esta entrada ya fue aprobada. Para editarla, debes indicar el motivo.
              La entrada volverá a estado "pendiente de aprobación".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Motivo de la corrección (mín. 5 caracteres)..."
              className={cn(
                editReason.trim().length > 0 && editReason.trim().length < 5 && "border-destructive"
              )}
            />
            {editReason.trim().length > 0 && editReason.trim().length < 5 && (
              <p className="text-xs text-destructive mt-1">
                {editReason.trim().length}/5 caracteres mínimo
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditReason('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doSave(editReason)}
              disabled={editReason.trim().length < 5 || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
