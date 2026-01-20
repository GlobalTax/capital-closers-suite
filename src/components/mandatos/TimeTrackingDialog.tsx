import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Clock, Loader2, ChevronRight, ChevronDown, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";
import { createTimeEntry } from "@/services/timeTracking";
import { MandatoLeadSelect } from "@/components/shared/MandatoLeadSelect";
import type { TimeEntryValueType } from "@/types";
import type { SearchItemType } from "@/hooks/useMandatoLeadSearch";
import { useActiveWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import type { MandatoChecklistTask } from "@/types";

interface TimeTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId?: string;
  tasks?: MandatoChecklistTask[];
  defaultTaskId?: string;
  onSuccess?: () => void;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';

export function TimeTrackingDialog({
  open,
  onOpenChange,
  mandatoId,
  tasks: propTasks,
  defaultTaskId,
  onSuccess
}: TimeTrackingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<MandatoChecklistTask[]>(propTasks || []);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form state - now with type tracking
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [selectedId, setSelectedId] = useState(mandatoId || '');
  const [selectedType, setSelectedType] = useState<SearchItemType | null>(mandatoId ? 'mandato' : null);
  const [valueType, setValueType] = useState<TimeEntryValueType>('core_ma');
  const [workTaskTypeId, setWorkTaskTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  
  // Advanced options
  const [advancedDate, setAdvancedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [advancedStartTime, setAdvancedStartTime] = useState(format(new Date(), 'HH:mm'));
  const [taskId, setTaskId] = useState(defaultTaskId || '');
  const [notes, setNotes] = useState('');
  
  const hoursInputRef = useRef<HTMLInputElement>(null);
  
  // Tipos de tarea desde la base de datos
  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useActiveWorkTaskTypes();

  // Auto-focus on hours input when dialog opens
  useEffect(() => {
    if (open && hoursInputRef.current) {
      setTimeout(() => hoursInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setHours('0');
      setMinutes('30');
      setSelectedId(mandatoId || '');
      setSelectedType(mandatoId ? 'mandato' : null);
      setValueType('core_ma');
      setWorkTaskTypeId('');
      setDescription('');
      setIsBillable(true);
      setAdvancedDate(format(new Date(), 'yyyy-MM-dd'));
      setAdvancedStartTime(format(new Date(), 'HH:mm'));
      setTaskId(defaultTaskId || '');
      setNotes('');
      setShowAdvanced(false);
    }
  }, [open, mandatoId, defaultTaskId]);

  // Smart defaults based on selection type
  useEffect(() => {
    if (selectedType === 'contacto') {
      // Lead selected → soporte, not billable
      setValueType('soporte');
      setIsBillable(false);
    } else if (selectedType === 'mandato' && selectedId !== GENERAL_WORK_ID) {
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
    if (selectedType === 'mandato' && selectedId && selectedId !== GENERAL_WORK_ID && !mandatoId) {
      loadTasksForMandato(selectedId);
    }
  }, [selectedId, selectedType, mandatoId]);

  const loadTasksForMandato = async (mandatoId: string) => {
    try {
      setLoadingTasks(true);
      const { data, error } = await supabase
        .from('mandato_checklist_tasks')
        .select('*')
        .eq('mandato_id', mandatoId)
        .order('orden');

      if (error) throw error;
      setTasks(data as any || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Validar UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!selectedId || !selectedType) {
        toast({
          title: "Error",
          description: "Debes seleccionar un mandato o lead",
          variant: "destructive"
        });
        return;
      }

      if (!isValidUUID(selectedId)) {
        toast({
          title: "Error",
          description: "La selección no es válida",
          variant: "destructive"
        });
        return;
      }

      if (!workTaskTypeId) {
        toast({
          title: "Error",
          description: "Debes seleccionar un tipo de tarea",
          variant: "destructive"
        });
        return;
      }

      const durationMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      
      if (durationMinutes <= 0) {
        toast({
          title: "Error",
          description: "La duración debe ser mayor a 0",
          variant: "destructive"
        });
        return;
      }

      // Calculate start and end times
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
        description: description.trim() || 'Trabajo registrado manualmente',
        work_type: 'Otro',
        value_type: valueType,
        is_billable: isBillable,
        status: 'draft',
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
        entryData.contacto_id = selectedId;
      }

      await createTimeEntry(entryData);

      toast({
        title: "Éxito",
        description: "Tiempo registrado correctamente"
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating time entry:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el tiempo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  const isValid = selectedId && selectedType && workTaskTypeId && totalDuration > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Registrar Tiempo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Duration Input - Compact */}
          <div>
            <Label className="text-sm font-medium">Duración *</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex flex-col items-center">
                <Input
                  ref={hoursInputRef}
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-16 text-center text-lg font-mono h-11"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">horas</span>
              </div>
              <span className="text-xl font-bold text-muted-foreground pb-4">:</span>
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-16 text-center text-lg font-mono h-11"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">mins</span>
              </div>
              {totalDuration > 0 && (
                <span className="text-sm text-muted-foreground ml-2 pb-4">
                  = {Math.floor(totalDuration / 60)}h {totalDuration % 60}min
                </span>
              )}
            </div>
          </div>

          {/* Mandato/Lead Select */}
          {!mandatoId && (
            <div>
              <Label className="text-sm font-medium">Mandato *</Label>
              <div className="mt-1.5">
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
            </div>
          )}

          {/* Value Type Toggle - Prominent */}
          <div>
            <Label className="text-sm font-medium">Tipo de Valor *</Label>
            <ToggleGroup 
              type="single" 
              value={valueType} 
              onValueChange={(value) => value && setValueType(value as TimeEntryValueType)}
              className="grid grid-cols-3 gap-2 mt-1.5"
            >
              <ToggleGroupItem 
                value="core_ma" 
                className="flex flex-col py-2 h-auto data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-700 data-[state=on]:border-emerald-500 dark:data-[state=on]:text-emerald-400"
              >
                <span className="font-semibold text-xs">CORE M&A</span>
                <span className="text-[9px] opacity-70">Operaciones</span>
              </ToggleGroupItem>
              
              <ToggleGroupItem 
                value="soporte"
                className="flex flex-col py-2 h-auto data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-700 data-[state=on]:border-amber-500 dark:data-[state=on]:text-amber-400"
              >
                <span className="font-semibold text-xs">SOPORTE</span>
                <span className="text-[9px] opacity-70">Apoyo</span>
              </ToggleGroupItem>
              
              <ToggleGroupItem 
                value="bajo_valor"
                className="flex flex-col py-2 h-auto data-[state=on]:bg-red-500/20 data-[state=on]:text-red-700 data-[state=on]:border-red-500 dark:data-[state=on]:text-red-400"
              >
                <span className="font-semibold text-xs">BAJO VALOR</span>
                <span className="text-[9px] opacity-70">Admin</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Work Task Type Select */}
          <div>
            <Label className="text-sm font-medium">Tipo de Tarea *</Label>
            <Select
              value={workTaskTypeId}
              onValueChange={setWorkTaskTypeId}
              disabled={loadingWorkTaskTypes}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={
                  loadingWorkTaskTypes ? "Cargando..." : "Selecciona tipo de tarea"
                } />
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

          {/* Description - Simple Input */}
          <div>
            <Label className="text-sm font-medium">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del trabajo"
              maxLength={100}
              className="mt-1.5"
            />
          </div>

          {/* Billable Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_billable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked as boolean)}
            />
            <Label
              htmlFor="is_billable"
              className="text-sm font-normal cursor-pointer"
            >
              Tiempo facturable
            </Label>
          </div>

          {/* Advanced Options - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground p-0 h-auto"
              >
                {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Opciones avanzadas
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4 border-t mt-3">
              {/* Date and Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Fecha</Label>
                  <Input
                    type="date"
                    value={advancedDate}
                    onChange={(e) => setAdvancedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Hora inicio</Label>
                  <Input
                    type="time"
                    value={advancedStartTime}
                    onChange={(e) => setAdvancedStartTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Checklist Task - Optional (only for mandatos) */}
              {selectedType === 'mandato' && (mandatoId || (selectedId && selectedId !== GENERAL_WORK_ID)) && tasks.length > 0 && (
                <div>
                  <Label className="text-sm">Vincular a tarea del checklist</Label>
                  <Select
                    value={taskId}
                    onValueChange={setTaskId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={
                        loadingTasks ? "Cargando..." : "Sin vincular"
                      } />
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

              {/* Additional Notes */}
              <div>
                <Label className="text-sm">Notas adicionales</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas opcionales"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isValid}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar tiempo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
