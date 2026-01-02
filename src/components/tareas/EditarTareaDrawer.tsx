import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { updateTarea, deleteTarea } from "@/services/tareas.service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tarea, TareaEstado, TareaPrioridad } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  asignado_a: z.string().optional(),
  fechaVencimiento: z.date().optional().nullable(),
  estado: z.enum(["pendiente", "en_progreso", "completada"] as const),
  prioridad: z.enum(["alta", "media", "baja", "urgente"] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface EditarTareaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: Tarea | null;
  onSuccess: () => void;
}

export function EditarTareaDrawer({ open, onOpenChange, tarea, onSuccess }: EditarTareaDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      asignado_a: "",
      fechaVencimiento: null,
      estado: "pendiente",
      prioridad: "media",
    },
  });

  // Update form when tarea changes
  useEffect(() => {
    if (tarea) {
      form.reset({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || "",
        asignado_a: tarea.asignado_a || "",
        fechaVencimiento: tarea.fecha_vencimiento 
          ? parseISO(tarea.fecha_vencimiento) 
          : null,
        estado: tarea.estado as "pendiente" | "en_progreso" | "completada",
        prioridad: tarea.prioridad as "alta" | "media" | "baja" | "urgente",
      });
    }
  }, [tarea, form]);

  const onSubmit = async (values: FormValues) => {
    if (!tarea) return;
    
    setLoading(true);
    try {
      await updateTarea(tarea.id, {
        titulo: values.titulo,
        descripcion: values.descripcion || null,
        asignado_a: values.asignado_a || null,
        fecha_vencimiento: values.fechaVencimiento 
          ? format(values.fechaVencimiento, "yyyy-MM-dd") 
          : null,
        estado: values.estado as TareaEstado,
        prioridad: values.prioridad as TareaPrioridad,
      });

      toast.success("Tarea actualizada exitosamente");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      toast.error("Error al actualizar la tarea");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tarea) return;
    
    setDeleting(true);
    try {
      await deleteTarea(tarea.id);
      toast.success("Tarea eliminada exitosamente");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      toast.error("Error al eliminar la tarea");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>Editar Tarea</DrawerTitle>
                <DrawerDescription>
                  Modifica los detalles de la tarea
                </DrawerDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}