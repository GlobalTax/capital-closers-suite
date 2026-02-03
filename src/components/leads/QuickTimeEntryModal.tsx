import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Video, Users, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createTimeEntry } from "@/services/timeTracking";
import { ensureLeadInMandateLeads, updateLeadLastActivity } from "@/services/leadActivities";
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import { validateByTaskType, getFieldRequirement, getMinDescriptionLength } from "@/lib/taskTypeValidation";

interface QuickTimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    tipo: 'contact' | 'valuation' | 'collaborator';
    nombre: string;
    email: string;
    empresa?: string;
    sector?: string;
  };
  preselectedType?: 'llamada' | 'videollamada' | 'reunion';
}

const ACTIVITY_TYPES = [
  { value: 'llamada', label: 'Llamada', icon: Phone, color: 'text-blue-500' },
  { value: 'videollamada', label: 'Videollamada', icon: Video, color: 'text-purple-500' },
  { value: 'reunion', label: 'Reunión', icon: Users, color: 'text-orange-500' },
];

const DURATION_PRESETS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
];

// Mandato de prospección por defecto (proyecto interno)
const PROSPECCION_MANDATO_ID = '00000000-0000-0000-0000-000000000004';

export function QuickTimeEntryModal({ 
  open, 
  onOpenChange, 
  lead,
  preselectedType = 'llamada'
}: QuickTimeEntryModalProps) {
  const queryClient = useQueryClient();
  const [activityType, setActivityType] = useState(preselectedType);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDays, setFollowupDays] = useState('7');
  const [selectedMandatoId, setSelectedMandatoId] = useState<string>('');
  const [selectedWorkTaskTypeId, setSelectedWorkTaskTypeId] = useState<string>('');

  // Effective mandato for filtering work task types
  const effectiveMandatoId = selectedMandatoId || PROSPECCION_MANDATO_ID;

  // Fetch available mandatos for selection
  const { data: mandatos = [] } = useQuery({
    queryKey: ['mandatos-for-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandatos')
        .select('id, codigo, descripcion')
        .in('estado', ['activo', 'propuesta'])
        .order('codigo', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch work task types filtered by mandato context
  const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(effectiveMandatoId);

  // Get selected task type for dynamic validation
  const selectedTaskType = workTaskTypes.find(t => t.id === selectedWorkTaskTypeId);

  // Get min description length
  const minDescLength = getMinDescriptionLength(selectedTaskType);

  // Reset work task type when mandato changes
  useEffect(() => {
    setSelectedWorkTaskTypeId('');
  }, [selectedMandatoId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setActivityType(preselectedType);
      setDurationMinutes(30);
      setCustomDuration('');
      setDescription('');
      setScheduleFollowup(false);
      setFollowupDays('7');
      setSelectedMandatoId('');
      setSelectedWorkTaskTypeId('');
    }
  }, [open, preselectedType]);

  const mutation = useMutation({
    mutationFn: async () => {
      const mandatoId = selectedMandatoId || PROSPECCION_MANDATO_ID;
      const duration = customDuration ? parseInt(customDuration) : durationMinutes;

      // Dynamic validation based on selected task type
      if (selectedTaskType) {
        const validation = validateByTaskType(selectedTaskType, {
          mandatoId,
          leadId: lead.id,
          description
        });
        
        if (!validation.isValid) {
          throw new Error(validation.errors.join('. '));
        }
      }

      // Ensure the lead exists in mandate_leads
      const mandateLeadId = await ensureLeadInMandateLeads(
        lead.id,
        lead.tipo,
        mandatoId,
        {
          companyName: lead.empresa || lead.nombre,
          contactName: lead.nombre,
          contactEmail: lead.email,
          sector: lead.sector,
        }
      );

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Build description ensuring minimum 10 chars (DB CHECK constraint)
      const activityLabel = ACTIVITY_TYPES.find(t => t.value === activityType)?.label || 'Actividad';
      const userDescription = description.trim() || `con ${lead.nombre}`;
      const finalDescription = `${activityLabel}: ${userDescription}`.substring(0, 500);

      // Create time entry
      await createTimeEntry({
        user_id: user.id,
        mandato_id: mandatoId,
        mandate_lead_id: mandateLeadId,
        work_task_type_id: selectedWorkTaskTypeId || undefined,
        start_time: new Date().toISOString(),
        duration_minutes: duration,
        description: finalDescription,
        work_type: 'Otro', // Required NOT NULL field
        status: 'approved',
      } as any);

      // Update last activity
      await updateLeadLastActivity(mandateLeadId);

      // TODO: If scheduleFollowup, create a task or reminder
      // This would integrate with the tareas system

      return { mandateLeadId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
      toast.success('Actividad registrada correctamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error registering activity:', error);
      toast.error(error.message || 'Error al registrar la actividad');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const duration = customDuration ? parseInt(customDuration) : durationMinutes;
    if (duration < 1) {
      toast.error('La duración debe ser al menos 1 minuto');
      return;
    }

    // Basic description validation before dynamic validation
    const trimmedDesc = description.trim();
    if (selectedTaskType?.require_description && trimmedDesc.length < minDescLength) {
      toast.error(`La descripción debe tener al menos ${minDescLength} caracteres`);
      return;
    }

    mutation.mutate();
  };

  const handleDurationPreset = (minutes: number) => {
    setDurationMinutes(minutes);
    setCustomDuration('');
  };

  const descriptionLength = description.trim().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registrar Actividad
          </DialogTitle>
          <DialogDescription>
            Registrar tiempo dedicado a <strong>{lead.nombre}</strong>
            {lead.empresa && ` (${lead.empresa})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Tipo de actividad</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={activityType === type.value ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setActivityType(type.value as any)}
                  >
                    <Icon className={`h-5 w-5 ${activityType === type.value ? '' : type.color}`} />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duración</Label>
            <div className="flex gap-2">
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={durationMinutes === preset.value && !customDuration ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDurationPreset(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
              <Input
                type="number"
                placeholder="Otro (min)"
                className="w-24"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                min={1}
                max={480}
              />
            </div>
          </div>

          {/* Mandato Selection */}
          <div className="space-y-2">
            <Label>Mandato (opcional)</Label>
            <Select value={selectedMandatoId} onValueChange={setSelectedMandatoId}>
              <SelectTrigger>
                <SelectValue placeholder="Prospección Comercial (por defecto)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Prospección Comercial</SelectItem>
                {mandatos.map((mandato) => (
                  <SelectItem key={mandato.id} value={mandato.id}>
                    {mandato.codigo} - {mandato.descripcion?.substring(0, 30)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Task Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de tarea {selectedWorkTaskTypeId ? '' : '(opcional)'}</Label>
            <Select 
              value={selectedWorkTaskTypeId} 
              onValueChange={setSelectedWorkTaskTypeId}
              disabled={loadingWorkTaskTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingWorkTaskTypes ? "Cargando..." : "Seleccionar tipo de tarea"} />
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>
                Descripción {getFieldRequirement(selectedTaskType, 'description').label}
              </Label>
              {descriptionLength > 0 && descriptionLength < minDescLength && (
                <span className="text-xs text-destructive">{descriptionLength}/{minDescLength} mín</span>
              )}
            </div>
            <Textarea
              placeholder="Notas sobre la actividad..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={descriptionLength > 0 && descriptionLength < minDescLength ? 'border-destructive' : ''}
            />
          </div>

          {/* Follow-up */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followup"
              checked={scheduleFollowup}
              onCheckedChange={(checked) => setScheduleFollowup(checked === true)}
            />
            <Label htmlFor="followup" className="flex items-center gap-2 cursor-pointer">
              <Calendar className="h-4 w-4" />
              Programar seguimiento en
              <Input
                type="number"
                className="w-16 h-7"
                value={followupDays}
                onChange={(e) => setFollowupDays(e.target.value)}
                disabled={!scheduleFollowup}
                min={1}
                max={365}
              />
              días
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
