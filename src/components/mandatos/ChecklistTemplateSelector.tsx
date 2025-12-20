import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, AlertCircle, Clock } from "lucide-react";
import { fetchTemplatesByType, fetchFasesByType } from "@/services/checklistDynamic.service";
import type { ChecklistTemplate, ChecklistFaseConfig, MandatoTipo } from "@/types";

interface ChecklistTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoTipo: MandatoTipo;
  onConfirm: () => Promise<void>;
}

export function ChecklistTemplateSelector({
  open,
  onOpenChange,
  mandatoTipo,
  onConfirm,
}: ChecklistTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [fases, setFases] = useState<ChecklistFaseConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      loadPreview();
    }
  }, [open, mandatoTipo]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const [templatesData, fasesData] = await Promise.all([
        fetchTemplatesByType(mandatoTipo),
        fetchFasesByType(mandatoTipo),
      ]);
      setTemplates(templatesData);
      setFases(fasesData);
    } catch (error) {
      console.error("Error loading template preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  const templatesByFase = fases.reduce((acc, fase) => {
    acc[fase.nombre] = templates.filter(t => t.fase === fase.nombre);
    return acc;
  }, {} as Record<string, ChecklistTemplate[]>);

  const totalTasks = templates.length;
  const criticalTasks = templates.filter(t => t.es_critica).length;
  const totalDays = templates.reduce((acc, t) => acc + (t.duracion_estimada_dias || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Plantilla de Checklist - {mandatoTipo === 'compra' ? 'Compra' : 'Venta'}
          </DialogTitle>
          <DialogDescription>
            Revisa las tareas que se crearán automáticamente para este mandato
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
              <Badge variant="secondary" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {totalTasks} tareas
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {criticalTasks} críticas
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                ~{totalDays} días estimados
              </Badge>
            </div>

            {/* Fases and Tasks Preview */}
            <ScrollArea className="h-[400px] pr-4">
              <Accordion type="multiple" defaultValue={fases.map(f => f.nombre)}>
                {fases.map(fase => {
                  const faseTasks = templatesByFase[fase.nombre] || [];
                  const faseCritical = faseTasks.filter(t => t.es_critica).length;
                  const faseDays = faseTasks.reduce((acc, t) => acc + (t.duracion_estimada_dias || 0), 0);

                  return (
                    <AccordionItem key={fase.id} value={fase.nombre}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: fase.color }}
                          />
                          <span className="font-medium">{fase.nombre}</span>
                          <span className="text-sm text-muted-foreground">
                            ({faseTasks.length} tareas
                            {faseCritical > 0 && `, ${faseCritical} críticas`}
                            {faseDays > 0 && `, ~${faseDays}d`})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 pl-6">
                          {faseTasks.map((task, i) => (
                            <li key={task.id} className="flex items-start gap-2 text-sm">
                              <span className="text-muted-foreground w-5 shrink-0">
                                {i + 1}.
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span>{task.tarea}</span>
                                  {task.es_critica && (
                                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                      Crítica
                                    </Badge>
                                  )}
                                </div>
                                {task.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {task.descripcion}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  {task.responsable && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {task.responsable}
                                    </Badge>
                                  )}
                                  {task.duracion_estimada_dias && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      ~{task.duracion_estimada_dias}d
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || confirming}>
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              `Crear ${totalTasks} tareas`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}