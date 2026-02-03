import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchEmpresas, createEmpresa } from "@/services/empresas";
import { EmpresaSearchSelect } from "@/components/shared/EmpresaSearchSelect";
import { createMandato, fetchMandatos } from "@/services/mandatos";
import type { Empresa, Mandato } from "@/types";
import { Loader2, Plus, Building2, Calendar, Briefcase, Search, FileText, Calculator, Users, Link, ShoppingCart, TrendingUp } from "lucide-react";
import { 
  MANDATO_CATEGORIA_LABELS, 
  SERVICIO_TIPO_LABELS, 
  ESTRUCTURA_HONORARIOS_LABELS 
} from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";

const mandatoSchema = z.object({
  categoria: z.enum(["operacion_ma", "due_diligence", "spa_legal", "valoracion", "asesoria"], {
    required_error: "Selecciona el tipo de proyecto",
  }),
  empresaId: z.string().optional(),
  nuevaEmpresa: z.string().optional(),
  nombre_proyecto: z.string().max(100, "El nombre del proyecto no puede exceder 100 caracteres").optional(),
  tipo: z.enum(["compra", "venta"]).optional(),
  valor: z.string().optional(),
  probabilidad: z.coerce.number().min(0).max(100).optional(),
  fechaCierreEsperada: z.string().optional(),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  // Campos de servicios
  servicio_tipo: z.enum(["buy-side", "sell-side", "vendor", "independiente"]).optional(),
  cliente_externo: z.string().optional(),
  honorarios_propuestos: z.coerce.number().min(0).optional(),
  estructura_honorarios: z.enum(["fijo", "exito", "mixto", "horario"]).optional(),
  parent_mandato_id: z.string().optional(),
  vincular_operacion: z.boolean().optional(),
}).refine((data) => {
  // Para operaciones M&A, necesita empresa o nueva empresa
  if (data.categoria === "operacion_ma") {
    return data.empresaId || data.nuevaEmpresa;
  }
  // Para servicios, puede tener empresa, cliente externo, o parent_mandato
  return data.empresaId || data.nuevaEmpresa || data.cliente_externo || data.parent_mandato_id;
}, {
  message: "Indica una empresa, cliente externo, o vincula a una operación",
  path: ["empresaId"],
}).refine((data) => {
  // Para operaciones M&A, tipo es obligatorio
  if (data.categoria === "operacion_ma") {
    return !!data.tipo;
  }
  return true;
}, {
  message: "Selecciona el tipo de mandato",
  path: ["tipo"],
});

type MandatoFormValues = z.infer<typeof mandatoSchema>;

interface NuevoMandatoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTipo?: "compra" | "venta";
  defaultEmpresaId?: string;
  defaultEmpresaNombre?: string;
}

const categoriaIcons: Record<string, React.ReactNode> = {
  operacion_ma: <Briefcase className="w-4 h-4" />,
  due_diligence: <Search className="w-4 h-4" />,
  spa_legal: <FileText className="w-4 h-4" />,
  valoracion: <Calculator className="w-4 h-4" />,
  asesoria: <Users className="w-4 h-4" />,
};

