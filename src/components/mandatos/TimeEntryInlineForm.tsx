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
import { ensureLeadInMandateLeads } from "@/services/leadActivities";
import { MandatoSelect } from "@/components/shared/MandatoSelect";
import { LeadByMandatoSelect, type SelectedLeadData, type ProspectForTimeEntry } from "@/components/shared/LeadByMandatoSelect";
import { GlobalLeadSearch } from "@/components/shared/GlobalLeadSearch";
import { type GlobalLead } from "@/hooks/useGlobalLeadSearch";
import type { TimeEntryValueType, MandatoChecklistTask } from "@/types";
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";

interface TimeEntryInlineFormProps {
  onSuccess?: () => void;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';
const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

// Internal project IDs that DON'T have leads (Prospección is an exception - it DOES have leads)
const INTERNAL_PROJECT_IDS_NO_LEADS = [
  GENERAL_WORK_ID,
  '00000000-0000-0000-0000-000000000002', // Reuniones Internas
  '00000000-0000-0000-0000-000000000003', // Administrativo
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

export function TimeEntryInlineForm({ onSuccess }: TimeEntryInlineFormProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<MandatoChecklistTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form state - tiered selection: Lead (optional) → Mandato (required)
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [globalLead, setGlobalLead] = useState<GlobalLead | null>(null);
  const [mandatoId, setMandatoId] = useState('');
  const [mandatoAutoAssigned, setMandatoAutoAssigned] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<SelectedLeadData>(null);
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
  
  // Check if mandato is an internal project WITHOUT leads (Prospección has leads)
  const isInternalProject = INTERNAL_PROJECT_IDS_NO_LEADS.includes(mandatoId);
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;
  
  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(mandatoId);

  // Auto-focus on hours input on mount
  useEffect(() => {
    setTimeout(() => hoursInputRef.current?.focus(), 100);
  }, []);

  // Smart defaults based on mandato selection
  useEffect(() => {
    if (isInternalProject) {
      // Internal project → soporte, not billable
      setValueType('soporte');
      setIsBillable(false);
    } else if (mandatoId) {
      // Real mandato selected → core_ma, billable
      setValueType('core_ma');
      setIsBillable(true);
    }
  }, [mandatoId, isInternalProject]);

  // Reset leadId and workTaskTypeId when mandato changes (task types are context-dependent)
  useEffect(() => {
    setLeadId(null);
    setSelectedLeadData(null);
    setTaskId('');
    setWorkTaskTypeId(''); // Reset to avoid incompatible task types
  }, [mandatoId]);

  // Load tasks when mandato changes (for real mandatos, not internal projects)
  useEffect(() => {
    if (mandatoId && !isInternalProject) {
      loadTasksForMandato(mandatoId);
    } else {
      setTasks([]);
    }
  }, [mandatoId, isInternalProject]);

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
    setGlobalLead(null);
    setMandatoId('');
    setMandatoAutoAssigned(false);
    setLeadId(null);
    setSelectedLeadData(null);
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

  // Handle global lead selection - auto-assigns mandato
  const handleGlobalLeadSelect = (lead: GlobalLead | null) => {
    setGlobalLead(lead);
    
    if (lead) {
      // Auto-assign mandato from lead
      if (lead.mandatoId) {
        setMandatoId(lead.mandatoId);
        setMandatoAutoAssigned(true);
      }
      
      // Set lead data for later processing
      setLeadId(lead.id);
      setSelectedLeadData({
        id: lead.id,
        company_name: lead.companyName,
        contact_name: lead.contactName,
        contact_email: lead.contactEmail,
        sector: lead.sector,
        source_table: lead.sourceTable,
      } as ProspectForTimeEntry);
      
      // Smart defaults for lead-based entries
      setValueType('core_ma');
      setIsBillable(true);
    } else {
      // Clear lead-related state
      setLeadId(null);
      setSelectedLeadData(null);
      if (mandatoAutoAssigned) {
        setMandatoId('');
        setMandatoAutoAssigned(false);
      }
    }
  };

  // Handle lead selection with data
  const handleLeadChange = (newLeadId: string | null, leadData?: SelectedLeadData) => {
    setLeadId(newLeadId);
    setSelectedLeadData(leadData || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Mandato is required
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

      // Transform lead ID for Prospección project
      // For Prospección, leadId comes from admin_leads but we need mandate_leads.id
      let finalMandateLeadId: string | null = null;
      
      if (leadId && isProspeccionProject && selectedLeadData) {
        // The leadId is from admin_leads, need to create/get mandate_leads entry
        const prospect = selectedLeadData as ProspectForTimeEntry;
        const leadType = getLeadTypeFromSourceTable(prospect.source_table);
        
        finalMandateLeadId = await ensureLeadInMandateLeads(
          leadId,
          leadType,
          mandatoId,
          {
            companyName: prospect.company_name || 'Sin nombre',
            contactName: prospect.contact_name || undefined,
            contactEmail: prospect.contact_email || undefined,
            sector: prospect.sector || undefined,
          }
        );
      } else if (leadId && !isProspeccionProject) {
        // For regular mandatos, leadId is already from mandate_leads
        finalMandateLeadId = leadId;
      }

      // Prepare entry with tiered selection: mandato_id (required) + mandate_lead_id (optional)
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
        mandato_id: mandatoId,
        mandate_lead_id: finalMandateLeadId,
        task_id: taskId && taskId !== '__none__' ? taskId : undefined,
      };

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
  const isValid = mandatoId && workTaskTypeId && totalDuration > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 rounded-lg border p-4 space-y-4">
      {/* Row 1: Duration + Date + Mandato/Lead + Task Type + Description + Button */}
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

        {/* Date - Always visible */}
        <div>
          <Label className="text-xs text-muted-foreground">Fecha</Label>
          <Input
            type="date"
            value={advancedDate}
            onChange={(e) => setAdvancedDate(e.target.value)}
            className="w-36 h-9"
          />
        </div>

        {/* Global Lead Search (Primary - auto-assigns mandato) */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Buscar Lead (opcional)</Label>
          <GlobalLeadSearch
            value={globalLead}
            onSelect={handleGlobalLeadSelect}
            placeholder="Buscar lead o prospecto..."
          />
        </div>

        {/* Mandato Select (Required - auto-filled if lead selected) */}
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground">
            Mandato * {mandatoAutoAssigned && <span className="text-xs text-green-600">(auto)</span>}
          </Label>
          <MandatoSelect
            value={mandatoId}
            onValueChange={(value) => {
              setMandatoId(value);
              // If user manually changes mandato, clear auto-assignment
              if (mandatoAutoAssigned) {
                setMandatoAutoAssigned(false);
                setGlobalLead(null);
                setLeadId(null);
                setSelectedLeadData(null);
              }
            }}
            includeGeneralWork={true}
          />
        </div>

        {/* Lead Select (Only show if no global lead and mandato supports leads) */}
        {mandatoId && !isInternalProject && !globalLead && (
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Lead del mandato</Label>
            <LeadByMandatoSelect
              mandatoId={mandatoId}
              value={leadId}
              onValueChange={handleLeadChange}
            />
          </div>
        )}

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

            {/* Checklist Task (only for real mandatos with tasks) */}
            {mandatoId && !isInternalProject && tasks.length > 0 && (
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