import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KanbanFase {
  id: string;
  fase_id: string;
  label: string;
  color: string;
  orden: number;
  activo: boolean;
}

export function useKanbanConfig() {
  const queryClient = useQueryClient();

  // Fetch configuración
  const { data: fases, isLoading } = useQuery({
    queryKey: ["kanban-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mandato_kanban_config")
        .select("*")
        .eq("activo", true)
        .order("orden");
      
      if (error) {
        console.error('[KanbanConfig] Error:', error);
        throw error;
      }
      return data as KanbanFase[];
    },
  });

  // Actualizar fase
  const updateFase = useMutation({
    mutationFn: async (fase: Partial<KanbanFase> & { id: string }) => {
      const { error } = await supabase
        .from("mandato_kanban_config")
        .update(fase)
        .eq("id", fase.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-config"] });
      toast.success("Configuración actualizada");
    },
    onError: (error) => {
      toast.error("Error al actualizar la configuración");
      console.error(error);
    },
  });

  // Crear nueva fase
  const createFase = useMutation({
    mutationFn: async (fase: Omit<KanbanFase, "id">) => {
      const { error } = await supabase
        .from("mandato_kanban_config")
        .insert(fase);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-config"] });
      toast.success("Fase creada");
    },
    onError: (error) => {
      toast.error("Error al crear la fase");
      console.error(error);
    },
  });

  // Reordenar fases
  const reorderFases = useMutation({
    mutationFn: async (newOrder: { id: string; orden: number }[]) => {
      const { error } = await supabase.rpc("update_kanban_order", {
        updates: newOrder,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-config"] });
      toast.success("Orden actualizado");
    },
    onError: (error) => {
      toast.error("Error al reordenar las fases");
      console.error(error);
    },
  });

  // Alternar activación
  const toggleFase = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from("mandato_kanban_config")
        .update({ activo })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-config"] });
      toast.success("Configuración actualizada");
    },
    onError: (error) => {
      toast.error("Error al actualizar la fase");
      console.error(error);
    },
  });

  return {
    fases: fases || [],
    isLoading,
    updateFase,
    createFase,
    reorderFases,
    toggleFase,
  };
}
