import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { updateTimeEntry } from "@/services/timeTracking";
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import type { TimeEntry, TimeEntryValueType } from "@/types";

interface TimeEntryEditDialogProps {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TimeEntryEditDialog({ entry, open, onOpenChange, onSuccess }: TimeEntryEditDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [description, setDescription] = useState('');
  const [valueType, setValueType] = useState<TimeEntryValueType>('core_ma');
  const [workTaskTypeId, setWorkTaskTypeId] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [notes, setNotes] = useState('');

  const mandatoId = entry?.mandato_id || '';
  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(mandatoId);

  // Populate form when entry changes
  useEffect(() => {
    if (entry) {
      const durationMins = entry.duration_minutes || 0;
      setHours(String(Math.floor(durationMins / 60)));
      setMinutes(String(durationMins % 60));
      setDate(format(new Date(entry.start_time), 'yyyy-MM-dd'));
      setStartTime(format(new Date(entry.start_time), 'HH:mm'));
      setDescription(entry.description || '');
      setValueType(entry.value_type || 'core_ma');
      setWorkTaskTypeId(entry.work_task_type_id || '');
      setIsBillable(entry.is_billable ?? true);
      setNotes(entry.notes || '');
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    
    try {
      setLoading(true);

      const durationMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      
      if (durationMinutes <= 0) {
        toast.error("La duración debe ser mayor a 0");
        return;
      }

      // Validate description length
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 0 && trimmedDescription.length < 10) {
        toast.error("La descripción debe tener al menos 10 caracteres");
        return;
      }

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      await updateTimeEntry(entry.id, {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: durationMinutes,
        description: trimmedDescription || 'Trabajo registrado manualmente',
        value_type: valueType,
        work_task_type_id: workTaskTypeId || undefined,
        is_billable: isBillable,
        notes: notes.trim() || undefined,
      });

      toast.success("Entrada actualizada ✓");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating time entry:', error);
      toast.error(error.message || "No se pudo actualizar la entrada");
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  const isValid = totalDuration > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar entrada de tiempo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mandato (readonly) */}
          <div>
            <Label className="text-xs text-muted-foreground">Mandato</Label>
            <p className="text-sm font-medium mt-1">
              {entry?.mandato?.descripcion || 'Sin mandato'}
            </p>
          </div>

          {/* Duration */}
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-16 text-center font-mono"
              />
            </div>
            <span className="text-muted-foreground pb-2">:</span>
            <div>
              <Label className="text-xs text-muted-foreground">Min</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-16 text-center font-mono"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Fecha</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="w-28">
              <Label className="text-xs text-muted-foreground">Hora inicio</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Work Task Type */}
          <div>
            <Label className="text-xs text-muted-foreground">Tipo de tarea</Label>
            <Select
              value={workTaskTypeId}
              onValueChange={setWorkTaskTypeId}
              disabled={loadingWorkTaskTypes}
            >
              <SelectTrigger>
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

          {/* Description */}
          <div>
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Descripción</Label>
              {description.trim().length > 0 && description.trim().length < 10 && (
                <span className="text-xs text-destructive">{description.trim().length}/10 mín</span>
              )}
            </div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción..."
              maxLength={100}
              className={description.trim().length > 0 && description.trim().length < 10 ? 'border-destructive' : ''}
            />
          </div>

          {/* Value Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tipo de valor</Label>
            <ToggleGroup 
              type="single" 
              value={valueType} 
              onValueChange={(value) => value && setValueType(value as TimeEntryValueType)}
              className="justify-start"
            >
              <ToggleGroupItem 
                value="core_ma" 
                size="sm"
                className="text-xs px-3 data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-700 dark:data-[state=on]:text-emerald-400"
              >
                Core M&A
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="soporte"
                size="sm"
                className="text-xs px-3 data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-700 dark:data-[state=on]:text-amber-400"
              >
                Soporte
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="bajo_valor"
                size="sm"
                className="text-xs px-3 data-[state=on]:bg-red-500/20 data-[state=on]:text-red-700 dark:data-[state=on]:text-red-400"
              >
                Bajo valor
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Billable */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit_billable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked as boolean)}
            />
            <Label htmlFor="edit_billable" className="text-sm cursor-pointer">
              Facturable
            </Label>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
