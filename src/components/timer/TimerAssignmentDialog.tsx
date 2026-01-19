import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MandatoSelect } from '@/components/shared/MandatoSelect';
import { useTimerStore, formatTime } from '@/stores/useTimerStore';
import { useActiveWorkTaskTypes } from '@/hooks/useWorkTaskTypes';
import { createTimeEntry } from '@/services/timeTracking';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  mandatoId: string;
  workTaskTypeId: string;
  description: string;
  taskId?: string;
  isBillable: boolean;
  hours: number;
  minutes: number;
  seconds: number;
}

export function TimerAssignmentDialog() {
  const { isAssignmentModalOpen, pendingTimeSeconds, closeAssignmentModal, resetTimer } = useTimerStore();
  const { data: workTaskTypes = [], isLoading: loadingTaskTypes } = useActiveWorkTaskTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistTasks, setChecklistTasks] = useState<Array<{ id: string; title: string; phase: string }>>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Parse seconds into h/m/s
  const initialTime = useMemo(() => {
    const hours = Math.floor(pendingTimeSeconds / 3600);
    const minutes = Math.floor((pendingTimeSeconds % 3600) / 60);
    const seconds = pendingTimeSeconds % 60;
    return { hours, minutes, seconds };
  }, [pendingTimeSeconds]);
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      mandatoId: '',
      workTaskTypeId: '',
      description: '',
      taskId: '',
      isBillable: true,
      hours: initialTime.hours,
      minutes: initialTime.minutes,
      seconds: initialTime.seconds,
    },
  });
  
  // Update form when pendingTimeSeconds changes
  useEffect(() => {
    if (isAssignmentModalOpen) {
      reset({
        mandatoId: '',
        workTaskTypeId: '',
        description: '',
        taskId: '',
        isBillable: true,
        hours: initialTime.hours,
        minutes: initialTime.minutes,
        seconds: initialTime.seconds,
      });
    }
  }, [isAssignmentModalOpen, initialTime, reset]);
  
  const selectedMandatoId = watch('mandatoId');
  
  // Load checklist tasks when mandato changes
  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedMandatoId || selectedMandatoId === '__none__') {
        setChecklistTasks([]);
        return;
      }
      
      setLoadingTasks(true);
      try {
        const { data, error } = await supabase
          .from('checklist_dynamic_items' as any)
          .select('id, title, phase')
          .eq('mandato_id', selectedMandatoId)
          .eq('is_completed', false)
          .order('display_order');
          
        if (error) throw error;
        setChecklistTasks((data as any[]) || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };
    
    loadTasks();
  }, [selectedMandatoId]);
  
  const onSubmit = async (data: FormData) => {
    if (!data.mandatoId || data.mandatoId === '__none__') {
      toast.error('Selecciona un mandato');
      return;
    }
    
    if (!data.workTaskTypeId || data.workTaskTypeId === '__none__') {
      toast.error('Selecciona un tipo de tarea');
      return;
    }
    
    if (!data.description.trim()) {
      toast.error('Añade una descripción del trabajo');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate total seconds from form
      const totalSeconds = (data.hours * 3600) + (data.minutes * 60) + data.seconds;
      const totalMinutes = Math.ceil(totalSeconds / 60);
      
      // Calculate start and end times
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (totalSeconds * 1000));
      
      await createTimeEntry({
        mandato_id: data.mandatoId,
        task_id: data.taskId && data.taskId !== '__none__' ? data.taskId : undefined,
        work_task_type_id: data.workTaskTypeId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        description: data.description.trim(),
        is_billable: data.isBillable,
        work_type: 'Otro', // Legacy field
      });
      
      toast.success('Tiempo registrado correctamente', {
        description: `${formatTime(totalSeconds)} guardados`,
      });
      
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
  
  // Calculate display time from form values
  const watchedHours = watch('hours') || 0;
  const watchedMinutes = watch('minutes') || 0;
  const watchedSeconds = watch('seconds') || 0;
  const displayTimeFormatted = formatTime((watchedHours * 3600) + (watchedMinutes * 60) + watchedSeconds);
  
  return (
    <Dialog open={isAssignmentModalOpen} onOpenChange={(open) => !open && handleDiscard()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Registrar Tiempo
          </DialogTitle>
          <DialogDescription>
            Asigna el tiempo registrado a un mandato y tarea
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Time display */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-mono font-bold tabular-nums text-primary">
              {displayTimeFormatted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tiempo registrado</p>
            
            {/* Editable time inputs */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  min={0}
                  max={99}
                  className="w-14 text-center h-8 text-sm"
                  {...register('hours', { valueAsNumber: true, min: 0 })}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">horas</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">:</span>
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  className="w-14 text-center h-8 text-sm"
                  {...register('minutes', { valueAsNumber: true, min: 0, max: 59 })}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">min</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">:</span>
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  className="w-14 text-center h-8 text-sm"
                  {...register('seconds', { valueAsNumber: true, min: 0, max: 59 })}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">seg</span>
              </div>
            </div>
          </div>
          
          {/* Mandato select */}
          <div className="space-y-2">
            <Label htmlFor="mandato">Mandato *</Label>
            <MandatoSelect
              value={selectedMandatoId}
              onValueChange={(value) => setValue('mandatoId', value)}
              placeholder="Seleccionar mandato..."
            />
          </div>
          
          {/* Work task type */}
          <div className="space-y-2">
            <Label htmlFor="workTaskType">Tipo de Tarea *</Label>
            <Select
              value={watch('workTaskTypeId')}
              onValueChange={(value) => setValue('workTaskTypeId', value)}
              disabled={loadingTaskTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin asignar</SelectItem>
                {workTaskTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción del trabajo *</Label>
            <Textarea
              id="description"
              placeholder="Describe el trabajo realizado..."
              className="min-h-[80px] resize-none"
              {...register('description')}
            />
          </div>
          
          {/* Checklist task (optional) */}
          {selectedMandatoId && selectedMandatoId !== '__none__' && (
            <div className="space-y-2">
              <Label htmlFor="taskId">Tarea del Checklist (opcional)</Label>
              <Select
                value={watch('taskId') || '__none__'}
                onValueChange={(value) => setValue('taskId', value)}
                disabled={loadingTasks}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincular a tarea..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin vincular</SelectItem>
                  {checklistTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      [{task.phase}] {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Billable checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBillable"
              checked={watch('isBillable')}
              onCheckedChange={(checked) => setValue('isBillable', !!checked)}
            />
            <Label htmlFor="isBillable" className="text-sm font-normal cursor-pointer">
              Tiempo facturable
            </Label>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Tiempo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
