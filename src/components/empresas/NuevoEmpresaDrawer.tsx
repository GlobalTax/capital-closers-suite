import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmpresa } from "@/services/empresas";
import { Building2, Save } from "lucide-react";

const empresaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  cif: z.string().optional(),
  sector: z.string().min(2, "El sector es requerido"),
  subsector: z.string().optional(),
  ubicacion: z.string().optional(),
  sitio_web: z.string().optional(),
  empleados: z.coerce.number().optional(),
  facturacion: z.coerce.number().optional(),
  revenue: z.coerce.number().optional(),
  ebitda: z.coerce.number().optional(),
  deuda: z.coerce.number().optional(),
  capital_circulante: z.coerce.number().optional(),
  descripcion: z.string().optional(),
  es_target: z.boolean().default(false),
  nivel_interes: z.enum(["Alto", "Medio", "Bajo"]).optional(),
  estado_target: z.enum(["pendiente", "contactada", "interesada", "rechazada", "en_dd", "oferta", "cerrada"]).optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface NuevoEmpresaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmpresaCreada: () => void;
}

export function NuevoEmpresaDrawer({ open, onOpenChange, onEmpresaCreada }: NuevoEmpresaDrawerProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      es_target: false,
    },
  });

  const esTarget = form.watch("es_target");

  const onSubmit = async (data: EmpresaFormData) => {
    setSubmitting(true);
    try {
      await createEmpresa(data);
      toast.success("Empresa creada correctamente");
      form.reset();
      onEmpresaCreada();
    } catch (error) {
      console.error("Error creando empresa:", error);
      toast.error("Error al crear la empresa");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nueva Empresa
          </DrawerTitle>
          <DrawerDescription>
            Completa los datos de la nueva empresa
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIF</FormLabel>
                      <FormControl>
                        <Input placeholder="B12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector *</FormLabel>
                      <FormControl>
                        <Input placeholder="Tecnología, Retail, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subsector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subsector</FormLabel>
                      <FormControl>
                        <Input placeholder="Subsector específico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid, Barcelona, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sitio_web"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="empleados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleados</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facturacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facturación (€)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Datos Financieros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="revenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Revenue (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ebitda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EBITDA (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deuda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deuda (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capital_circulante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital Circulante (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="200000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <FormField
                  control={form.control}
                  name="es_target"
                  render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 p-4 border rounded-lg">
                      <div>
                        <FormLabel>Empresa Prioritaria</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Marcar como empresa de interés prioritaria
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {esTarget && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="nivel_interes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nivel de Interés</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona nivel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background">
                              <SelectItem value="Alto">Alto</SelectItem>
                              <SelectItem value="Medio">Medio</SelectItem>
                              <SelectItem value="Bajo">Bajo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado de Seguimiento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background">
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="contactada">Contactada</SelectItem>
                              <SelectItem value="interesada">Interesada</SelectItem>
                              <SelectItem value="rechazada">Rechazada</SelectItem>
                              <SelectItem value="en_dd">En DD</SelectItem>
                              <SelectItem value="oferta">Oferta</SelectItem>
                              <SelectItem value="cerrada">Cerrada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Información adicional sobre la empresa"
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
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Creando..." : "Crear Empresa"}
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
      </DrawerContent>
    </Drawer>
  );
}
