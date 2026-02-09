import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BuyerOutreachRecord {
  id: string;
  match_id: string;
  buyer_id: string;
  mandato_id: string;
  channel: string;
  outreach_type: string;
  subject: string | null;
  message_preview: string | null;
  sent_at: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateBuyerOutreachParams {
  match_id: string;
  buyer_id: string;
  mandato_id: string;
  channel: string;
  outreach_type: string;
  subject?: string;
  message_preview?: string;
  sent_at?: string;
  status?: string;
  notes?: string;
}

export function useBuyerOutreach(matchId: string | undefined) {
  return useQuery({
    queryKey: ["buyer-outreach", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from("buyer_outreach")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BuyerOutreachRecord[];
    },
    enabled: !!matchId,
  });
}

export function useCreateBuyerOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateBuyerOutreachParams) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("buyer_outreach")
        .insert({
          match_id: params.match_id,
          buyer_id: params.buyer_id,
          mandato_id: params.mandato_id,
          channel: params.channel,
          outreach_type: params.outreach_type,
          subject: params.subject || null,
          message_preview: params.message_preview || null,
          sent_at: params.sent_at || new Date().toISOString(),
          status: params.status || "sent",
          notes: params.notes || null,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["buyer-outreach", variables.match_id] });
      queryClient.invalidateQueries({ queryKey: ["buyer-matches"] });
      const labels: Record<string, string> = {
        contacto: "Contacto registrado",
        teaser: "Teaser enviado",
        nda: "NDA enviado",
        followup: "Seguimiento registrado",
      };
      toast.success(labels[variables.outreach_type] || "Outreach registrado");
    },
    onError: () => {
      toast.error("Error al registrar outreach");
    },
  });
}
