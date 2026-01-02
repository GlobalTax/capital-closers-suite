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
import { createMandato } from "@/services/mandatos";
import type { Empresa } from "@/types";
import { Loader2, Plus, Building2, Calendar } from "lucide-react";

const mandatoSchema = z.object({
  empresaId: z.string().optional(),
  nuevaEmpresa: z.string().optional(),
  tipo: z.enum(["compra", "venta"], {
    required_error: "Selecciona el tipo de mandato",
  }),
  valor: z.string().optional(),
  probabilidad: z.coerce.number().min(0).max(100).optional(),
  fechaCierreEsperada: z.string().optional(),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres"),
}).refine((data) => data.empresaId || data.nuevaEmpresa, {
  message: "Selecciona una empresa existente o crea una nueva",
  path: ["empresaId"],
});

type MandatoFormValues = z.infer<typeof mandatoSchema>;

interface NuevoMandatoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NuevoMandatoDrawer({
  open,
  onOpenChange,
  onSuccess,
}: NuevoMandatoDrawerProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewEmpresa, setShowNewEmpresa] = useState(false);

  const form = useForm<MandatoFormValues>({
    resolver: zodResolver(mandatoSchema),
    defaultValues: {
      empresaId: "",
      nuevaEmpresa: "",
      tipo: "venta",
      valor: "",
      probabilidad: 50,
      fechaCierreEsperada: "",
      descripcion: "",
    },
  });

  useEffect(() => {
    if (open) {
      cargarEmpresas();
    }
  }, [open]);

  const cargarEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const data = await fetchEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar la lista de empresas");
    } finally {
      setLoadingEmpresas(false);
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

      if (!empresaId) {
        toast.error("Debes seleccionar o crear una empresa");
        setSubmitting(false);
        return;
      }

      await createMandato({
        tipo: data.tipo,
        descripcion: data.descripcion,
        estado: "activo",
        empresa_principal_id: empresaId,
        valor: data.valor ? Number(data.valor.replace(/[^0-9]/g, '')) : undefined,
        prioridad: "media",
        fecha_cierre: data.fechaCierreEsperada || undefined,
      });

      toast.success("Mandato creado exitosamente");
      form.reset();
      setShowNewEmpresa(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creando mandato:", error);
      toast.error("Error al crear el mandato");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Nuevo Mandato M&A</DrawerTitle>
            <DrawerDescription>
              Crea un nuevo mandato de compra o venta asociado a una empresa
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Selección de Empresa */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Empresa Principal *</FormLabel>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingEmpresas}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una empresa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background max-h-60">
                              {empresas.map((empresa) => (
                                <SelectItem key={empresa.id} value={empresa.id}>
                                  <span className="flex items-center gap-2">
                                    <Building2 className="w-3 h-3" />
                                    {empresa.nombre}
                                    {empresa.sector && (
                                      <span className="text-xs text-muted-foreground">
                                        ({empresa.sector})
                                      </span>
                                    )}
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
                </div>

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Mandato *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="venta" id="venta" />
                            <label htmlFor="venta" className="cursor-pointer">
                              Venta (Sell-Side)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="compra" id="compra" />
                            <label htmlFor="compra" className="cursor-pointer">
                              Compra (Buy-Side)
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado (€)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 2500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="probabilidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilidad (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            placeholder="50" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fechaCierreEsperada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Cierre Esperada</FormLabel>
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
                          placeholder="Describe el mandato, objetivos y contexto del deal..."
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
                    Crear Mandato
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
