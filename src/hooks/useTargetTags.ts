import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as targetTagsService from "@/services/targetTags.service";
import type { BuyerType } from "@/types";

export function useTargetTags(mandatoId: string | undefined) {
  const queryClient = useQueryClient();

  // Obtener tags distintos del mandato
  const { data: distinctTags = [] } = useQuery({
    queryKey: ["target-tags", mandatoId],
    queryFn: () => targetTagsService.getDistinctTags(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const invalidateTargets = () => {
    queryClient.invalidateQueries({ queryKey: ["targets-buyside", mandatoId] });
    queryClient.invalidateQueries({ queryKey: ["target-tags", mandatoId] });
  };

  // Mutación para actualizar tipo de comprador
  const updateBuyerType = useMutation({
    mutationFn: ({ targetId, buyerType }: { targetId: string; buyerType: BuyerType | null }) =>
      targetTagsService.updateBuyerType(targetId, buyerType),
    onSuccess: () => {
      toast.success("Tipo de comprador actualizado");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar tipo", { description: error.message });
    },
  });

  // Mutación para actualizar geografía
  const updateGeografia = useMutation({
    mutationFn: ({ targetId, geografia }: { targetId: string; geografia: string }) =>
      targetTagsService.updateGeografia(targetId, geografia),
    onSuccess: () => {
      toast.success("Geografía actualizada");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar geografía", { description: error.message });
    },
  });

  // Mutación para añadir tag
  const addTag = useMutation({
    mutationFn: ({ targetId, tag }: { targetId: string; tag: string }) =>
      targetTagsService.addTag(targetId, tag),
    onSuccess: () => {
      toast.success("Tag añadido");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al añadir tag", { description: error.message });
    },
  });

  // Mutación para eliminar tag
  const removeTag = useMutation({
    mutationFn: ({ targetId, tag }: { targetId: string; tag: string }) =>
      targetTagsService.removeTag(targetId, tag),
    onSuccess: () => {
      toast.success("Tag eliminado");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al eliminar tag", { description: error.message });
    },
  });

  // Mutación para marcar como no contactar
  const setNoContactar = useMutation({
    mutationFn: ({ targetId, value, motivo }: { targetId: string; value: boolean; motivo?: string }) =>
      targetTagsService.setNoContactar(targetId, value, motivo),
    onSuccess: (_, { value }) => {
      toast.success(value ? "Marcado como no contactar" : "Desmarcado no contactar");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar", { description: error.message });
    },
  });

  // Mutación para marcar conflicto
  const setConflicto = useMutation({
    mutationFn: ({ targetId, value, descripcion }: { targetId: string; value: boolean; descripcion?: string }) =>
      targetTagsService.setConflicto(targetId, value, descripcion),
    onSuccess: (_, { value }) => {
      toast.success(value ? "Conflicto registrado" : "Conflicto eliminado");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar", { description: error.message });
    },
  });

  // Mutación para notas internas
  const updateNotasInternas = useMutation({
    mutationFn: ({ targetId, notas }: { targetId: string; notas: string }) =>
      targetTagsService.updateNotasInternas(targetId, notas),
    onSuccess: () => {
      toast.success("Notas actualizadas");
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error al guardar notas", { description: error.message });
    },
  });

  // Mutaciones masivas
  const bulkUpdateBuyerType = useMutation({
    mutationFn: ({ targetIds, buyerType }: { targetIds: string[]; buyerType: BuyerType }) =>
      targetTagsService.bulkUpdateBuyerType(targetIds, buyerType),
    onSuccess: (_, { targetIds }) => {
      toast.success(`Actualizados ${targetIds.length} targets`);
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error en actualización masiva", { description: error.message });
    },
  });

  const bulkAddTag = useMutation({
    mutationFn: ({ targetIds, tag }: { targetIds: string[]; tag: string }) =>
      targetTagsService.bulkAddTag(targetIds, tag),
    onSuccess: (_, { targetIds }) => {
      toast.success(`Tag añadido a ${targetIds.length} targets`);
      invalidateTargets();
    },
    onError: (error: Error) => {
      toast.error("Error en actualización masiva", { description: error.message });
    },
  });

  return {
    distinctTags,
    updateBuyerType,
    updateGeografia,
    addTag,
    removeTag,
    setNoContactar,
    setConflicto,
    updateNotasInternas,
    bulkUpdateBuyerType,
    bulkAddTag,
  };
}
