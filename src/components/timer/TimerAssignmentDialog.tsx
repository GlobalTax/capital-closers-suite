import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Clock, Trash2, Check } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MandatoSelect } from '@/components/shared/MandatoSelect';
import { LeadByMandatoSelect } from '@/components/shared/LeadByMandatoSelect';
import { useTimerStore, formatTime } from '@/stores/useTimerStore';
import { useActiveWorkTaskTypes } from '@/hooks/useWorkTaskTypes';
import { createTimeEntry } from '@/services/timeTracking';
import { TimeEntryValueType, VALUE_TYPE_CONFIG } from '@/types';

// UUID for "Trabajo General" (matches MandatoSelect)
const GENERAL_WORK_ID = "00000000-0000-0000-0000-000000000001";

// Internal project IDs that don't have leads
const INTERNAL_PROJECT_IDS = [
  GENERAL_WORK_ID,
  '00000000-0000-0000-0000-000000000002', // Formación
  '00000000-0000-0000-0000-000000000003', // Desarrollo de negocio
  '00000000-0000-0000-0000-000000000004', // Administración
  '00000000-0000-0000-0000-000000000005', // Marketing
];

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
  const { data: workTaskTypes = [], isLoading: loadingTaskTypes } = useActiveWorkTaskTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format time for display
  const displayTime = useMemo(() => formatTime(pendingTimeSeconds), [pendingTimeSeconds]);
  
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
    }
  }, [isAssignmentModalOpen, presetWorkTaskTypeId, presetValueType, reset]);
  
  const mandatoId = watch('mandatoId');
  const leadId = watch('leadId');
  const selectedValueType = watch('valueType');
  
  // Check if mandato is an internal project
  const isInternalProject = INTERNAL_PROJECT_IDS.includes(mandatoId);
  
  // Reset leadId when mandato changes
  useEffect(() => {
    setValue('leadId', null);
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
    
    setIsSubmitting(true);
    
    try {
      const totalMinutes = Math.ceil(pendingTimeSeconds / 60);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (pendingTimeSeconds * 1000));
      
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
        mandate_lead_id: data.leadId || null, // Optional: null means general hours for the mandato
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
          {presetWorkTaskTypeName && (
            <p className="text-sm text-muted-foreground mt-1">
              📌 {presetWorkTaskTypeName}
            </p>
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
          {mandatoId && !isInternalProject && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Lead (opcional)</Label>
              <LeadByMandatoSelect
                mandatoId={mandatoId}
                value={leadId}
                onValueChange={(value) => setValue('leadId', value)}
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
            <Label className="text-xs font-medium text-muted-foreground">
              Descripción <span className="opacity-50">(opcional)</span>
            </Label>
            <Input
              placeholder="Breve descripción del trabajo..."
              className="h-9"
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
