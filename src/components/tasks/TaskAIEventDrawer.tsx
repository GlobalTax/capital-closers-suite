import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { useTaskAIFeedback } from "@/hooks/useTaskAIEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  Loader2,
} from "lucide-react";
import type { TaskAIEventWithTasks } from "@/services/taskAIFeedback.service";

interface TaskAIEventDrawerProps {
  event: TaskAIEventWithTasks | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskAIEventDrawer({ event, open, onOpenChange }: TaskAIEventDrawerProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<boolean | null>(null);
  const feedbackMutation = useTaskAIFeedback();

  if (!event) return null;

  const originalInput = event.payload?.original_input || 'Sin texto original';
  const parsedTask = event.payload?.parsed_task;
  const confidence = event.payload?.confidence || 0;

  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    en_progreso: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completada: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    completada: 'Completada',
  };

  const priorityColors: Record<string, string> = {
    urgente: 'bg-red-500/10 text-red-600 border-red-500/20',
    alta: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    media: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    baja: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  const handleSubmitFeedback = async () => {
    if (selectedFeedback === null) return;

    await feedbackMutation.mutateAsync({
      eventId: event.id,
      taskId: event.task_id,
      isUseful: selectedFeedback,
      feedbackText: feedbackText.trim() || undefined,
    });

    setFeedbackText('');
    setSelectedFeedback(null);
    onOpenChange(false);
  };

  const currentFeedback = event.feedback?.is_useful;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalle del Evento AI
            </DrawerTitle>
            <DrawerDescription>
              Revisa la interpretación de la IA y proporciona feedback
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-6">
            {/* Original Input */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                TEXTO ORIGINAL
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-sm whitespace-pre-wrap">{originalInput}</p>
              </div>
            </div>

            <Separator />

            {/* Metrics */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                MÉTRICAS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Confianza</p>
                  <ConfidenceBadge confidence={confidence} showLabel />
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                  <p className="text-sm font-medium">
                    {format(parseISO(event.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                {parsedTask?.estimated_minutes && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground mb-1">Tiempo estimado</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {parsedTask.estimated_minutes} min
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Generated Task */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                TAREA GENERADA
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 border space-y-3">
                <div>
                  <p className="font-medium">{event.tarea?.titulo || parsedTask?.title || 'Sin título'}</p>
                  {parsedTask?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{parsedTask.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.tarea?.estado && (
                    <Badge variant="outline" className={statusColors[event.tarea.estado]}>
                      {statusLabels[event.tarea.estado]}
                    </Badge>
                  )}
                  {(event.tarea?.prioridad || parsedTask?.priority) && (
                    <Badge variant="outline" className={priorityColors[event.tarea?.prioridad || parsedTask?.priority || 'media']}>
                      Prioridad: {event.tarea?.prioridad || parsedTask?.priority}
                    </Badge>
                  )}
                  {parsedTask?.due_date && (
                    <Badge variant="outline" className="bg-muted">
                      Vence: {format(parseISO(parsedTask.due_date), "d MMM", { locale: es })}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Feedback Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                💬 TU FEEDBACK
              </h3>
              <p className="text-sm text-muted-foreground">
                ¿Fue útil esta interpretación de la IA?
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant={selectedFeedback === true || currentFeedback === true ? "default" : "outline"}
                  className={selectedFeedback === true || currentFeedback === true 
                    ? "bg-green-600 hover:bg-green-700" 
                    : ""}
                  onClick={() => setSelectedFeedback(true)}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Útil
                </Button>
                <Button
                  variant={selectedFeedback === false || currentFeedback === false ? "default" : "outline"}
                  className={selectedFeedback === false || currentFeedback === false 
                    ? "bg-red-600 hover:bg-red-700" 
                    : ""}
                  onClick={() => setSelectedFeedback(false)}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No útil
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Comentario (opcional):
                </label>
                <Textarea
                  placeholder="¿Qué podría mejorarse en la interpretación?"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSubmitFeedback}
                disabled={selectedFeedback === null || feedbackMutation.isPending}
                className="w-full"
              >
                {feedbackMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Feedback'
                )}
              </Button>

              {event.feedback && (
                <p className="text-xs text-muted-foreground text-center">
                  Ya proporcionaste feedback anteriormente. Puedes actualizarlo.
                </p>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