export function NuevoMandatoDrawer({
  open,
  onOpenChange,
  onSuccess,
  defaultTipo = "venta",
  defaultEmpresaId,
  defaultEmpresaNombre,
}: NuevoMandatoDrawerProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]); // Solo para crear nueva empresa
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loadingMandatos, setLoadingMandatos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewEmpresa, setShowNewEmpresa] = useState(false);

  const form = useForm<MandatoFormValues>({
    resolver: zodResolver(mandatoSchema),
    defaultValues: {
      categoria: "operacion_ma",
      empresaId: "",
      nuevaEmpresa: "",
      nombre_proyecto: "",
      tipo: defaultTipo,
      valor: "",
      probabilidad: 50,
      fechaCierreEsperada: "",
      descripcion: "",
      servicio_tipo: undefined,
      cliente_externo: "",
      honorarios_propuestos: undefined,
      estructura_honorarios: undefined,
      parent_mandato_id: "",
      vincular_operacion: false,
    },
  });

  const categoria = form.watch("categoria");
  const vincularOperacion = form.watch("vincular_operacion");
  const isServicio = categoria !== "operacion_ma";

  useEffect(() => {
    if (open) {
      cargarDatos();
      // Solo actualizar si el tipo actual es diferente
      const currentTipo = form.getValues('tipo');
      if (currentTipo !== defaultTipo) {
        form.setValue('tipo', defaultTipo);
      }
      // Pre-seleccionar empresa si viene por defecto
      if (defaultEmpresaId) {
        form.setValue('empresaId', defaultEmpresaId);
      }
    }
  }, [open, defaultTipo, defaultEmpresaId]);

  const cargarDatos = async () => {
    setLoadingMandatos(true);
    try {
      const mandatosData = await fetchMandatos();
      // Solo mostrar mandatos M&A activos para vincular
      setMandatos(mandatosData.filter(m => 
        (m.categoria === "operacion_ma" || !m.categoria) && 
        m.estado !== "cerrado" && 
        m.estado !== "cancelado"
      ));
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoadingMandatos(false);
    }
  };

  const onSubmit = async (data: MandatoFormValues) => {
    setSubmitting(true);
    try {
      let empresaId = data.empresaId;
      
      // Si se está creando una nueva empresa
      if (showNewEmpresa && data.nuevaEmpresa) {
        const nuevaEmpresa = await createEmpresa({
          nombre: data.nuevaEmpresa,
          sector: "Por definir",
          es_target: data.tipo === "compra",
        });
        empresaId = nuevaEmpresa.id;
      }

      // Determinar pipeline_stage inicial
      const pipelineStage = data.categoria === "operacion_ma" 
        ? "prospeccion" 
        : "propuesta";

      await createMandato({
        categoria: data.categoria,
        tipo: data.tipo || "venta", // Default para servicios
        descripcion: data.descripcion,
        estado: "activo",
        empresa_principal_id: empresaId || undefined,
        nombre_proyecto: data.nombre_proyecto || undefined,
        valor: data.valor ? Number(data.valor.replace(/[^0-9]/g, '')) : undefined,
        prioridad: "media",
        fecha_cierre: data.fechaCierreEsperada || undefined,
        pipeline_stage: pipelineStage,
        // Campos de servicios
        servicio_tipo: data.servicio_tipo,
        cliente_externo: data.cliente_externo || undefined,
        honorarios_propuestos: data.honorarios_propuestos,
        estructura_honorarios: data.estructura_honorarios,
        parent_mandato_id: data.vincular_operacion ? data.parent_mandato_id : undefined,
      } as any);

      const categoriaLabel = MANDATO_CATEGORIA_LABELS[data.categoria]?.label || "Proyecto";
      toast.success(`${categoriaLabel} creado exitosamente`);
      form.reset({
        categoria: "operacion_ma",
        empresaId: "",
        nuevaEmpresa: "",
        nombre_proyecto: "",
        tipo: defaultTipo,
        valor: "",
        probabilidad: 50,
        fechaCierreEsperada: "",
        descripcion: "",
        servicio_tipo: undefined,
        cliente_externo: "",
        honorarios_propuestos: undefined,
        estructura_honorarios: undefined,
        parent_mandato_id: "",
        vincular_operacion: false,
      });
      setShowNewEmpresa(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creando mandato:", error);
      toast.error("Error al crear el proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Nuevo Proyecto</DrawerTitle>
            <DrawerDescription>
              Crea una operación M&A o un servicio de asesoría
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Selector de Categoría */}
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Proyecto *</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(MANDATO_CATEGORIA_LABELS).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => field.onChange(key)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              field.value === key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {categoriaIcons[key]}
                              <span className="font-medium text-sm">{config.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vincular a operación existente (solo para servicios) */}
                {isServicio && (
                  <FormField
                    control={form.control}
                    name="vincular_operacion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            Vincular a una operación existente
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Este servicio forma parte de una operación M&A en curso
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Selector de operación padre */}
                {isServicio && vincularOperacion && (
                  <FormField
                    control={form.control}
                    name="parent_mandato_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operación Vinculada</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la operación" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background max-h-60">
                            {mandatos.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <span className="flex items-center gap-2">
                                  <Briefcase className="w-3 h-3" />
                                  {m.empresa_principal?.nombre || "Sin empresa"} - {m.tipo}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Empresa o Cliente */}
                {!vincularOperacion && (
                  <div className="space-y-2">
                    {/* Mostrar badge si empresa está pre-seleccionada */}
                    {defaultEmpresaId && defaultEmpresaNombre ? (
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Empresa:</span>
                        <span className="text-sm font-medium">{defaultEmpresaNombre}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <FormLabel>{isServicio ? "Empresa / Cliente" : "Empresa Principal *"}</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewEmpresa(!showNewEmpresa);
                              if (!showNewEmpresa) {
                                form.setValue("empresaId", "");
                              } else {
                                form.setValue("nuevaEmpresa", "");
                              }
                            }}
                          >
                            {showNewEmpresa ? (
                              <>Seleccionar existente</>
                            ) : (
                              <><Plus className="w-3 h-3 mr-1" />Nueva empresa</>
                            )}
                          </Button>
                        </div>

                        {showNewEmpresa ? (
                          <FormField
                            control={form.control}
                            name="nuevaEmpresa"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                      placeholder="Nombre de la nueva empresa" 
                                      className="pl-9" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name="empresaId"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <EmpresaSearchSelect
                                    value={field.value}
                                    onValueChange={(id) => field.onChange(id)}
                                    placeholder="Buscar empresa por nombre o CIF..."
                                    onCreateNew={() => {
                                      setShowNewEmpresa(true);
                                      form.setValue("empresaId", "");
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Cliente externo (solo para servicios) */}
                        {isServicio && !showNewEmpresa && (
                          <FormField
                            control={form.control}
                            name="cliente_externo"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="O introduce el nombre del cliente externo" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Nombre del Proyecto */}
                <FormField
                  control={form.control}
                  name="nombre_proyecto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Proyecto Eclipse, Operación Delta..." 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Nombre interno para identificar el mandato
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Mandato (solo para M&A) */}
                {!isServicio && (
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Mandato *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 gap-3"
                          >
                            <label
                              htmlFor="compra"
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                field.value === "compra"
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                  : "border-border hover:border-orange-300"
                              }`}
                            >
                              <RadioGroupItem value="compra" id="compra" className="sr-only" />
                              <div className={`p-2 rounded-full ${
                                field.value === "compra" 
                                  ? "bg-orange-500 text-white" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                <ShoppingCart className="w-5 h-5" />
                              </div>
                              <div>
                                <div className={`font-medium ${field.value === "compra" ? "text-orange-700 dark:text-orange-400" : ""}`}>
                                  Compra (Buy-Side)
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Buscamos targets para el cliente
                                </div>
                              </div>
                            </label>
                            <label
                              htmlFor="venta"
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                field.value === "venta"
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                  : "border-border hover:border-blue-300"
                              }`}
                            >
                              <RadioGroupItem value="venta" id="venta" className="sr-only" />
                              <div className={`p-2 rounded-full ${
                                field.value === "venta" 
                                  ? "bg-blue-500 text-white" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                <TrendingUp className="w-5 h-5" />
                              </div>
                              <div>
                                <div className={`font-medium ${field.value === "venta" ? "text-blue-700 dark:text-blue-400" : ""}`}>
                                  Venta (Sell-Side)
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Vendemos la empresa del cliente
                                </div>
                              </div>
                            </label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Campos específicos de Servicios */}
                {isServicio && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Detalles del Servicio</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="servicio_tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Servicio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(SERVICIO_TIPO_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
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
                        name="estructura_honorarios"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estructura Honorarios</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(ESTRUCTURA_HONORARIOS_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="honorarios_propuestos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Honorarios Propuestos (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ej: 25000" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Valor Estimado (solo para M&A) */}
                {!isServicio && (
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado (€)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: 2.500.000"
                            value={field.value || ''}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/[^\d]/g, '');
                              if (!numericValue) {
                                field.onChange('');
                                return;
                              }
                              const formatted = parseInt(numericValue).toLocaleString('es-ES');
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="fechaCierreEsperada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isServicio ? "Fecha de Entrega Esperada" : "Fecha de Cierre Esperada"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input type="date" className="pl-9" {...field} />
                        </div>
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
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={isServicio 
                            ? "Describe el alcance del servicio, entregables y objetivos..."
                            : "Describe el mandato, objetivos y contexto del deal..."
                          }
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear {MANDATO_CATEGORIA_LABELS[categoria]?.label || "Proyecto"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}