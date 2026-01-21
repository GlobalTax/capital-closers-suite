import { useState, useRef, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  Users, 
  Lock, 
  Share2, 
  Sparkles, 
  Edit3,
  Send,
  Lightbulb,
  Check,
  X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createTarea } from "@/services/tareas.service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTaskAI } from "@/hooks/useTaskAI";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import type { TareaEstado, TareaPrioridad, TareaTipo } from "@/types";
import type { ParsedTask } from "@/types/taskAI";

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

const EXAMPLE_PROMPTS = [
  "Preparar teaser de Empresa ABC para la semana que viene",
  "Revisar contrato y coordinar con el cliente",
  "Llamar a Juan para cerrar los términos del LOI",
];

export function NuevaTareaDrawer({ open, onOpenChange, onSuccess }: NuevaTareaDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [aiInput, setAiInput] = useState("");
  const [localTasks, setLocalTasks] = useState<ParsedTask[]>([]);
  const [sourceText, setSourceText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    parseInput,
    createTasks,
    parsedTasks,
    reasoning,
    isParsing,
    isCreating,
    error: aiError,
    reset: resetAI,
  } = useTaskAI();

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

  // Available users for TaskPreviewCard
  const availableUsers = usuarios.map(u => ({ 
    id: u.user_id, 
    name: u.full_name || 'Sin nombre' 
  }));

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Sync parsed tasks to local state
  useEffect(() => {
    if (parsedTasks.length > 0) {
      setLocalTasks(parsedTasks);
    }
  }, [parsedTasks]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setAiInput("");
      setLocalTasks([]);
      setSourceText("");
      resetAI();
    }
  }, [open, resetAI]);

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

  // Manual form submission
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

  // AI handlers
  const handleAIParse = async () => {
    if (!aiInput.trim() || isParsing) return;
    setSourceText(aiInput);
    await parseInput(aiInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAIParse();
    }
  };

  const handleCreateFromAI = async () => {
    if (localTasks.length === 0) return;
    
    const success = await createTasks(localTasks, sourceText);
    if (success) {
      setAiInput("");
      setLocalTasks([]);
      setSourceText("");
      resetAI();
      onOpenChange(false);
      onSuccess();
    }
  };

  const handleRemoveTask = (index: number) => {
    setLocalTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTask = (index: number, updatedTask: ParsedTask) => {
    setLocalTasks(prev => prev.map((t, i) => i === index ? updatedTask : t));
  };

  const handleCancelAI = () => {
    setAiInput("");
    setLocalTasks([]);
    setSourceText("");
    resetAI();
  };

  const handleExampleClick = (example: string) => {
    setAiInput(example);
    textareaRef.current?.focus();
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

          <div className="p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'ai' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Con IA
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4 mt-0">
                {/* Input Area */}
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Describe la tarea... 'Preparar teaser empresa X para la semana que viene'"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[80px] pr-12 resize-none"
                    disabled={isParsing}
                  />
                  <Button
                    size="icon"
                    className="absolute right-2 bottom-2 h-8 w-8"
                    onClick={handleAIParse}
                    disabled={!aiInput.trim() || isParsing}
                  >
                    {isParsing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Example Prompts */}
                {localTasks.length === 0 && !isParsing && (
                  <div className="flex flex-wrap gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    {EXAMPLE_PROMPTS.map((example, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted transition-colors text-xs"
                        onClick={() => handleExampleClick(example)}
                      >
                        {example.length > 35 ? example.slice(0, 35) + "..." : example}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {aiError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {aiError}
                  </div>
                )}

                {/* Loading State */}
                {isParsing && (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Analizando con IA...</span>
                  </div>
                )}

                {/* Parsed Tasks Preview */}
                {localTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {localTasks.length} tarea{localTasks.length > 1 ? 's' : ''} generada{localTasks.length > 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Haz clic en cualquier campo para editarlo
                        </span>
                      </div>
                    </div>

                    {/* Reasoning */}
                    {reasoning && (
                      <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
                        💡 {reasoning}
                      </p>
                    )}

                    {/* Task Cards */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {localTasks.map((task, index) => (
                        <TaskPreviewCard
                          key={index}
                          task={task}
                          index={index}
                          editable={true}
                          availableUsers={availableUsers}
                          onRemove={() => handleRemoveTask(index)}
                          onUpdate={(updatedTask) => handleUpdateTask(index, updatedTask)}
                        />
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        onClick={handleCancelAI}
                        disabled={isCreating}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateFromAI}
                        disabled={isCreating || localTasks.length === 0}
                        className="flex-1"
                      >
                        {isCreating ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Crear {localTasks.length} tarea{localTasks.length > 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty state with CTA */}
                {localTasks.length === 0 && !isParsing && !aiError && (
                  <Card className="p-4 bg-muted/30 border-dashed">
                    <div className="text-center text-sm text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                      <p>Escribe en lenguaje natural lo que necesitas hacer</p>
                      <p className="text-xs mt-1">La IA extraerá título, prioridad, fecha y responsable</p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Manual Tab */}
              <TabsContent value="manual" className="mt-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <div className={cn(
                      "space-y-4 rounded-lg border p-4",
                      form.watch('tipo') === 'grupal' 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-muted/30"
                    )}>
                      <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                {field.value === 'grupal' ? (
                                  <Users className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                                Tarea {field.value === 'grupal' ? 'Grupal' : 'Individual'}
                              </FormLabel>
                              <FormDescription className={field.value === 'grupal' ? "text-amber-600 font-medium" : ""}>
                                {field.value === 'grupal' 
                                  ? '⚠️ Todos los miembros del equipo podrán ver esta tarea' 
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
