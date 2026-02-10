import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getTargetsWithScoring, 
  getTargetPipelineStats, 
  moveTargetToFunnelStage,
  moveTargetToPipelineStage,
  upsertTargetScoring,
  updateMatchScore,
} from "@/services/targetScoring.service";
import { 
  createOferta, 
  updateOferta, 
  deleteOferta, 
  getOfertasByTarget,
  cambiarEstadoOferta,
} from "@/services/targetOfertas.service";
import { archiveTarget, archiveTargetsBulk, unarchiveTarget, unlinkTarget } from "@/services/targetArchive.service";
import type { 
  TargetFunnelStage, 
  TargetPipelineStage, 
  TargetScoring,
  OfertaTipo,
  OfertaEstado,
} from "@/types";
import { toast } from "@/hooks/use-toast";
import { handleError } from "@/lib/error-handler";

/**
 * Hook principal para gestionar el pipeline de targets Buy-Side
 */
export function useTargetPipeline(mandatoId: string | undefined) {
  const queryClient = useQueryClient();

  // Query: Targets con scoring y ofertas
  const targetsQuery = useQuery({
    queryKey: ['target-pipeline', mandatoId],
    queryFn: () => getTargetsWithScoring(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query: Estadísticas del pipeline
  const statsQuery = useQuery({
    queryKey: ['target-pipeline-stats', mandatoId],
    queryFn: () => getTargetPipelineStats(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 2 * 60 * 1000,
  });

  // Mutation: Mover a etapa del funnel
  const moveFunnelMutation = useMutation({
    mutationFn: ({ targetId, stage }: { targetId: string; stage: TargetFunnelStage }) =>
      moveTargetToFunnelStage(targetId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Target movido", description: "Etapa del funnel actualizada" });
    },
    onError: (error) => handleError(error, 'Mover target'),
  });

  // Mutation: Mover a etapa del pipeline
  const movePipelineMutation = useMutation({
    mutationFn: ({ targetId, stage }: { targetId: string; stage: TargetPipelineStage }) =>
      moveTargetToPipelineStage(targetId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Target movido", description: "Etapa del pipeline actualizada" });
    },
    onError: (error) => handleError(error, 'Mover target'),
  });

  // Mutation: Actualizar scoring
  const updateScoringMutation = useMutation({
    mutationFn: ({ targetId, scoring }: { targetId: string; scoring: Partial<TargetScoring> }) =>
      upsertTargetScoring(targetId, scoring),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      toast({ title: "Scoring actualizado" });
    },
    onError: (error) => handleError(error, 'Actualizar scoring'),
  });

  // Mutation: Actualizar match score
  const updateMatchMutation = useMutation({
    mutationFn: ({ targetId, score }: { targetId: string; score: number }) =>
      updateMatchScore(targetId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
    },
    onError: (error) => handleError(error, 'Actualizar match score'),
  });

  // Mutation: Crear oferta
  const createOfertaMutation = useMutation({
    mutationFn: ({ 
      targetId, 
      oferta 
    }: { 
      targetId: string; 
      oferta: { tipo: OfertaTipo; monto: number; condiciones?: string; fecha_expiracion?: string; notas?: string } 
    }) => createOferta(targetId, oferta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Oferta creada" });
    },
    onError: (error) => handleError(error, 'Crear oferta'),
  });

  // Mutation: Actualizar estado oferta
  const updateOfertaEstadoMutation = useMutation({
    mutationFn: ({ 
      ofertaId, 
      estado, 
      contraofertaMonto 
    }: { 
      ofertaId: string; 
      estado: OfertaEstado; 
      contraofertaMonto?: number 
    }) => cambiarEstadoOferta(ofertaId, estado, contraofertaMonto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      toast({ title: "Estado de oferta actualizado" });
    },
    onError: (error) => handleError(error, 'Actualizar oferta'),
  });

  // Mutation: Eliminar oferta
  const deleteOfertaMutation = useMutation({
    mutationFn: (ofertaId: string) => deleteOferta(ofertaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Oferta eliminada" });
    },
    onError: (error) => handleError(error, 'Eliminar oferta'),
  });

  // Mutation: Archivar target
  const archiveMutation = useMutation({
    mutationFn: (targetId: string) => archiveTarget(targetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Target archivado", description: "El target ha sido excluido de los KPIs activos" });
    },
    onError: (error) => handleError(error, 'Archivar target'),
  });

  // Mutation: Archivar múltiples targets
  const archiveBulkMutation = useMutation({
    mutationFn: (targetIds: string[]) => archiveTargetsBulk(targetIds),
    onSuccess: async (_data, targetIds) => {
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ 
        title: `${targetIds.length} target${targetIds.length > 1 ? 's' : ''} archivado${targetIds.length > 1 ? 's' : ''}`, 
        description: "Los targets han sido excluidos de los KPIs activos" 
      });
    },
    onError: (error) => handleError(error, 'Archivar targets'),
  });

  // Mutation: Restaurar target
  const unarchiveMutation = useMutation({
    mutationFn: (targetId: string) => unarchiveTarget(targetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Target restaurado", description: "El target vuelve a aparecer en los KPIs activos" });
    },
    onError: (error) => handleError(error, 'Restaurar target'),
  });

  // Mutation: Desvincular target (eliminar relación permanentemente)
  const unlinkMutation = useMutation({
    mutationFn: (targetId: string) => unlinkTarget(targetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
      await queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
      toast({ title: "Target desvinculado", description: "La relación con el mandato ha sido eliminada" });
    },
    onError: (error) => handleError(error, 'Desvincular target'),
  });

  return {
    // Data
    targets: targetsQuery.data || [],
    stats: statsQuery.data,
    isLoading: targetsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,

    // Actions
    moveToFunnel: moveFunnelMutation.mutate,
    moveToPipeline: movePipelineMutation.mutate,
    updateScoring: updateScoringMutation.mutate,
    updateMatch: updateMatchMutation.mutate,
    createOferta: createOfertaMutation.mutate,
    updateOfertaEstado: updateOfertaEstadoMutation.mutate,
    deleteOferta: deleteOfertaMutation.mutate,
    archiveTarget: archiveMutation.mutate,
    archiveTargetsBulk: archiveBulkMutation.mutate,
    unarchiveTarget: unarchiveMutation.mutate,
    unlinkTarget: unlinkMutation.mutate,

    // Loading states
    isMoving: moveFunnelMutation.isPending || movePipelineMutation.isPending,
    isSavingScoring: updateScoringMutation.isPending,
    isSavingOferta: createOfertaMutation.isPending || updateOfertaEstadoMutation.isPending,
    isArchiving: archiveMutation.isPending || unarchiveMutation.isPending,
    isArchivingBulk: archiveBulkMutation.isPending,
    isUnlinking: unlinkMutation.isPending,

    // Refetch
    refetch: () => {
      targetsQuery.refetch();
      statsQuery.refetch();
    },
  };
}
