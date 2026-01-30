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
import { ensureLeadInMandateLeads } from "@/services/leadActivities";
import { MandatoSelect } from "@/components/shared/MandatoSelect";
import { LeadByMandatoSelect, type SelectedLeadData, type ProspectForTimeEntry } from "@/components/shared/LeadByMandatoSelect";
import type { TimeEntryValueType } from "@/types";
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import type { MandatoChecklistTask } from "@/types";
import { validateByTaskType, getFieldRequirement, getMinDescriptionLength } from "@/lib/taskTypeValidation";

interface TimeTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId?: string;
  tasks?: MandatoChecklistTask[];
  defaultTaskId?: string;
  onSuccess?: () => void;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';
const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

// Internal project IDs that don't have leads (except Prospección which has prospects)
const INTERNAL_PROJECT_IDS_NO_LEADS = [
  GENERAL_WORK_ID,
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
];

// Map source_table from prospects to leadType for ensureLeadInMandateLeads
function getLeadTypeFromSourceTable(sourceTable: string): 'contact' | 'valuation' | 'collaborator' {
  switch (sourceTable) {
    case 'sell_leads':
      return 'valuation';
    default:
      return 'contact';
  }
}

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
  
  // Form state - tiered selection: Mandato (required) → Lead (optional)
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [selectedMandatoId, setSelectedMandatoId] = useState(mandatoId || '');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<SelectedLeadData>(null);
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
  
  // Check if it's an internal project without leads
  const isInternalProject = INTERNAL_PROJECT_IDS_NO_LEADS.includes(selectedMandatoId);
  const isProspeccionProject = selectedMandatoId === PROSPECCION_PROJECT_ID;
  
  // Effective mandato for filtering work task types
  const effectiveMandatoForFilter = selectedMandatoId || mandatoId || null;
  
  // Tipos de tarea desde la base de datos - filtered by context
  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(effectiveMandatoForFilter);
  
  // Get selected task type for dynamic validation
  const selectedTaskType = workTaskTypes.find(t => t.id === workTaskTypeId);

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
      setSelectedMandatoId(mandatoId || '');
      setSelectedLeadId(null);
      setSelectedLeadData(null);
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

  // Smart defaults based on mandato selection
  useEffect(() => {
    if (isInternalProject) {
      setValueType('soporte');
      setIsBillable(false);
    } else if (selectedMandatoId) {
      setValueType('core_ma');
      setIsBillable(true);
    }
  }, [selectedMandatoId, isInternalProject]);

  // Reset lead and work task type when mandato changes
  useEffect(() => {
    setSelectedLeadId(null);
    setSelectedLeadData(null);
    setTaskId('');
    setWorkTaskTypeId(''); // Reset task type since available options change by context
  }, [selectedMandatoId]);

  // Load tasks when mandato changes
  useEffect(() => {
    if (selectedMandatoId && !isInternalProject && !mandatoId) {
      loadTasksForMandato(selectedMandatoId);
    }
  }, [selectedMandatoId, isInternalProject, mandatoId]);

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

  // Handle lead selection with data
  const handleLeadChange = (newLeadId: string | null, leadData?: SelectedLeadData) => {
    setSelectedLeadId(newLeadId);
    setSelectedLeadData(leadData || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields - mandato is required
      const effectiveMandatoId = mandatoId || selectedMandatoId;
      if (!effectiveMandatoId) {
        toast({
          title: "Error",
          description: "Debes seleccionar un mandato",
          variant: "destructive"
        });
        return;
      }

      if (!isValidUUID(effectiveMandatoId)) {
        toast({
          title: "Error",
          description: "El mandato seleccionado no es válido",
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

      // Dynamic validation based on selected task type
      if (selectedTaskType) {
        const validation = validateByTaskType(selectedTaskType, {
          mandatoId: effectiveMandatoId,
          leadId: selectedLeadId,
          description
        });
        
        if (!validation.isValid) {
          toast({
            title: "Campos requeridos",
            description: validation.errors.join('. '),
            variant: "destructive"
          });
          return;
        }
      }

      // Calculate start and end times
      const startDateTime = new Date(`${advancedDate}T${advancedStartTime}`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Transform lead ID for Prospección project
      let finalMandateLeadId: string | null = null;
      const effectiveIsProspeccion = effectiveMandatoId === PROSPECCION_PROJECT_ID;
      
      if (selectedLeadId && effectiveIsProspeccion && selectedLeadData) {
        // The leadId is from admin_leads, need to create/get mandate_leads entry
        const prospect = selectedLeadData as ProspectForTimeEntry;
        const leadType = getLeadTypeFromSourceTable(prospect.source_table);
        
        finalMandateLeadId = await ensureLeadInMandateLeads(
          selectedLeadId,
          leadType,
          effectiveMandatoId,
          {
            companyName: prospect.company_name || 'Sin nombre',
            contactName: prospect.contact_name || undefined,
            contactEmail: prospect.contact_email || undefined,
            sector: prospect.sector || undefined,
          }
        );
      } else if (selectedLeadId && !effectiveIsProspeccion) {
        // For regular mandatos, leadId is already from mandate_leads
        finalMandateLeadId = selectedLeadId;
      }

      // Prepare entry with tiered selection: mandato_id (required) + mandate_lead_id (optional)
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
        mandato_id: effectiveMandatoId,
        mandate_lead_id: finalMandateLeadId,
        task_id: taskId && taskId !== '__none__' ? taskId : undefined,
      };

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
  const effectiveMandato = mandatoId || selectedMandatoId;
  const isValid = effectiveMandato && workTaskTypeId && totalDuration > 0;

  // Determine if lead selector should show (not for internal projects without leads)
  const showLeadSelector = selectedMandatoId && !isInternalProject;

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

          {/* Mandato Select (Required) */}
          {!mandatoId && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Mandato *</Label>
                <div className="mt-1.5">
                  <MandatoSelect
                    value={selectedMandatoId}
                    onValueChange={setSelectedMandatoId}
                    includeGeneralWork={true}
                  />
                </div>
              </div>
              
              {/* Lead Select (Optional, dependent on mandato) */}
              {showLeadSelector && (
                <div>
                  <Label className="text-sm font-medium">
                    Lead {getFieldRequirement(selectedTaskType, 'lead').label}
                  </Label>
                  <div className="mt-1.5">
                    <LeadByMandatoSelect
                      mandatoId={selectedMandatoId}
                      value={selectedLeadId}
                      onValueChange={handleLeadChange}
                    />
                  </div>
                </div>
              )}
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
          {(() => {
            const minDescLength = getMinDescriptionLength(selectedTaskType);
            const descLength = description.trim().length;
            return (
              <div>
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">
                    Descripción {getFieldRequirement(selectedTaskType, 'description').label}
                  </Label>
                  {descLength > 0 && descLength < minDescLength && (
                    <span className="text-xs text-destructive">{descLength}/{minDescLength} mín</span>
                  )}
                </div>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del trabajo"
                  maxLength={100}
                  className={`mt-1.5 ${descLength > 0 && descLength < minDescLength ? 'border-destructive' : ''}`}
                />
              </div>
            );
          })()}

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

              {/* Checklist Task - Optional (only for real mandatos) */}
              {(mandatoId || (selectedMandatoId && !isInternalProject)) && tasks.length > 0 && (
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