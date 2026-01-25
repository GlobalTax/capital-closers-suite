import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HelpSection, HelpSectionVersion, HelpSectionInput } from '@/types/help';
import { toast } from 'sonner';

export function useHelpEditor() {
  const queryClient = useQueryClient();
  
  // Get all sections (including unpublished) for admin editing
  const { data: allSections, isLoading } = useQuery({
    queryKey: ['help-sections-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_sections')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as HelpSection[];
    },
  });

  // Mutation: Update section
  const updateSection = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HelpSectionInput> }) => {
      const { error } = await supabase
        .from('help_sections')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-sections'] });
      queryClient.invalidateQueries({ queryKey: ['help-sections-admin'] });
      queryClient.invalidateQueries({ queryKey: ['help-section'] });
      toast.success('Sección actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
  
  // Mutation: Create section
  const createSection = useMutation({
    mutationFn: async (data: HelpSectionInput) => {
      const { data: result, error } = await supabase
        .from('help_sections')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result as HelpSection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-sections'] });
      queryClient.invalidateQueries({ queryKey: ['help-sections-admin'] });
      toast.success('Sección creada');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear: ${error.message}`);
    },
  });
  
  // Mutation: Delete section
  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-sections'] });
      queryClient.invalidateQueries({ queryKey: ['help-sections-admin'] });
      toast.success('Sección eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
  
  // Mutation: Reorder sections
  const reorderSections = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index,
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from('help_sections')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-sections'] });
      queryClient.invalidateQueries({ queryKey: ['help-sections-admin'] });
      toast.success('Orden actualizado');
    },
  });

  return {
    allSections,
    isLoading,
    updateSection,
    createSection,
    deleteSection,
    reorderSections,
  };
}

// Hook for versions
export function useHelpVersions(sectionId: string) {
  return useQuery({
    queryKey: ['help-versions', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_section_versions')
        .select('*')
        .eq('section_id', sectionId)
        .order('version_number', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as HelpSectionVersion[];
    },
    enabled: !!sectionId,
  });
}
