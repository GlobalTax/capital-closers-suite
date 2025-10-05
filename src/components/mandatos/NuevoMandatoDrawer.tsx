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
import { fetchContactos } from "@/services/contactos";
import { createMandato } from "@/services/mandatos";
import type { Contacto } from "@/types";
import { Loader2 } from "lucide-react";

const mandatoSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente"),
  tipo: z.enum(["compra", "venta"], {
    required_error: "Selecciona el tipo de mandato",
  }),
  empresa: z.string().min(2, "El nombre de la empresa es requerido"),
  valor: z.string().min(1, "El valor estimado es requerido"),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres"),
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
  const [clientes, setClientes] = useState<Contacto[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MandatoFormValues>({
    resolver: zodResolver(mandatoSchema),
    defaultValues: {
      clienteId: "",
      tipo: "venta",
      empresa: "",
      valor: "",
      descripcion: "",
    },
  });

  useEffect(() => {
    if (open) {
      cargarClientes();
    }
  }, [open]);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const data = await fetchContactos();
      setClientes(data);
    } catch (error) {
      console.error("Error cargando contactos:", error);
      toast.error("Error al cargar la lista de contactos");
    } finally {
      setLoadingClientes(false);
    }
  };

  const onSubmit = async (data: MandatoFormValues) => {
    setSubmitting(true);
    try {
      const contacto = clientes.find((c) => c.id === data.clienteId);
      
      await createMandato({
        tipo: data.tipo,
        descripcion: data.descripcion,
        estado: "activo",
        empresa_principal_id: data.clienteId,
        valor: data.valor ? Number(data.valor) : 0,
        prioridad: "media",
      });

      toast.success("Mandato creado exitosamente");
      form.reset();
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
            <DrawerTitle>Nuevo Mandato</DrawerTitle>
            <DrawerDescription>
              Crea un nuevo mandato de compra o venta para un cliente
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loadingClientes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background">
                          {clientes.map((contacto) => (
                            <SelectItem key={contacto.id} value={contacto.id}>
                              {contacto.nombre} {contacto.apellidos}
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
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Mandato</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="venta" id="venta" />
                            <label htmlFor="venta" className="cursor-pointer">
                              Venta
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="compra" id="compra" />
                            <label htmlFor="compra" className="cursor-pointer">
                              Compra
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: TechCorp Solutions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Estimado</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: €2.5M" {...field} />
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el mandato, objetivos y contexto..."
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
