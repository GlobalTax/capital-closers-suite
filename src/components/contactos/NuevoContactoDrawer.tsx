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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchEmpresas } from "@/services/empresas";
import { createContacto } from "@/services/contactos";
import { addContactoToMandato } from "@/services/mandatos";
import type { Empresa, ContactoRol } from "@/types";
import { Loader2 } from "lucide-react";

const contactoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellidos: z.string().optional(),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  empresa_principal_id: z.string().optional(),
  linkedin: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val.includes("linkedin.com") ||
        val === "",
      "Debe ser una URL válida de LinkedIn"
    ),
  notas: z.string().optional(),
  rol: z.enum(['vendedor', 'comprador', 'asesor', 'intermediario', 'otro'] as const).optional(),
  notas_mandato: z.string().optional(),
});

type ContactoFormValues = z.infer<typeof contactoSchema>;

interface NuevoContactoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mandatoId?: string;
}

export function NuevoContactoDrawer({
  open,
  onOpenChange,
  onSuccess,
  mandatoId,
}: NuevoContactoDrawerProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      nombre: "",
      apellidos: "",
      email: "",
      telefono: "",
      cargo: "",
      empresa_principal_id: "",
      linkedin: "",
      notas: "",
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

  const onSubmit = async (data: ContactoFormValues) => {
    setSubmitting(true);
    try {
      const nuevoContacto = await createContacto({
        nombre: data.nombre,
        apellidos: data.apellidos || undefined,
        email: data.email,
        telefono: data.telefono || undefined,
        cargo: data.cargo || undefined,
        empresa_principal_id: data.empresa_principal_id || undefined,
        linkedin: data.linkedin || undefined,
        notas: data.notas || undefined,
      });

      // Si hay mandatoId, vincular el contacto al mandato
      if (mandatoId && data.rol) {
        await addContactoToMandato(
          mandatoId,
          nuevoContacto.id,
          data.rol,
          data.notas_mandato || undefined
        );
        toast.success("Contacto añadido al mandato exitosamente");
      } else {
        toast.success("Contacto creado exitosamente");
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creando contacto:", error);
      
      // Detectar error de email duplicado
      if (error?.metadata?.isDuplicate && error?.metadata?.duplicateField === 'email') {
        toast.error("Ya existe un contacto con este email");
        form.setError('email', { 
          type: 'manual', 
          message: 'Este email ya está registrado' 
        });
      } else if (error?.metadata?.supabaseError?.code === '23505') {
        toast.error("Ya existe un contacto con este email");
      } else {
        toast.error("Error al crear el contacto");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Crear Nuevo Contacto</DrawerTitle>
            <DrawerDescription>
              Crea un nuevo contacto en el sistema
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apellidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input placeholder="García López" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="juan.garcia@empresa.com"
                            {...field}
                          />
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
                          <Input placeholder="+34 600 123 456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Director General" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="empresa_principal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa Principal</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingEmpresas}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background">
                            <SelectItem value="">Sin empresa</SelectItem>
                            {empresas.map((empresa) => (
                              <SelectItem key={empresa.id} value={empresa.id}>
                                {empresa.nombre}
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
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.linkedin.com/in/usuario"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre el contacto..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mandatoId && (
                  <>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-4">Relación con el mandato</h4>
                      
                      <FormField
                        control={form.control}
                        name="rol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rol en el mandato *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background">
                                <SelectItem value="vendedor">Vendedor</SelectItem>
                                <SelectItem value="comprador">Comprador</SelectItem>
                                <SelectItem value="asesor">Asesor</SelectItem>
                                <SelectItem value="intermediario">Intermediario</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notas_mandato"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Notas sobre su rol</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Información específica sobre su participación en este mandato..."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear Contacto
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
