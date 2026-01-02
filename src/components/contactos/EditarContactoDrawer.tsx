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
import { updateContacto } from "@/services/contactos";
import type { Empresa, Contacto } from "@/types";
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
});

type ContactoFormValues = z.infer<typeof contactoSchema>;

interface EditarContactoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacto: Contacto;
  onSuccess?: () => void;
}

export function EditarContactoDrawer({
  open,
  onOpenChange,
  contacto,
  onSuccess,
}: EditarContactoDrawerProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      nombre: contacto.nombre,
      apellidos: contacto.apellidos || "",
      email: contacto.email,
      telefono: contacto.telefono || "",
      cargo: contacto.cargo || "",
      empresa_principal_id: contacto.empresa_principal_id || "",
      linkedin: contacto.linkedin || "",
      notas: contacto.notas || "",
    },
  });

  useEffect(() => {
    if (open) {
      cargarEmpresas();
      // Reset form with contacto data
      form.reset({
        nombre: contacto.nombre,
        apellidos: contacto.apellidos || "",
        email: contacto.email,
        telefono: contacto.telefono || "",
        cargo: contacto.cargo || "",
        empresa_principal_id: contacto.empresa_principal_id || "",
        linkedin: contacto.linkedin || "",
        notas: contacto.notas || "",
      });
    }
  }, [open, contacto]);

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
      await updateContacto(contacto.id, {
        nombre: data.nombre,
        apellidos: data.apellidos || undefined,
        email: data.email,
        telefono: data.telefono || undefined,
        cargo: data.cargo || undefined,
        empresa_principal_id: data.empresa_principal_id === '__none__' ? undefined : data.empresa_principal_id || undefined,
        linkedin: data.linkedin || undefined,
        notas: data.notas || undefined,
      });

      toast.success("Contacto actualizado exitosamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error actualizando contacto:", error);
      
      // Detectar error de email duplicado
      if (error?.metadata?.isDuplicate && error?.metadata?.duplicateField === 'email') {
        toast.error("Ya existe otro contacto con este email");
        form.setError('email', { 
          type: 'manual', 
          message: 'Este email ya está en uso por otro contacto' 
        });
      } else if (error?.metadata?.supabaseError?.code === '23505') {
        toast.error("Ya existe otro contacto con este email");
      } else {
        toast.error("Error al actualizar el contacto");
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
            <DrawerTitle>Editar Contacto</DrawerTitle>
            <DrawerDescription>
              Actualiza la información del contacto
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
                          value={field.value}
                          disabled={loadingEmpresas}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background">
                            <SelectItem value="__none__">Sin empresa</SelectItem>
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

                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar Cambios
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
