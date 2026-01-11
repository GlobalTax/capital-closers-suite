import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { createEmpresa } from "@/services/empresas";
import { createContacto } from "@/services/contactos";
import { addEmpresaToMandato } from "@/services/mandatos";
import { toast } from "sonner";
import { TARGET_ESTADOS, NIVEL_INTERES } from "@/lib/constants";
import type { NivelInteres, TargetEstado } from "@/types";
import { Building2, MapPin, Users, Euro, Briefcase, Mail, Phone, Globe, Loader2 } from "lucide-react";

const SECTORES = [
  "Tecnología",
  "Alimentación",
  "Retail",
  "Servicios",
  "Manufactura",
  "Salud",
  "Educación",
  "Construcción",
  "Logística",
  "Otros",
];

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "Máximo 100 caracteres"),
  sector: z.string().min(1, "Selecciona un sector"),
  facturacion: z.string().optional(),
  empleados: z.coerce.number().min(0).optional(),
  ubicacion: z.string().optional(),
  interes: z.enum(["Alto", "Medio", "Bajo"] as const),
  estado: z.enum(TARGET_ESTADOS),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
  contactoPrincipal: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevoTargetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mandatoId?: string;
}

export function NuevoTargetDrawer({ open, onOpenChange, onSuccess, mandatoId }: NuevoTargetDrawerProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      sector: "",
      facturacion: "",
      empleados: 0,
      ubicacion: "",
      interes: "Medio",
      estado: "pendiente",
      descripcion: "",
      contactoPrincipal: "",
      email: "",
      telefono: "",
      sitioWeb: "",
    },
  });

  const parseFacturacion = (facturacion: string): number | undefined => {
    if (!facturacion) return undefined;
    // Extraer número de strings como "€5M", "5.000.000", "5000000"
    const cleaned = facturacion.replace(/[€$,.\s]/g, '').replace(/M/gi, '000000').replace(/K/gi, '000');
    const value = parseInt(cleaned, 10);
    return isNaN(value) ? undefined : value;
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Crear la empresa con TODOS los campos capturados
      const nuevaEmpresa = await createEmpresa({
        nombre: values.nombre,
        sector: values.sector,
        descripcion: values.descripcion,
        es_target: true,
        estado_target: values.estado as TargetEstado,
        nivel_interes: values.interes as NivelInteres,
        ubicacion: values.ubicacion || undefined,
        empleados: values.empleados || undefined,
        facturacion: parseFacturacion(values.facturacion || ""),
        sitio_web: values.sitioWeb || undefined,
      });

      // Si hay datos de contacto, crear el contacto asociado
      if (values.contactoPrincipal || values.email) {
        const nombreParts = (values.contactoPrincipal || "Contacto").split(" ");
        await createContacto({
          nombre: nombreParts[0] || "Contacto",
          apellidos: nombreParts.slice(1).join(" ") || undefined,
          email: values.email || `contacto@${values.nombre.toLowerCase().replace(/\s/g, '')}.com`,
          telefono: values.telefono || undefined,
          empresa_principal_id: nuevaEmpresa.id,
        });
      }

      // Si hay mandatoId, asociar la empresa al mandato como target
      if (mandatoId) {
        await addEmpresaToMandato(mandatoId, nuevaEmpresa.id, "target", values.descripcion);
      }

      toast.success("Empresa target creada exitosamente");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Error al crear la empresa target");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Nueva Empresa Target</DrawerTitle>
          <DrawerDescription>
            Registra una nueva empresa objetivo para adquisición o inversión
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6 pb-4">
              {/* Información Básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Información Básica</span>
                </div>

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona sector" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SECTORES.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
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
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Madrid, España" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TARGET_ESTADOS.map((estado) => (
                              <SelectItem key={estado} value={estado}>
                                {estado === "en_dd" ? "Due Diligence" : estado.charAt(0).toUpperCase() + estado.slice(1)}
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
                    name="interes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de Interés *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4 pt-2"
                          >
                            {NIVEL_INTERES.map((nivel) => (
                              <div key={nivel} className="flex items-center space-x-2">
                                <RadioGroupItem value={nivel} id={`interes-${nivel}`} />
                                <Label htmlFor={`interes-${nivel}`} className="cursor-pointer">
                                  {nivel}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Datos Financieros */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Euro className="w-4 h-4" />
                  <span>Datos Financieros</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="facturacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facturación Estimada</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: €5M o 5000000" {...field} />
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
                        <FormLabel>Nº de Empleados</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="50" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contacto (opcional) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>Información de Contacto (Opcional)</span>
                </div>

                <FormField
                  control={form.control}
                  name="contactoPrincipal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del contacto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input type="email" placeholder="contacto@empresa.com" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="+34 600 000 000" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sitioWeb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input type="url" placeholder="https://www.empresa.com" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción / Notas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre la empresa..."
                          className="min-h-[100px] resize-none"
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {field.value?.length || 0}/500
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>

        <DrawerFooter className="border-t">
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" disabled={loading}>
                Cancelar
              </Button>
            </DrawerClose>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Creando..." : "Crear Empresa Target"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
