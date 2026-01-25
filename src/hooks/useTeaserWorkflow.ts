// ============================================
// TEASER WORKFLOW HOOKS
// React Query hooks para gestión de workflow de teasers
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  getTeaserVersionHistory,
  getPublishedTeaser,
  approveTeaserVersion,
  publishTeaserVersion,
  revertToVersion,
  deleteDraftTeaser,
} from "@/services/teaserWorkflow.service";
import type { IdiomaTeaser } from "@/types/documents";

/**
 * Hook para obtener historial de versiones de teaser
 */
export function useTeaserVersionHistory(mandatoId: string | undefined, idioma?: IdiomaTeaser) {
  return useQuery({
    queryKey: ['teaser-versions', mandatoId, idioma],
    queryFn: () => getTeaserVersionHistory(mandatoId!, idioma),
    enabled: !!mandatoId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook para obtener teaser publicado por idioma
 */
export function usePublishedTeaser(mandatoId: string | undefined, idioma: IdiomaTeaser) {
  return useQuery({
    queryKey: ['teaser-published', mandatoId, idioma],
    queryFn: () => getPublishedTeaser(mandatoId!, idioma),
    enabled: !!mandatoId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook para aprobar teaser
 */
export function useApproveTeaser(mandatoId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: (documentId: string) => 
      approveTeaserVersion(documentId, session?.user?.id || ''),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Teaser aprobado correctamente');
        queryClient.invalidateQueries({ queryKey: ['teaser-versions', mandatoId] });
        queryClient.invalidateQueries({ queryKey: ['teasers-language', mandatoId] });
      } else {
        toast.error(result.error || 'Error al aprobar teaser');
      }
    },
    onError: (error) => {
      console.error('[useTeaserWorkflow] Approve error:', error);
      toast.error('Error al aprobar el teaser');
    },
  });
}

/**
 * Hook para publicar teaser
 */
export function usePublishTeaser(mandatoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, idioma }: { documentId: string; idioma: IdiomaTeaser }) =>
      publishTeaserVersion(documentId, mandatoId, idioma),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Teaser publicado correctamente');
        queryClient.invalidateQueries({ queryKey: ['teaser-versions', mandatoId] });
        queryClient.invalidateQueries({ queryKey: ['teaser-published', mandatoId] });
        queryClient.invalidateQueries({ queryKey: ['teasers-language', mandatoId] });
      } else {
        toast.error(result.error || 'Error al publicar teaser');
      }
    },
    onError: (error) => {
      console.error('[useTeaserWorkflow] Publish error:', error);
      toast.error('Error al publicar el teaser');
    },
  });
}

/**
 * Hook para revertir a versión anterior
 */
export function useRevertTeaser(mandatoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, idioma }: { documentId: string; idioma: IdiomaTeaser }) =>
      revertToVersion(documentId, mandatoId, idioma),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Versión revertida correctamente');
        queryClient.invalidateQueries({ queryKey: ['teaser-versions', mandatoId] });
        queryClient.invalidateQueries({ queryKey: ['teaser-published', mandatoId] });
        queryClient.invalidateQueries({ queryKey: ['teasers-language', mandatoId] });
      } else {
        toast.error(result.error || 'Error al revertir versión');
      }
    },
    onError: (error) => {
      console.error('[useTeaserWorkflow] Revert error:', error);
      toast.error('Error al revertir la versión');
    },
  });
}

/**
 * Hook para eliminar borrador de teaser
 */
export function useDeleteDraftTeaser(mandatoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, storagePath }: { documentId: string; storagePath: string }) =>
      deleteDraftTeaser(documentId, storagePath),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Borrador eliminado');
        queryClient.invalidateQueries({ queryKey: ['teaser-versions', mandatoId] });
        queryClient.invalidateQueries({ queryKey: ['teasers-language', mandatoId] });
      } else {
        toast.error(result.error || 'Error al eliminar borrador');
      }
    },
    onError: (error) => {
      console.error('[useTeaserWorkflow] Delete error:', error);
      toast.error('Error al eliminar el borrador');
    },
  });
}
