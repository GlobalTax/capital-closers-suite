import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllCampaigns,
  getCampaignsForMandato,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getWavesForCampaign,
  createWave,
  updateWave,
  deleteWave,
  getRecipientsForCampaign,
  getRecipientsForWave,
  addRecipients,
  removeRecipient,
  assignRecipientsToWave,
  scheduleCampaign,
  startWaveNow,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  sendTestEmail,
  type CreateCampaignData,
  type CreateWaveData,
  type AddRecipientData,
  type TeaserCampaign,
  type TeaserWave,
  type TeaserRecipient,
} from "@/services/teaserCampaign.service";

// =============================================
// CAMPAIGN HOOKS
// =============================================

export function useTeaserCampaigns(mandatoId?: string) {
  return useQuery({
    queryKey: ["teaser-campaigns", mandatoId],
    queryFn: () => mandatoId ? getCampaignsForMandato(mandatoId) : getAllCampaigns(),
  });
}

export function useTeaserCampaign(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["teaser-campaign", campaignId],
    queryFn: () => campaignId ? getCampaignById(campaignId) : null,
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignData) => createCampaign(data),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      toast.success("Campaña creada correctamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al crear campaña: ${error.message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TeaserCampaign> }) =>
      updateCampaign(id, updates),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-campaign", campaign.id] });
      toast.success("Campaña actualizada");
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar campaña: ${error.message}`);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => deleteCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      toast.success("Campaña eliminada");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar campaña: ${error.message}`);
    },
  });
}

// =============================================
// WAVE HOOKS
// =============================================

export function useTeaserWaves(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["teaser-waves", campaignId],
    queryFn: () => campaignId ? getWavesForCampaign(campaignId) : [],
    enabled: !!campaignId,
  });
}

export function useCreateWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWaveData) => createWave(data),
    onSuccess: (wave) => {
      queryClient.invalidateQueries({ queryKey: ["teaser-waves", wave.campaign_id] });
      toast.success("Oleada creada");
    },
    onError: (error: Error) => {
      toast.error(`Error al crear oleada: ${error.message}`);
    },
  });
}

export function useUpdateWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TeaserWave> }) =>
      updateWave(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      toast.success("Oleada actualizada");
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar oleada: ${error.message}`);
    },
  });
}

export function useDeleteWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (waveId: string) => deleteWave(waveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      toast.success("Oleada eliminada");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar oleada: ${error.message}`);
    },
  });
}

// =============================================
// RECIPIENT HOOKS
// =============================================

export function useTeaserRecipients(campaignId: string | undefined, waveId?: string) {
  return useQuery({
    queryKey: ["teaser-recipients", campaignId, waveId],
    queryFn: () => {
      if (!campaignId) return [];
      return waveId ? getRecipientsForWave(waveId) : getRecipientsForCampaign(campaignId);
    },
    enabled: !!campaignId,
  });
}

export function useAddRecipients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipients: AddRecipientData[]) => addRecipients(recipients),
    onSuccess: (recipients) => {
      if (recipients.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["teaser-recipients", recipients[0].campaign_id] });
        queryClient.invalidateQueries({ queryKey: ["teaser-waves", recipients[0].campaign_id] });
      }
      toast.success(`${recipients.length} destinatarios añadidos`);
    },
    onError: (error: Error) => {
      toast.error(`Error al añadir destinatarios: ${error.message}`);
    },
  });
}

export function useRemoveRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipientId: string) => removeRecipient(recipientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-recipients"] });
      toast.success("Destinatario eliminado");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar destinatario: ${error.message}`);
    },
  });
}

export function useAssignRecipientsToWave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipientIds, waveId }: { recipientIds: string[]; waveId: string }) =>
      assignRecipientsToWave(recipientIds, waveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-recipients"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      toast.success("Destinatarios asignados a oleada");
    },
    onError: (error: Error) => {
      toast.error(`Error al asignar destinatarios: ${error.message}`);
    },
  });
}

// =============================================
// CAMPAIGN ACTION HOOKS
// =============================================

export function useScheduleCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => scheduleCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      toast.success("Campaña programada correctamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al programar campaña: ${error.message}`);
    },
  });
}

export function useStartWaveNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (waveId: string) => startWaveNow(waveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-recipients"] });
      toast.success("Oleada iniciada");
    },
    onError: (error: Error) => {
      toast.error(`Error al iniciar oleada: ${error.message}`);
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => pauseCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      toast.success("Campaña pausada");
    },
    onError: (error: Error) => {
      toast.error(`Error al pausar campaña: ${error.message}`);
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => resumeCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["teaser-waves"] });
      toast.success("Campaña reanudada");
    },
    onError: (error: Error) => {
      toast.error(`Error al reanudar campaña: ${error.message}`);
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => cancelCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaser-campaigns"] });
      toast.success("Campaña cancelada");
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar campaña: ${error.message}`);
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: ({ recipientId, testEmail }: { recipientId: string; testEmail: string }) =>
      sendTestEmail(recipientId, testEmail),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Email de prueba enviado correctamente");
      } else {
        toast.error(`Error al enviar email de prueba: ${result.error}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar email de prueba: ${error.message}`);
    },
  });
}