import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { createTimeEntry } from "@/services/timeTracking";
import type { TimeEntryWorkType, MandatoChecklistTask } from "@/types";

interface TimeTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  tasks: MandatoChecklistTask[];
  defaultTaskId?: string;
  onSuccess?: () => void;
}

interface FormData {
  task_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  description: string;
  work_type: TimeEntryWorkType;
  is_billable: boolean;
  notes?: string;
}

const WORK_TYPES: TimeEntryWorkType[] = [
  'Análisis',
  'Reunión',
  'Due Diligence',
  'Documentación',
  'Negociación',
  'Marketing',
  'Research',
  'Otro'
];

export function TimeTrackingDialog({
  open,
  onOpenChange,
  mandatoId,
  tasks,
  defaultTaskId,
  onSuccess
}: TimeTrackingDialogProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      task_id: defaultTaskId || '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: format(new Date(), 'HH:mm'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      end_time: '',
      work_type: 'Análisis',
      is_billable: true
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const startDateTime = new Date(`${data.start_date}T${data.start_time}`);
      const endDateTime = data.end_time 
        ? new Date(`${data.end_date}T${data.end_time}`)
        : undefined;

      if (endDateTime && endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "La hora de fin debe ser posterior a la hora de inicio",
          variant: "destructive"
        });
        return;
      }

      const { data: { user } } = await import("@/integrations/supabase/client")
        .then(m => m.supabase.auth.getUser());
      if (!user) throw new Error('Usuario no autenticado');

      await createTimeEntry({
        task_id: data.task_id,
        mandato_id: mandatoId,
        user_id: user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime?.toISOString(),
        description: data.description,
        work_type: data.work_type,
        is_billable: data.is_billable,
        status: 'draft',
        notes: data.notes
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registrar Tiempo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="task_id">Tarea *</Label>
            <Select
              value={watch('task_id')}
              onValueChange={(value) => setValue('task_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una tarea" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    [{task.fase}] {task.tarea}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.task_id && (
              <p className="text-sm text-destructive mt-1">Selecciona una tarea</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Fecha Inicio *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date', { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="start_time">Hora Inicio *</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time', { required: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end_date">Fecha Fin</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Hora Fin</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Dejar vacío si aún está en progreso
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="work_type">Tipo de Trabajo *</Label>
            <Select
              value={watch('work_type')}
              onValueChange={(value) => setValue('work_type', value as TimeEntryWorkType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descripción del Trabajo *</Label>
            <Textarea
              id="description"
              placeholder="Describe el trabajo realizado (mínimo 10 caracteres)"
              {...register('description', {
                required: true,
                minLength: 10
              })}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                La descripción debe tener al menos 10 caracteres
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Notas opcionales"
              {...register('notes')}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_billable"
              checked={watch('is_billable')}
              onCheckedChange={(checked) => setValue('is_billable', checked as boolean)}
            />
            <Label
              htmlFor="is_billable"
              className="text-sm font-normal cursor-pointer"
            >
              Tiempo facturable
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
