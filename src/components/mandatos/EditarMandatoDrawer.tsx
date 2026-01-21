import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { updateMandato } from "@/services/mandatos";
import type { Mandato, MandatoEstado, TareaPrioridad, MandatoOutcome, LossReasonType } from "@/types";
import { usePipelineGates } from "@/hooks/usePipelineGates";
import { PipelineGateAlert } from "./PipelineGateAlert";
import { CloseMandatoDialog, type CloseData } from "./CloseMandatoDialog";
import type { PipelineStage, GateValidationResult } from "@/lib/pipeline-gates";

const formSchema = z.object({
  estado: z.enum(["prospecto", "activo", "en_negociacion", "cerrado", "cancelado"]),
  valor: z.number().min(0).optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  pipeline_stage: z.enum(["prospeccion", "loi", "due_diligence", "negociacion", "cierre", "propuesta", "en_ejecucion", "entregado"]).optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
  fecha_cierre: z.string().optional().nullable(),
  prioridad: z.enum(["alta", "media", "baja", "urgente"]).optional().nullable(),
  descripcion: z.string().optional().nullable(),
  nombre_proyecto: z.string().max(100).optional().nullable(),
  // Campos de compra
  rango_inversion_min: z.number().optional().nullable(),
  rango_inversion_max: z.number().optional().nullable(),
  perfil_empresa_buscada: z.string().optional().nullable(),
  timeline_objetivo: z.string().optional().nullable(),
  // Campos de venta
  valoracion_esperada: z.number().optional().nullable(),
  tipo_comprador_buscado: z.string().optional().nullable(),
  estado_negociacion: z.string().optional().nullable(),
  numero_ofertas_recibidas: z.number().optional().nullable(),
  potencial_searchfund: z.boolean().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditarMandatoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandato: Mandato;
  onSuccess?: () => void;
}

const estadosOptions: { value: MandatoEstado; label: string }[] = [
  { value: "prospecto", label: "Prospecto" },
  { value: "activo", label: "Activo" },
  { value: "en_negociacion", label: "En Negociación" },
  { value: "cerrado", label: "Cerrado" },
  { value: "cancelado", label: "Cancelado" },
];

const pipelineStages = [
  { value: "prospeccion", label: "Prospección" },
  { value: "loi", label: "LOI" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "negociacion", label: "Negociación" },
  { value: "cierre", label: "Cierre" },
];

const prioridadOptions: { value: TareaPrioridad; label: string }[] = [
  { value: "urgente", label: "🔴 Urgente" },
  { value: "alta", label: "🟠 Alta" },
  { value: "media", label: "🟡 Media" },
  { value: "baja", label: "🟢 Baja" },
];

export function EditarMandatoDrawer({
  open,
  onOpenChange,
  mandato,
  onSuccess,
}: EditarMandatoDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [gateResult, setGateResult] = useState<GateValidationResult | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<"won" | "lost" | "cancelled">("won");
  
  // Hook para validación de gates
  const { validateTransition } = usePipelineGates({ mandato });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      estado: mandato.estado,
      valor: mandato.valor || null,
      probability: (mandato as any).probability || 50,
      pipeline_stage: (mandato as any).pipeline_stage || "prospeccion",
      expected_close_date: (mandato as any).expected_close_date?.split("T")[0] || null,
      fecha_cierre: mandato.fecha_cierre?.split("T")[0] || null,
      prioridad: mandato.prioridad || null,
      descripcion: mandato.descripcion || null,
      nombre_proyecto: mandato.nombre_proyecto || null,
      rango_inversion_min: mandato.rango_inversion_min || null,
      rango_inversion_max: mandato.rango_inversion_max || null,
      perfil_empresa_buscada: mandato.perfil_empresa_buscada || null,
      timeline_objetivo: mandato.timeline_objetivo || null,
      valoracion_esperada: mandato.valoracion_esperada || null,
      tipo_comprador_buscado: mandato.tipo_comprador_buscado || null,
      estado_negociacion: mandato.estado_negociacion || null,
      numero_ofertas_recibidas: mandato.numero_ofertas_recibidas || null,
      potencial_searchfund: (mandato as any).potencial_searchfund || false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        estado: mandato.estado,
        valor: mandato.valor || null,
        probability: (mandato as any).probability || 50,
        pipeline_stage: (mandato as any).pipeline_stage || "prospeccion",
        expected_close_date: (mandato as any).expected_close_date?.split("T")[0] || null,
        fecha_cierre: mandato.fecha_cierre?.split("T")[0] || null,
        prioridad: mandato.prioridad || null,
        descripcion: mandato.descripcion || null,
        nombre_proyecto: mandato.nombre_proyecto || null,
        rango_inversion_min: mandato.rango_inversion_min || null,
        rango_inversion_max: mandato.rango_inversion_max || null,
        perfil_empresa_buscada: mandato.perfil_empresa_buscada || null,
        timeline_objetivo: mandato.timeline_objetivo || null,
        valoracion_esperada: mandato.valoracion_esperada || null,
        tipo_comprador_buscado: mandato.tipo_comprador_buscado || null,
        estado_negociacion: mandato.estado_negociacion || null,
        numero_ofertas_recibidas: mandato.numero_ofertas_recibidas || null,
        potencial_searchfund: (mandato as any).potencial_searchfund || false,
      });
      // Reset gate result when drawer opens
      setGateResult(null);
    }
  }, [open, mandato, form]);

  // Handler para cambio de pipeline_stage con validación de gates
  const handlePipelineStageChange = (newStage: string, fieldOnChange: (value: string) => void) => {
    const currentStage = form.getValues('pipeline_stage') as PipelineStage || 'prospeccion';
    const result = validateTransition(currentStage, newStage as PipelineStage);
    
    if (result.canProceed) {
      fieldOnChange(newStage);
      setGateResult(null);
    } else {
      // Bloquear cambio y mostrar requisitos faltantes
      setGateResult(result);
    }
  };

  // Handler para resolver requisitos - navegar al tab correspondiente
  const handleResolveGate = (link: string) => {
    onOpenChange(false);
    // El link puede ser 'resumen', 'documentos', 'checklist', 'edit', etc.
    // La navegación real dependerá de cómo esté estructurada la UI
    toast.info(`Navega a la sección "${link}" para completar el requisito`);
  };

  const probability = form.watch("probability") || 50;
  const valor = form.watch("valor") || 0;
  const weightedValue = Math.round((valor * probability) / 100);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // No enviar weighted_value ya que es una columna generada en PostgreSQL
      await updateMandato(mandato.id, values);
      toast.success("Mandato actualizado correctamente");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el mandato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Mandato</SheetTitle>
          <SheetDescription>
            {mandato.tipo === "compra" ? "Mandato de Compra" : "Mandato de Venta"} - {mandato.empresa_principal?.nombre}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Estado y Pipeline */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        // Intercept close states to show close dialog
                        if (value === "cerrado") {
                          setPendingOutcome("won");
                          setCloseDialogOpen(true);
                        } else if (value === "cancelado") {
                          setPendingOutcome("cancelled");
                          setCloseDialogOpen(true);
                        } else {
                          field.onChange(value);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estadosOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pipeline_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipeline Stage</FormLabel>
                    <Select 
                      onValueChange={(value) => handlePipelineStageChange(value, field.onChange)} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelineStages.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Gate Alert - Requisitos pendientes */}
            {gateResult && !gateResult.canProceed && (
              <PipelineGateAlert
                failedRequirements={gateResult.failedRequirements}
                onResolve={handleResolveGate}
                onDismiss={() => setGateResult(null)}
              />
            )}

            {/* Valor y Probabilidad */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor del Deal (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000000"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Probabilidad de Cierre</FormLabel>
                      <span className="text-sm font-medium">{field.value || 50}%</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value || 50]}
                        onValueChange={(v) => field.onChange(v[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Valor ponderado: €{weightedValue.toLocaleString()}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Esperada Cierre</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {prioridadOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos específicos de COMPRA */}
            {mandato.tipo === "compra" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm">Criterios de Búsqueda</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rango_inversion_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inversión Mín (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rango_inversion_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inversión Máx (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5000000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="perfil_empresa_buscada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil de Empresa Buscada</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del perfil..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline_objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline Objetivo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="6-12 meses"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Campos específicos de VENTA */}
            {mandato.tipo === "venta" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Detalles de Venta</h4>
                  
                  {/* Toggle Potencial Searchfund */}
                  <FormField
                    control={form.control}
                    name="potencial_searchfund"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className="text-xs text-muted-foreground">Potencial SF</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="valoracion_esperada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valoración Esperada (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2000000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_comprador_buscado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Comprador Buscado</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Estratégico, Financiero, MBO..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estado_negociacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Negociación</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Inicial, Avanzada..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero_ofertas_recibidas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ofertas Recibidas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre el mandato..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Close Mandato Dialog */}
        <CloseMandatoDialog
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
          mandato={mandato}
          initialOutcome={pendingOutcome}
          onConfirm={async (closeData: CloseData) => {
            setLoading(true);
            try {
              const newEstado = closeData.outcome === "won" ? "cerrado" : "cancelado";
              await updateMandato(mandato.id, {
                estado: newEstado,
                outcome: closeData.outcome,
                loss_reason: closeData.loss_reason,
                loss_notes: closeData.loss_notes,
                won_value: closeData.won_value,
              } as any);
              toast.success(`Mandato ${closeData.outcome === "won" ? "cerrado como ganado" : closeData.outcome === "lost" ? "marcado como perdido" : "cancelado"}`);
              onSuccess?.();
              onOpenChange(false);
            } catch (error) {
              console.error("Error:", error);
              toast.error("Error al cerrar el mandato");
            } finally {
              setLoading(false);
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
