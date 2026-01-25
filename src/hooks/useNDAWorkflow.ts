// ============================================
// NDA WORKFLOW HOOK
// React Query hooks para gestión de NDA
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type NDARecipient,
  type NDAStats,
  type NDAStatus,
  sendNDA,
  sendBulkNDA,
  markNDAAsSigned,
  grantCIMAccess,
  revokeCIMAccess,
  getNDAActivityLog,
  calculateNDAStats,
  isEligibleForNDA,
} from "@/services/ndaWorkflow.service";

export function useNDAWorkflow(campaignId: string) {
  const queryClient = useQueryClient();

  // Query recipients with NDA status
  const {
    data: recipients,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaign-recipients-nda", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teaser_recipients")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map database fields to NDARecipient interface
      return (data || []).map(row => ({
        id: row.id,
        email: row.email,
        nombre: row.nombre,
        empresa: null,
        company_name: null,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        status: row.status,
        nda_status: (row.nda_status || 'not_required') as NDAStatus,
        nda_sent_at: row.nda_sent_at,
        nda_signed_at: row.nda_signed_at,
        nda_language: row.nda_language as "ES" | "EN" | null,
        nda_document_id: row.nda_document_id,
        nda_sent_by: row.nda_sent_by,
        cim_access_granted: row.cim_access_granted || false,
        cim_access_granted_at: row.cim_access_granted_at,
        cim_access_granted_by: row.cim_access_granted_by,
      })) as NDARecipient[];
    },
    enabled: !!campaignId,
  });

  // Calculate stats
  const stats: NDAStats = recipients 
    ? calculateNDAStats(recipients) 
    : { total: 0, eligible: 0, pending: 0, sent: 0, signed: 0, cimAccessGranted: 0 };

  // Send NDA mutation
  const sendNDAMutation = useMutation({
    mutationFn: async ({ recipientId, language }: { recipientId: string; language: "ES" | "EN" }) => {
      const result = await sendNDA(recipientId, language);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("NDA enviado correctamente");
      queryClient.invalidateQueries({ queryKey: ["campaign-recipients-nda", campaignId] });
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar NDA: ${error.message}`);
    },
  });

  // Bulk send NDA mutation
  const sendBulkNDAMutation = useMutation({
    mutationFn: async ({ recipientIds, language }: { recipientIds: string[]; language: "ES" | "EN" }) => {
      return sendBulkNDA(recipientIds, language);
    },
    onSuccess: (result) => {
      if (result.success > 0) {
        toast.success(`${result.success} NDAs enviados correctamente`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} NDAs fallaron al enviar`);
      }
      queryClient.invalidateQueries({ queryKey: ["campaign-recipients-nda", campaignId] });
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar NDAs: ${error.message}`);
    },
  });

  // Mark as signed mutation
  const markSignedMutation = useMutation({
    mutationFn: async ({ recipientId, signedAt }: { recipientId: string; signedAt?: Date }) => {
      const result = await markNDAAsSigned(recipientId, signedAt);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("NDA marcado como firmado");
      queryClient.invalidateQueries({ queryKey: ["campaign-recipients-nda", campaignId] });
    },
    onError: (error: Error) => {
      toast.error(`Error al marcar NDA: ${error.message}`);
    },
  });

  // Grant CIM access mutation
  const grantCIMAccessMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const result = await grantCIMAccess(recipientId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Acceso CIM concedido");
      queryClient.invalidateQueries({ queryKey: ["campaign-recipients-nda", campaignId] });
    },
    onError: (error: Error) => {
      toast.error(`Error al conceder acceso: ${error.message}`);
    },
  });

  // Revoke CIM access mutation
  const revokeCIMAccessMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const result = await revokeCIMAccess(recipientId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Acceso CIM revocado");
      queryClient.invalidateQueries({ queryKey: ["campaign-recipients-nda", campaignId] });
    },
    onError: (error: Error) => {
      toast.error(`Error al revocar acceso: ${error.message}`);
    },
  });

  return {
    recipients,
    isLoading,
    error,
    stats,
    refetch,
    
    // Mutations
    sendNDA: sendNDAMutation.mutate,
    sendBulkNDA: sendBulkNDAMutation.mutate,
    markAsSigned: markSignedMutation.mutate,
    grantCIMAccess: grantCIMAccessMutation.mutate,
    revokeCIMAccess: revokeCIMAccessMutation.mutate,
    
    // Loading states
    isSendingNDA: sendNDAMutation.isPending,
    isSendingBulkNDA: sendBulkNDAMutation.isPending,
    isMarkingSigned: markSignedMutation.isPending,
    isGrantingAccess: grantCIMAccessMutation.isPending,
    isRevokingAccess: revokeCIMAccessMutation.isPending,
    
    // Helpers
    isEligibleForNDA,
  };
}

export function useNDAActivityLog(recipientId: string | null) {
  return useQuery({
    queryKey: ["nda-activity-log", recipientId],
    queryFn: () => getNDAActivityLog(recipientId!),
    enabled: !!recipientId,
  });
}
