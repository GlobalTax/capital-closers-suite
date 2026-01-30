import { useState, useEffect } from "react";
import { format, startOfToday, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MandatoSelect } from "@/components/shared/MandatoSelect";
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import { createTimeEntry } from "@/services/timeTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TimeEntryValueType } from "@/types";
import { validateByTaskType, getFieldRequirement, getMinDescriptionLength } from "@/lib/taskTypeValidation";

interface DayInlineAddFormProps {
  date: Date;
  onSuccess: () => void;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';

const INTERNAL_PROJECT_IDS = [
  GENERAL_WORK_ID,
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
];

export function DayInlineAddForm({ date, onSuccess }: DayInlineAddFormProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Form state
  const [startTime, setStartTime] = useState('09:00');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [mandatoId, setMandatoId] = useState('');
  const [workTaskTypeId, setWorkTaskTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [justification, setJustification] = useState('');

  // Check if this is a past date (retroactive entry)
  const isPastDate = isBefore(date, startOfToday());

  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(mandatoId);
  
  // Get selected task type for dynamic validation
  const selectedTaskType = workTaskTypes.find(t => t.id === workTaskTypeId);

  const isInternalProject = INTERNAL_PROJECT_IDS.includes(mandatoId);

  // Reset work task type when mandato changes
  useEffect(() => {
    setWorkTaskTypeId('');
  }, [mandatoId]);

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const resetForm = () => {
    setStartTime('09:00');
    setHours('0');
    setMinutes('30');
    setMandatoId('');
    setWorkTaskTypeId('');
    setDescription('');
    setJustification('');
    setExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!mandatoId) {
        toast.error("Debes seleccionar un mandato");
        return;
      }

      if (!isValidUUID(mandatoId)) {
        toast.error("El mandato seleccionado no es válido");
        return;
      }

      if (!workTaskTypeId) {
        toast.error("Debes seleccionar un tipo de tarea");
        return;
      }

      const durationMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      
      if (durationMinutes <= 0) {
        toast.error("La duración debe ser mayor a 0");
        return;
      }

      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 0 && trimmedDescription.length < 10) {
        toast.error("La descripción debe tener al menos 10 caracteres");
        return;
      }

      // Dynamic validation based on selected task type
      if (selectedTaskType) {
        const validation = validateByTaskType(selectedTaskType, {
          mandatoId,
          leadId: null, // This form doesn't have lead selector
          description
        });
        
        if (!validation.isValid) {
          toast.error(validation.errors.join('. '));
          return;
        }
      }

      // For past dates, justification is required
      const trimmedJustification = justification.trim();
      if (isPastDate && trimmedJustification.length < 5) {
        toast.error("La justificación es obligatoria para registros retroactivos (mín. 5 caracteres)");
        return;
      }

      // Create start time from the fixed date + user-selected time
      const [hrs, mins] = startTime.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hrs, mins, 0, 0);
      
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const valueType: TimeEntryValueType = isInternalProject ? 'soporte' : 'core_ma';

      await createTimeEntry({
        user_id: user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: durationMinutes,
        description: trimmedDescription || 'Trabajo registrado',
        work_type: 'Otro',
        value_type: valueType,
        is_billable: !isInternalProject,
        status: 'approved',
        work_task_type_id: workTaskTypeId,
        mandato_id: mandatoId,
        // For retroactive entries, store justification in notes field
        notes: isPastDate ? `[Retroactivo] ${trimmedJustification}` : undefined,
      });

      toast.success("Entrada añadida al día");
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating time entry:', error);
      toast.error(error.message || "No se pudo registrar el tiempo");
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  const isValid = mandatoId && workTaskTypeId && totalDuration > 0 && 
    (!isPastDate || justification.trim().length >= 5);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md border border-dashed flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Añadir entrada para {format(date, "d 'de' MMMM", { locale: es })}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-md border border-dashed bg-muted/20 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span>Nueva entrada para</span>
        <span className="font-medium text-foreground">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {/* Start Time */}
        <div className="w-24">
          <label className="text-xs text-muted-foreground">Hora inicio</label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-9 font-mono"
          />
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

        {/* Mandato */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground">Mandato *</label>
          <MandatoSelect
            value={mandatoId}
            onValueChange={setMandatoId}
            includeGeneralWork={true}
          />
        </div>

        {/* Work Task Type */}
        <div className="min-w-[150px]">
          <label className="text-xs text-muted-foreground">Tipo de tarea *</label>
          <Select
            value={workTaskTypeId}
            onValueChange={setWorkTaskTypeId}
            disabled={loadingWorkTaskTypes || !mandatoId}
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

        {/* Description */}
        {(() => {
          const minDescLength = getMinDescriptionLength(selectedTaskType);
          return (
            <div className="flex-1 min-w-[150px]">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">
                  Descripción {getFieldRequirement(selectedTaskType, 'description').label}
                </label>
                {description.trim().length > 0 && description.trim().length < minDescLength && (
                  <span className="text-xs text-destructive">{description.trim().length}/{minDescLength}</span>
                )}
              </div>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción..."
                className={cn(
                  "h-9",
                  description.trim().length > 0 && description.trim().length < minDescLength && "border-destructive"
                )}
              />
            </div>
          );
        })()}

        {/* Justification for past dates */}
        {isPastDate && (
          <div className="min-w-[200px]">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                Justificación *
                <Info className="h-3 w-3" />
              </label>
              {justification.trim().length > 0 && justification.trim().length < 5 && (
                <span className="text-xs text-destructive">{justification.trim().length}/5</span>
              )}
            </div>
            <Input
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Motivo del registro retroactivo..."
              className={cn(
                "h-9",
                justification.trim().length > 0 && justification.trim().length < 5 && "border-destructive"
              )}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetForm}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !isValid}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
