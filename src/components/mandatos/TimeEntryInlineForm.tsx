import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Loader2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { createTimeEntry } from "@/services/timeTracking";
import { MandatoLeadSelect } from "@/components/shared/MandatoLeadSelect";
import type { TimeEntryValueType, MandatoChecklistTask } from "@/types";
import type { SearchItemType } from "@/hooks/useMandatoLeadSearch";
import { useActiveWorkTaskTypes } from "@/hooks/useWorkTaskTypes";

interface TimeEntryInlineFormProps {
  onSuccess?: () => void;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';

export function TimeEntryInlineForm({ onSuccess }: TimeEntryInlineFormProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<MandatoChecklistTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form state - now with type tracking
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [selectedId, setSelectedId] = useState('');
  const [selectedType, setSelectedType] = useState<SearchItemType | null>(null);
  const [valueType, setValueType] = useState<TimeEntryValueType>('core_ma');
  const [workTaskTypeId, setWorkTaskTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  
  // Advanced options
  const [advancedDate, setAdvancedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [advancedStartTime, setAdvancedStartTime] = useState(format(new Date(), 'HH:mm'));
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');
  
  const hoursInputRef = useRef<HTMLInputElement>(null);
  
  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useActiveWorkTaskTypes();

  // Auto-focus on hours input on mount
  useEffect(() => {
    setTimeout(() => hoursInputRef.current?.focus(), 100);
  }, []);

  // Smart defaults based on selection type
  useEffect(() => {
    if (selectedType === 'contacto') {
      // Lead selected → soporte, not billable
      setValueType('soporte');
      setIsBillable(false);
    } else if (selectedType === 'mandato') {
      // Mandate selected → core_ma, billable
      setValueType('core_ma');
      setIsBillable(true);
    } else if (selectedType === 'internal' || selectedId === GENERAL_WORK_ID) {
      // General work → soporte, not billable
      setValueType('soporte');
      setIsBillable(false);
    }
  }, [selectedId, selectedType]);

  // Load tasks when mandato changes
  useEffect(() => {
    if (selectedType === 'mandato' && selectedId && selectedId !== GENERAL_WORK_ID) {
      loadTasksForMandato(selectedId);
    } else {
      setTasks([]);
    }
  }, [selectedId, selectedType]);

  const loadTasksForMandato = async (mandatoId: string) => {
    try {
      setLoadingTasks(true);
      const { data, error } = await supabase
        .from('mandato_checklist_tasks')
        .select('*')
        .eq('mandato_id', mandatoId)
        .order('orden');

      if (error) throw error;
      setTasks(data as MandatoChecklistTask[] || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const resetForm = () => {
    setHours('0');
    setMinutes('30');
    setSelectedId('');
    setSelectedType(null);
    setValueType('core_ma');
    setWorkTaskTypeId('');
    setDescription('');
    setIsBillable(true);
    setAdvancedDate(format(new Date(), 'yyyy-MM-dd'));
    setAdvancedStartTime(format(new Date(), 'HH:mm'));
    setTaskId('');
    setNotes('');
    setShowAdvanced(false);
    setTimeout(() => hoursInputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!selectedId || !selectedType) {
        toast.error("Debes seleccionar un mandato o lead");
        return;
      }

      if (!isValidUUID(selectedId)) {
        toast.error("La selección no es válida");
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

      // Validate description length (DB requires minimum 10 characters)
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 0 && trimmedDescription.length < 10) {
        toast.error("La descripción debe tener al menos 10 caracteres");
        return;
      }

      const startDateTime = new Date(`${advancedDate}T${advancedStartTime}`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Prepare entry based on selection type
      const entryData: Record<string, any> = {
        user_id: user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: durationMinutes,
        description: trimmedDescription || 'Trabajo registrado manualmente',
        work_type: 'Otro',
        value_type: valueType,
        is_billable: isBillable,
        status: 'approved',
        notes: notes.trim() || undefined,
        work_task_type_id: workTaskTypeId,
        mandato_id: null,
        contacto_id: null,
      };

      // Set the correct ID based on type
      if (selectedType === 'mandato' || selectedType === 'internal') {
        entryData.mandato_id = selectedId;
        entryData.task_id = taskId && taskId !== '__none__' ? taskId : undefined;
      } else if (selectedType === 'contacto') {
        // Now use mandate_lead_id instead of contacto_id
        entryData.mandate_lead_id = selectedId;
      }

      await createTimeEntry(entryData);

      toast.success("Tiempo registrado ✓");
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating time entry:', error);
      toast.error(error.message || "No se pudo registrar el tiempo");
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  const isValid = selectedId && selectedType && workTaskTypeId && totalDuration > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 rounded-lg border p-4 space-y-4">
      {/* Row 1: Duration + Mandato/Lead + Task Type + Description + Button */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Duration */}
        <div className="flex items-end gap-1">
          <div>
            <Label className="text-xs text-muted-foreground">Horas</Label>
            <Input
              ref={hoursInputRef}
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-14 text-center font-mono h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid) {
                  handleSubmit(e);
                }
              }}
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
              className="w-14 text-center font-mono h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid) {
                  handleSubmit(e);
                }
              }}
            />
          </div>
        </div>

        {/* Mandato/Lead Select */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Mandato</Label>
          <MandatoLeadSelect
            value={selectedId}
            valueType={selectedType}
            onValueChange={(value, type) => {
              setSelectedId(value);
              setSelectedType(type);
              setTaskId('');
            }}
            includeGeneralWork={true}
            includeLeads={true}
          />
        </div>

        {/* Work Task Type */}
        <div className="min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Tipo de tarea</Label>
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

        {/* Description */}
        <div className="flex-1 min-w-[180px]">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Descripción (opcional)</Label>
            {description.trim().length > 0 && description.trim().length < 10 && (
              <span className="text-xs text-destructive">{description.trim().length}/10 mín</span>
            )}
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción..."
            maxLength={100}
            className={`h-9 ${description.trim().length > 0 && description.trim().length < 10 ? 'border-destructive' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid) {
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading || !isValid}
          className="h-9 px-4"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Registrar
            </>
          )}
        </Button>
      </div>

      {/* Row 2: Value Type + Billable + Advanced toggle */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        {/* Value Type Toggle */}
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

        {/* Billable Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inline_billable"
            checked={isBillable}
            onCheckedChange={(checked) => setIsBillable(checked as boolean)}
          />
          <Label htmlFor="inline_billable" className="text-xs cursor-pointer">
            Facturable
          </Label>
        </div>

        {/* Advanced Toggle */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <button 
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Más opciones
            </button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Advanced Options - Collapsible */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent className="space-y-3 pt-3 border-t">
          <div className="flex flex-wrap items-end gap-3">
            {/* Date */}
            <div>
              <Label className="text-xs text-muted-foreground">Fecha</Label>
              <Input
                type="date"
                value={advancedDate}
                onChange={(e) => setAdvancedDate(e.target.value)}
                className="w-36 h-9"
              />
            </div>
            
            {/* Start Time */}
            <div>
              <Label className="text-xs text-muted-foreground">Hora inicio</Label>
              <Input
                type="time"
                value={advancedStartTime}
                onChange={(e) => setAdvancedStartTime(e.target.value)}
                className="w-28 h-9"
              />
            </div>

            {/* Checklist Task (only for mandatos) */}
            {selectedType === 'mandato' && selectedId && selectedId !== GENERAL_WORK_ID && tasks.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Vincular a tarea</Label>
                <Select
                  value={taskId}
                  onValueChange={setTaskId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={loadingTasks ? "..." : "Sin vincular"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin vincular</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        [{task.fase}] {task.tarea}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground">Notas adicionales</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionales..."
              rows={2}
              className="resize-none"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
