import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Clock, Trash2, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MandatoSelect } from '@/components/shared/MandatoSelect';
import { LeadByMandatoSelect, type SelectedLeadData, type ProspectForTimeEntry } from '@/components/shared/LeadByMandatoSelect';
import { useTimerStore, formatTime } from '@/stores/useTimerStore';
import { useFilteredWorkTaskTypes } from '@/hooks/useWorkTaskTypes';
import { createTimeEntry } from '@/services/timeTracking';
import { ensureLeadInMandateLeads } from '@/services/leadActivities';
import { TimeEntryValueType, VALUE_TYPE_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

// UUID for "Trabajo General" (matches MandatoSelect)
const GENERAL_WORK_ID = "00000000-0000-0000-0000-000000000001";
const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

// Internal project IDs that don't have leads (except Prospección)
const INTERNAL_PROJECT_IDS_NO_LEADS = [
  GENERAL_WORK_ID,
  '00000000-0000-0000-0000-000000000002', // Formación
  '00000000-0000-0000-0000-000000000003', // Desarrollo de negocio
];

// Map source_table from prospects to leadType for ensureLeadInMandateLeads
// Now uses the 3 tables from /gestion-leads: contact_leads, company_valuations, collaborator_applications
function getLeadTypeFromSourceTable(sourceTable: string): 'contact' | 'valuation' | 'collaborator' {
  switch (sourceTable) {
    case 'company_valuations':
      return 'valuation';
    case 'collaborator_applications':
      return 'collaborator';
    case 'contact_leads':
    default:
      return 'contact';
  }
}

interface FormData {
  mandatoId: string;
  leadId: string | null;
  valueType: TimeEntryValueType;
  workTaskTypeId: string;
  description: string;
  isBillable: boolean;
}

export function TimerAssignmentDialog() {
  const { 
    isAssignmentModalOpen, 
    pendingTimeSeconds, 
    closeAssignmentModal, 
    resetTimer,
    presetWorkTaskTypeId,
    presetWorkTaskTypeName,
    presetValueType,
    clearPresets,
  } = useTimerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLeadData, setSelectedLeadData] = useState<SelectedLeadData>(null);
  
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      mandatoId: '',
      leadId: null,
      valueType: 'soporte',
      workTaskTypeId: '',
      description: '',
      isBillable: false,
    },
  });
  
  const mandatoId = watch('mandatoId');
  const description = watch('description') || '';
  const descriptionLength = description.trim().length;
  
  // Context-aware filtering: show different task types based on mandate
  const { data: workTaskTypes = [], isLoading: loadingTaskTypes } = useFilteredWorkTaskTypes(mandatoId || null);
  
  // Format time for display
  const displayTime = useMemo(() => formatTime(pendingTimeSeconds), [pendingTimeSeconds]);
  
  // Reset form when modal opens, using presets if available
  useEffect(() => {
    if (isAssignmentModalOpen) {
      reset({
        mandatoId: '',
        leadId: null,
        valueType: presetValueType || 'soporte',
        workTaskTypeId: presetWorkTaskTypeId || '',
        description: '',
        isBillable: presetValueType === 'core_ma',
      });
      setSelectedLeadData(null);
    }
  }, [isAssignmentModalOpen, presetWorkTaskTypeId, presetValueType, reset]);
  
  const leadId = watch('leadId');
  const selectedValueType = watch('valueType');
  
  // Check if mandato is an internal project without leads
  const isInternalProject = INTERNAL_PROJECT_IDS_NO_LEADS.includes(mandatoId);
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;
  
  // Reset leadId when mandato changes
  useEffect(() => {
    setValue('leadId', null);
    setSelectedLeadData(null);
  }, [mandatoId, setValue]);
  
  // Smart defaults: Update valueType and isBillable based on mandato selection
  useEffect(() => {
    if (isInternalProject) {
      // Internal project → SOPORTE by default, not billable
      setValue('valueType', 'soporte');
      setValue('isBillable', false);
    } else if (mandatoId && mandatoId !== '') {
      // Real mandato selected → CORE M&A by default, billable
      setValue('valueType', 'core_ma');
      setValue('isBillable', true);
    }
  }, [mandatoId, isInternalProject, setValue]);

  // Handle lead selection with data
  const handleLeadChange = (newLeadId: string | null, leadData?: SelectedLeadData) => {
    setValue('leadId', newLeadId);
    setSelectedLeadData(leadData || null);
  };
  
  const onSubmit = async (data: FormData) => {
    // Validate mandato selection (required)
    if (!data.mandatoId) {
      toast.error('Selecciona un mandato');
      return;
    }
    
    // Validate work task type
    if (!data.workTaskTypeId || data.workTaskTypeId === '__none__') {
      toast.error('Selecciona un tipo de tarea');
      return;
    }
    
    // Validate description length if provided
    const trimmedDescription = data.description?.trim() || '';
    if (trimmedDescription.length > 0 && trimmedDescription.length < 10) {
      toast.error('La descripción debe tener al menos 10 caracteres');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const totalMinutes = Math.ceil(pendingTimeSeconds / 60);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (pendingTimeSeconds * 1000));
      
      // Transform lead ID for Prospección project
      let finalMandateLeadId: string | null = null;
      
      if (data.leadId && isProspeccionProject && selectedLeadData) {
        // The leadId is from admin_leads, need to create/get mandate_leads entry
        const prospect = selectedLeadData as ProspectForTimeEntry;
        const leadType = getLeadTypeFromSourceTable(prospect.source_table);
        
        finalMandateLeadId = await ensureLeadInMandateLeads(
          data.leadId,
          leadType,
          data.mandatoId,
          {
            companyName: prospect.company_name || 'Sin nombre',
            contactName: prospect.contact_name || undefined,
            contactEmail: prospect.contact_email || undefined,
            sector: prospect.sector || undefined,
          }
        );
      } else if (data.leadId && !isProspeccionProject) {
        // For regular mandatos, leadId is already from mandate_leads
        finalMandateLeadId = data.leadId;
      }
      
      // Prepare entry with tiered selection: mandato_id (required) + mandate_lead_id (optional)
      const entryData: Record<string, any> = {
        work_task_type_id: data.workTaskTypeId,
        value_type: data.valueType,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        description: data.description?.trim() || 'Trabajo registrado con timer',
        is_billable: data.isBillable,
        work_type: 'Otro',
        mandato_id: data.mandatoId,
        mandate_lead_id: finalMandateLeadId,
      };
      
      await createTimeEntry(entryData);
      
      toast.success('Tiempo registrado', {
        description: `${displayTime} guardados como ${VALUE_TYPE_CONFIG[data.valueType].label}`,
      });
      
      resetTimer();
      closeAssignmentModal();
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Error al guardar el tiempo');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDiscard = () => {
    resetTimer();
    closeAssignmentModal();
    toast.info('Tiempo descartado');
  };

  // Determine if lead selector should show
  const showLeadSelector = mandatoId && !isInternalProject;
  
  return (
    <Dialog open={isAssignmentModalOpen} onOpenChange={(open) => !open && handleDiscard()}>
      <DialogContent className="sm:max-w-[420px] gap-0">
        {/* Compact Header with Time */}
        <DialogHeader className="pb-4 text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-mono font-bold tabular-nums">
            {displayTime}
          </DialogTitle>
          {presetWorkTaskTypeId && presetWorkTaskTypeName && (
            <Badge variant="secondary" className="mt-2 gap-1.5">
              <Zap className="h-3 w-3" />
              Preset: {presetWorkTaskTypeName}
            </Badge>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* 1. Mandato Select (Required) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Mandato *</Label>
            <MandatoSelect
              value={mandatoId}
              onValueChange={(value) => setValue('mandatoId', value)}
              includeGeneralWork
            />
          </div>
          
          {/* 2. Lead Select (Optional, dependent on mandato) */}
          {showLeadSelector && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Lead (opcional)</Label>
              <LeadByMandatoSelect
                mandatoId={mandatoId}
                value={leadId}
                onValueChange={handleLeadChange}
              />
            </div>
          )}
          
          {/* 3. Tipo de Valor - Toggle Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tipo de Valor</Label>
            <ToggleGroup 
              type="single" 
              value={selectedValueType} 
              onValueChange={(value) => value && setValue('valueType', value as TimeEntryValueType)}
              className="grid grid-cols-3 gap-1.5"
            >
              <ToggleGroupItem 
                value="core_ma" 
                className="flex-col h-auto py-2 px-1 gap-0.5
                  data-[state=on]:bg-emerald-500/15 data-[state=on]:text-emerald-700 
                  data-[state=on]:border-emerald-500/50 dark:data-[state=on]:text-emerald-400
                  border rounded-lg transition-all"
                aria-label="Core M&A"
              >
                <span className="font-semibold text-xs">CORE M&A</span>
                <span className="text-[10px] opacity-60 font-normal">Operaciones</span>
              </ToggleGroupItem>
              
              <ToggleGroupItem 
                value="soporte"
                className="flex-col h-auto py-2 px-1 gap-0.5
                  data-[state=on]:bg-amber-500/15 data-[state=on]:text-amber-700
                  data-[state=on]:border-amber-500/50 dark:data-[state=on]:text-amber-400
                  border rounded-lg transition-all"
                aria-label="Soporte"
              >
                <span className="font-semibold text-xs">SOPORTE</span>
                <span className="text-[10px] opacity-60 font-normal">Apoyo</span>
              </ToggleGroupItem>
              
              <ToggleGroupItem 
                value="bajo_valor"
                className="flex-col h-auto py-2 px-1 gap-0.5
                  data-[state=on]:bg-red-500/15 data-[state=on]:text-red-700
                  data-[state=on]:border-red-500/50 dark:data-[state=on]:text-red-400
                  border rounded-lg transition-all"
                aria-label="Bajo Valor"
              >
                <span className="font-semibold text-xs">BAJO VALOR</span>
                <span className="text-[10px] opacity-60 font-normal">Admin</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* 4. Tipo de Tarea */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tipo de Tarea *</Label>
            <Select
              value={watch('workTaskTypeId')}
              onValueChange={(value) => setValue('workTaskTypeId', value)}
              disabled={loadingTaskTypes}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {workTaskTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 4. Descripción (opcional, 1 línea) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium text-muted-foreground">
                Descripción <span className="opacity-50">(opcional)</span>
              </Label>
              <span className={cn(
                "text-[10px] tabular-nums",
                descriptionLength > 0 && descriptionLength < 10 
                  ? "text-destructive" 
                  : "text-muted-foreground"
              )}>
                {descriptionLength}/10 mín
              </span>
            </div>
            <Input
              placeholder="Breve descripción del trabajo..."
              className={cn(
                "h-9",
                descriptionLength > 0 && descriptionLength < 10 && "border-destructive focus-visible:ring-destructive"
              )}
              maxLength={100}
              {...register('description')}
            />
          </div>
          
          {/* 5. Facturable checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="isBillable"
              checked={watch('isBillable')}
              onCheckedChange={(checked) => setValue('isBillable', !!checked)}
            />
            <Label htmlFor="isBillable" className="text-sm font-normal cursor-pointer">
              Tiempo facturable
            </Label>
          </div>
          
          <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Descartar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar tiempo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}