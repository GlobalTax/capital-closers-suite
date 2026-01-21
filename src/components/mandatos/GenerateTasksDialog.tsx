// Generate Tasks from Deal Dialog for Phase 5
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Mandato } from "@/types";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import type { ParsedTask } from "@/types/taskAI";

interface GenerateTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandato: Mandato;
  onSuccess?: () => void;
}

const PHASES = [
  { value: "all", label: "Todas las fases" },
  { value: "1. Preparación", label: "1. Preparación" },
  { value: "2. Marketing", label: "2. Marketing" },
  { value: "3. Ofertas", label: "3. Ofertas" },
  { value: "4. Due Diligence", label: "4. Due Diligence" },
  { value: "5. Cierre", label: "5. Cierre" },
];

export function GenerateTasksDialog({ open, onOpenChange, mandato, onSuccess }: GenerateTasksDialogProps) {
  const [phase, setPhase] = useState("all");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<ParsedTask[]>([]);
  const [creating, setCreating] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedTasks([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Build context from mandato
      const dealContext = {
        tipo: mandato.tipo,
        descripcion: mandato.descripcion || '',
        empresa_nombre: mandato.empresa_principal?.nombre || '',
        fase_actual: phase === "all" ? "1. Preparación" : phase,
        estado: mandato.estado,
      };

      // Get existing tasks to avoid duplicates
      const { data: existingTasks } = await supabase
        .from('mandato_checklist_tasks')
        .select('tarea')
        .eq('mandato_id', mandato.id);

      const existingTaskTitles = (existingTasks || []).map((t: any) => t.tarea) || [];

      const prompt = `Genera tareas para el mandato M&A:
      
Tipo: ${dealContext.tipo === 'compra' ? 'Buy-Side (Compra)' : 'Sell-Side (Venta)'}
Empresa: ${dealContext.empresa_nombre}
Descripción: ${dealContext.descripcion}
Fase actual: ${dealContext.fase_actual}
Estado: ${dealContext.estado}

${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}

Tareas ya existentes (NO duplicar):
${existingTaskTitles.join('\n') || 'Ninguna'}

Genera 5-8 tareas concretas y accionables para ${phase === 'all' ? 'todas las fases del proceso' : `la fase "${phase}"`}.`;

      const { data, error } = await supabase.functions.invoke('task-ai', {
        body: { 
          raw_text: prompt,
          user_context: {
            role: 'socio',
            deal_mode: true,
            mandato_id: mandato.id
          }
        }
      });

      if (error) throw error;
      
      if (data.success && data.tasks) {
        // Add mandato context to tasks
        const tasksWithContext = data.tasks.map((task: ParsedTask) => ({
          ...task,
          context_type: 'mandato' as const,
          context_hint: mandato.empresa_principal?.nombre || mandato.id,
        }));
        setGeneratedTasks(tasksWithContext);
      } else {
        throw new Error(data.error || 'Error generando tareas');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast.error('Error al generar tareas con IA');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async (asChecklist: boolean) => {
    if (generatedTasks.length === 0) return;
    
    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      if (asChecklist) {
        // Create as mandato_checklist_tasks
        const checklistTasks = generatedTasks.map((task, index) => ({
          mandato_id: mandato.id,
          tarea: task.title,
          descripcion: task.description,
          fase: task.suggested_fase || '1. Preparación',
          prioridad: task.priority,
          completada: false,
          orden: index,
          ai_generated: true,
        }));

        const { error } = await supabase
          .from('mandato_checklist_tasks')
          .insert(checklistTasks);

        if (error) throw error;
        toast.success(`${generatedTasks.length} tareas añadidas al checklist del mandato`);
      } else {
        // Create as regular tareas
        const tareas = generatedTasks.map(task => ({
          titulo: task.title,
          descripcion: task.description,
          estado: 'pendiente' as const,
          prioridad: task.priority,
          fecha_vencimiento: task.due_date,
          asignado_a: task.assigned_to_id,
          created_by: user.id,
          mandato_id: mandato.id,
          ai_generated: true,
          source_text: `Generado desde mandato: ${mandato.empresa_principal?.nombre || mandato.id}`,
        }));

        const { error } = await supabase
          .from('tareas')
          .insert(tareas);

        if (error) throw error;

        // Log events
        const events = generatedTasks.map(task => ({
          task_id: mandato.id,
          task_type: 'tarea' as const,
          event_type: 'AI_CREATED' as const,
          payload: { title: task.title, source: 'deal_generation' },
          created_by: user.id,
        }));

        await supabase.from('task_events').insert(events);
        
        toast.success(`${generatedTasks.length} tareas creadas`);
      }

      onSuccess?.();
      onOpenChange(false);
      setGeneratedTasks([]);
      setAdditionalContext("");
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast.error('Error al crear tareas');
    } finally {
      setCreating(false);
    }
  };

  const removeTask = (index: number) => {
    setGeneratedTasks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generar Tareas con IA
          </DialogTitle>
          <DialogDescription>
            Genera tareas automáticamente basadas en el mandato "{mandato.empresa_principal?.nombre || 'Sin nombre'}"
          </DialogDescription>
        </DialogHeader>

        {generatedTasks.length === 0 ? (
          <div className="space-y-4 py-4">
            {/* Phase selector */}
            <div className="space-y-2">
              <Label>Fase del proceso</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional context */}
            <div className="space-y-2">
              <Label>Contexto adicional (opcional)</Label>
              <Textarea
                placeholder="Ej: Enfocarse en la preparación del teaser, el comprador requiere documentación fiscal detallada..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
              />
            </div>

            {/* Mandato info */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Información del mandato:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">
                  {mandato.tipo === 'compra' ? 'Buy-Side' : 'Sell-Side'}
                </Badge>
                <Badge variant="outline">{mandato.estado}</Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{generatedTasks.length} tareas generadas</span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {generatedTasks.map((task, index) => (
                <TaskPreviewCard 
                  key={index} 
                  task={task} 
                  index={index}
                  onRemove={() => removeTask(index)}
                />
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {generatedTasks.length === 0 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Tareas
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setGeneratedTasks([])}>
                Volver
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleCreateTasks(true)}
                disabled={creating}
              >
                Añadir al Checklist M&A
              </Button>
              <Button 
                onClick={() => handleCreateTasks(false)}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Crear como Tareas
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
