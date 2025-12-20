import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchPipelineStages, 
  fetchPipelineSummary, 
  fetchPipelineMandatos,
  updateMandatoPipelineStage,
  calculatePipelineMetrics 
} from "@/services/pipeline.service";
import { toast } from "sonner";

export const usePipelineStages = () => {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: fetchPipelineStages,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const usePipelineSummary = () => {
  return useQuery({
    queryKey: ['pipeline-summary'],
    queryFn: fetchPipelineSummary,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const usePipelineMandatos = (tipo?: 'compra' | 'venta') => {
  return useQuery({
    queryKey: ['pipeline-mandatos', tipo],
    queryFn: () => fetchPipelineMandatos(tipo),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePipelineMetrics = (tipo?: 'compra' | 'venta') => {
  return useQuery({
    queryKey: ['pipeline-metrics', tipo],
    queryFn: () => calculatePipelineMetrics(tipo),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdatePipelineStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      mandatoId, 
      newStage, 
      probability 
    }: { 
      mandatoId: string; 
      newStage: string; 
      probability?: number;
    }) => updateMandatoPipelineStage(mandatoId, newStage, probability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-mandatos'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      toast.success('Fase del deal actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar la fase');
      console.error('Error updating pipeline stage:', error);
    },
  });
};
