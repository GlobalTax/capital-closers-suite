import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon, Send, Save } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ESTRUCTURA_HONORARIOS_LABELS } from "@/lib/constants";
import type { PropuestaHonorarios, PropuestaConcepto } from "@/types/propuestas";

const conceptoSchema = z.object({
  concepto: z.string().min(1, "Requerido"),
  descripcion: z.string().optional(),
  importe: z.number().min(0, "Debe ser positivo"),
});

const formSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().optional(),
  estructura: z.enum(["fijo", "exito", "mixto", "horario"]).optional(),
  fecha_vencimiento: z.date().optional(),
  condiciones_pago: z.string().optional(),
  notas_internas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevaPropuestaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propuesta?: PropuestaHonorarios | null;
  version: number;
  onSave: (data: Partial<PropuestaHonorarios>, enviar: boolean) => void;
  isLoading?: boolean;
}

export function NuevaPropuestaDrawer({
  open,
  onOpenChange,
  propuesta,
  version,
  onSave,
  isLoading,
}: NuevaPropuestaDrawerProps) {
  const [conceptos, setConceptos] = useState<PropuestaConcepto[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      estructura: undefined,
      condiciones_pago: "",
      notas_internas: "",
    },
  });

  useEffect(() => {
    if (propuesta) {
      form.reset({
        titulo: propuesta.titulo,
        descripcion: propuesta.descripcion || "",
        estructura: propuesta.estructura,
        fecha_vencimiento: propuesta.fecha_vencimiento
          ? new Date(propuesta.fecha_vencimiento)
          : undefined,
        condiciones_pago: propuesta.condiciones_pago || "",
        notas_internas: propuesta.notas_internas || "",
      });
      setConceptos(propuesta.desglose || []);
    } else {
      form.reset({
        titulo: "",
        descripcion: "",
        estructura: undefined,
        condiciones_pago: "",
        notas_internas: "",
      });
      setConceptos([]);
    }
  }, [propuesta, form]);

  const total = conceptos.reduce((sum, c) => sum + (c.importe || 0), 0);

  const addConcepto = () => {
    setConceptos([...conceptos, { concepto: "", descripcion: "", importe: 0 }]);
  };

  const updateConcepto = (index: number, field: keyof PropuestaConcepto, value: string | number) => {
    const updated = [...conceptos];
    updated[index] = { ...updated[index], [field]: value };
    setConceptos(updated);
  };

  const removeConcepto = (index: number) => {
    setConceptos(conceptos.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: FormValues, enviar: boolean) => {
    onSave(
      {
        ...values,
        version,
        desglose: conceptos,
        importe_total: total,
        fecha_vencimiento: values.fecha_vencimiento
          ? format(values.fecha_vencimiento, "yyyy-MM-dd")
          : undefined,
      },
      enviar
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>
            {propuesta ? `Editar propuesta v${propuesta.version}` : `Nueva propuesta v${version}`}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <Form {...form}>
            <form className="space-y-6 pb-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Propuesta Due Diligence Financiera" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del alcance</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el alcance del servicio..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estructura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estructura</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ESTRUCTURA_HONORARIOS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
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
                  name="fecha_vencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "d/MM/yyyy") : "Seleccionar..."}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Desglose de conceptos</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addConcepto}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>

                {conceptos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Añade conceptos para detallar la propuesta
                  </p>
                ) : (
                  <div className="space-y-3">
                    {conceptos.map((concepto, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4">
                          <Input
                            placeholder="Concepto"
                            value={concepto.concepto}
                            onChange={(e) => updateConcepto(index, "concepto", e.target.value)}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Descripción (opcional)"
                            value={concepto.descripcion || ""}
                            onChange={(e) => updateConcepto(index, "descripcion", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Importe"
                            value={concepto.importe || ""}
                            onChange={(e) =>
                              updateConcepto(index, "importe", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeConcepto(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">Total: </span>
                        <span className="text-lg font-medium">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="condiciones_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condiciones de pago</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: 50% al inicio, 50% a la entrega del informe"
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notas_internas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas internas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas no visibles al cliente..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <DrawerFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={form.handleSubmit((v) => handleSubmit(v, false))}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar borrador
          </Button>
          <Button
            className="flex-1"
            onClick={form.handleSubmit((v) => handleSubmit(v, true))}
            disabled={isLoading}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar propuesta
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
