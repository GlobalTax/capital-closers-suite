import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TVColumnConfig {
  id: string;
  fase_tipo: 'lead' | 'mandato';
  fase_id: string;
  columna_tv: string;
  color: 'slate' | 'zinc' | 'neutral' | 'stone' | 'gray' | 'emerald';
  icono: string;
  orden: number;
  activo: boolean;
}

export function useTVDashboardConfig() {
  const queryClient = useQueryClient();

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['tv-dashboard-config'],
    queryFn: async (): Promise<TVColumnConfig[]> => {
      const { data, error } = await supabase
        .from('tv_dashboard_fase_mapping')
        .select('*')
        .eq('activo', true)
        .order('orden');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        fase_tipo: item.fase_tipo as 'lead' | 'mandato',
        color: item.color as TVColumnConfig['color']
      }));
    }
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TVColumnConfig> }) => {
      const { error } = await supabase
        .from('tv_dashboard_fase_mapping')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-dashboard-config'] });
      toast({ title: "Columna actualizada correctamente" });
    },
    onError: () => {
      toast({ 
        title: "Error al actualizar columna", 
        variant: "destructive" 
      });
    }
  });

  const reorderColumns = useMutation({
    mutationFn: async (reorderedColumns: { id: string; orden: number }[]) => {
      const updates = reorderedColumns.map(col => 
        supabase
          .from('tv_dashboard_fase_mapping')
          .update({ orden: col.orden })
          .eq('id', col.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-dashboard-config'] });
      toast({ title: "Orden actualizado correctamente" });
    },
    onError: () => {
      toast({ 
        title: "Error al reordenar columnas", 
        variant: "destructive" 
      });
    }
  });

  const toggleColumn = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from('tv_dashboard_fase_mapping')
        .update({ activo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-dashboard-config'] });
      toast({ title: "Visibilidad actualizada" });
    },
    onError: () => {
      toast({ 
        title: "Error al cambiar visibilidad", 
        variant: "destructive" 
      });
    }
  });

  const createColumn = useMutation({
    mutationFn: async (config: Omit<TVColumnConfig, 'id'>) => {
      const { error } = await supabase
        .from('tv_dashboard_fase_mapping')
        .insert(config);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-dashboard-config'] });
      toast({ title: "Columna creada correctamente" });
    },
    onError: () => {
      toast({ 
        title: "Error al crear columna", 
        variant: "destructive" 
      });
    }
  });

  return {
    columns,
    isLoading,
    updateColumn,
    reorderColumns,
    toggleColumn,
    createColumn
  };
}
