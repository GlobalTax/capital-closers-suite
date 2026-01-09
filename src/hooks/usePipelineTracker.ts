import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { PipelineTrackerItem, MandatoDocTracking } from "@/types/pipeline-tracker";

export function usePipelineTracker(filter?: string) {
  return useQuery({
    queryKey: ['pipeline-tracker', filter],
    queryFn: async (): Promise<PipelineTrackerItem[]> => {
      let query = supabase
        .from('mandatos')
        .select(`
          id,
          codigo,
          nombre_proyecto,
          empresa_principal_id,
          pipeline_stage,
          estado,
          tipo,
          categoria,
          doc_valoracion,
          doc_teaser,
          doc_datapack,
          doc_im,
          doc_rod,
          platform_deale,
          platform_dealsuite,
          platform_arx,
          ccaa_fecha,
          ccaa_disponible,
          empresas:empresa_principal_id (nombre)
        `)
        .eq('categoria', 'operacion_ma')
        .in('estado', ['prospecto', 'activo', 'en_negociacion'])
        .order('codigo', { ascending: false });

      if (filter && filter !== 'all') {
        // Map filter to pipeline_stage
        const stageMap: Record<string, string[]> = {
          'incoming': ['prospeccion'],
          'go_to_market': ['loi', 'propuesta_enviada'],
          'dd_spa': ['due_diligence', 'negociacion'],
          'psh': ['prospeccion'], // PSH is typically valoracion category but we're filtering M&A
        };
        
        if (stageMap[filter]) {
          query = query.in('pipeline_stage', stageMap[filter]);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map to PipelineTrackerItem with proper typing
      return (data || []).map((item): PipelineTrackerItem => ({
        id: item.id,
        codigo: item.codigo,
        nombre_proyecto: item.nombre_proyecto,
        empresa_principal_id: item.empresa_principal_id,
        pipeline_stage: item.pipeline_stage,
        estado: item.estado,
        tipo: item.tipo,
        categoria: item.categoria,
        doc_valoracion: item.doc_valoracion as PipelineTrackerItem['doc_valoracion'],
        doc_teaser: item.doc_teaser as PipelineTrackerItem['doc_teaser'],
        doc_datapack: item.doc_datapack as PipelineTrackerItem['doc_datapack'],
        doc_im: item.doc_im as PipelineTrackerItem['doc_im'],
        doc_rod: item.doc_rod as PipelineTrackerItem['doc_rod'],
        platform_deale: item.platform_deale as PipelineTrackerItem['platform_deale'],
        platform_dealsuite: item.platform_dealsuite as PipelineTrackerItem['platform_dealsuite'],
        platform_arx: item.platform_arx as PipelineTrackerItem['platform_arx'],
        ccaa_fecha: item.ccaa_fecha,
        ccaa_disponible: item.ccaa_disponible,
        empresa_nombre: (item.empresas as { nombre?: string } | null)?.nombre || null,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpdateDocStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mandatoId, 
      field, 
      value 
    }: { 
      mandatoId: string; 
      field: keyof MandatoDocTracking; 
      value: string | boolean | null;
    }) => {
      const { error } = await supabase
        .from('mandatos')
        .update({ [field]: value })
        .eq('id', mandatoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-tracker'] });
      toast({
        title: "Actualizado",
        description: "Estado actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });
}

export function useBulkUpdateDocStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mandatoIds, 
      field, 
      value 
    }: { 
      mandatoIds: string[]; 
      field: keyof MandatoDocTracking; 
      value: string | boolean | null;
    }) => {
      const { error } = await supabase
        .from('mandatos')
        .update({ [field]: value })
        .in('id', mandatoIds);

      if (error) throw error;
    },
    onSuccess: (_, { mandatoIds }) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-tracker'] });
      toast({
        title: "Actualizado",
        description: `${mandatoIds.length} mandatos actualizados`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los mandatos",
        variant: "destructive",
      });
      console.error('Bulk update error:', error);
    },
  });
}
