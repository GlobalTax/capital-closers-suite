import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2, Users, Lock, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createTarea } from "@/services/tareas.service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TareaEstado, TareaPrioridad, TareaTipo } from "@/types";

const formSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  mandatoId: z.string().optional(),
  asignado_a: z.string().optional(),
  fechaVencimiento: z.date().optional().nullable(),
  estado: z.enum(["pendiente", "en_progreso", "completada"] as const),
  prioridad: z.enum(["alta", "media", "baja", "urgente"] as const),
  etiquetas: z.string().optional(),
  tipo: z.enum(["individual", "grupal"] as const),
  compartido_con: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevaTareaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NuevaTareaDrawer({ open, onOpenChange, onSuccess }: NuevaTareaDrawerProps) {
  const [loading, setLoading] = useState(false);

  // Fetch active users from admin_users
  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ['admin-users-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      mandatoId: "",
      asignado_a: "",
      fechaVencimiento: null,
      estado: "pendiente",
      prioridad: "media",
      etiquetas: "",
      tipo: "individual",
      compartido_con: [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await createTarea({
        titulo: values.titulo,
        descripcion: values.descripcion,
        mandato_id: values.mandatoId || null,
        asignado_a: values.asignado_a || null,
        fecha_vencimiento: values.fechaVencimiento 
          ? format(values.fechaVencimiento, "yyyy-MM-dd") 
          : null,
        estado: values.estado as TareaEstado,
        prioridad: values.prioridad as TareaPrioridad,
        order_index: 0,
        tipo: values.tipo as TareaTipo,
        creado_por: currentUser?.id,
        compartido_con: values.compartido_con || [],
      } as any);

      toast.success("Tarea creada exitosamente");
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creando tarea:", error);
      toast.error("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Nueva Tarea</DrawerTitle>
            <DrawerDescription>
              Crea una nueva tarea para el equipo
            </DrawerDescription>
          </DrawerHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título de la tarea" {...field} />
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
                        placeholder="Descripción detallada de la tarea"
                        rows={3}
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
                  name="asignado_a"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar responsable" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingUsuarios ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : usuarios.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No hay usuarios disponibles
                            </div>
                          ) : (
                            usuarios.map((user) => (
                              <SelectItem key={user.user_id} value={user.user_id}>
                                {user.full_name || 'Usuario sin nombre'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Seleccionar fecha"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
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
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="urgente">Urgente</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo de tarea y visibilidad */}
              <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          {field.value === 'grupal' ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                          Tarea {field.value === 'grupal' ? 'Grupal' : 'Individual'}
                        </FormLabel>
                        <FormDescription>
                          {field.value === 'grupal' 
                            ? 'Visible para todo el equipo' 
                            : 'Solo tú y los usuarios compartidos podrán verla'}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'grupal'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'grupal' : 'individual')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Compartir con - solo para tareas individuales */}
                {form.watch('tipo') === 'individual' && (
                  <FormField
                    control={form.control}
                    name="compartido_con"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          Compartir con
                        </FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {usuarios
                            .filter(u => u.user_id !== currentUser?.id)
                            .map((user) => (
                              <div key={user.user_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={user.user_id}
                                  checked={field.value?.includes(user.user_id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, user.user_id]);
                                    } else {
                                      field.onChange(current.filter(id => id !== user.user_id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={user.user_id}
                                  className="text-sm cursor-pointer"
                                >
                                  {user.full_name || 'Usuario'}
                                </label>
                              </div>
                            ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="etiquetas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiquetas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Separadas por comas (ej: urgente, cliente)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "Crear Tarea"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}