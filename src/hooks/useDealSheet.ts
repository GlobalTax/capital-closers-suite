import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchDealSheet,
  upsertDealSheet,
  publishDealSheet,
  unpublishDealSheet,
} from "@/services/dealSheet.service";
import type { DealSheetFormData } from "@/types/dealSheet";

export function useDealSheet(mandatoId: string) {
  return useQuery({
    queryKey: ['deal-sheet', mandatoId],
    queryFn: () => fetchDealSheet(mandatoId),
    enabled: !!mandatoId,
  });
}

export function useSaveDealSheet(mandatoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: DealSheetFormData) => upsertDealSheet(mandatoId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-sheet', mandatoId] });
      toast.success('Deal Sheet guardado');
    },
    onError: (error) => {
      console.error('[DealSheet] Save error:', error);
      toast.error('Error al guardar el Deal Sheet');
    },
  });
}

export function usePublishDealSheet(mandatoId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (dealSheetId: string) => publishDealSheet(dealSheetId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-sheet', mandatoId] });
      toast.success('Deal Sheet publicado');
    },
    onError: (error) => {
      console.error('[DealSheet] Publish error:', error);
      toast.error('Error al publicar el Deal Sheet');
    },
  });
}

export function useUnpublishDealSheet(mandatoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealSheetId: string) => unpublishDealSheet(dealSheetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-sheet', mandatoId] });
      toast.success('Deal Sheet despublicado');
    },
    onError: (error) => {
      console.error('[DealSheet] Unpublish error:', error);
      toast.error('Error al despublicar el Deal Sheet');
    },
  });
}
