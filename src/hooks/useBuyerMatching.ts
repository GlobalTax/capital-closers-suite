import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BuyerMatch {
  id: string;
  mandato_id: string;
  buyer_id: string;
  match_score: number;
  match_reasoning: string | null;
  fit_dimensions: {
    sector_fit: number;
    financial_fit: number;
    geographic_fit: number;
    strategic_fit: number;
  };
  risk_factors: string[];
  recommended_approach: string | null;
  status: string;
  dismissed_reason: string | null;
  generated_at: string | null;
  created_at: string | null;
  buyer: {
    id: string;
    name: string;
    buyer_type: string | null;
    description: string | null;
    country: string | null;
  } | null;
}

export function useBuyerMatches(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ["buyer-matches", mandatoId],
    queryFn: async () => {
      if (!mandatoId) return [];
      const { data, error } = await supabase
        .from("buyer_matches")
        .select(`
          *,
          buyer:corporate_buyers!buyer_matches_buyer_id_fkey (
            id, name, buyer_type, description, country
          )
        `)
        .eq("mandato_id", mandatoId)
        .order("match_score", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BuyerMatch[];
    },
    enabled: !!mandatoId,
  });
}

export function useGenerateBuyerMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandatoId: string) => {
      const { data, error } = await supabase.functions.invoke("match-buyers", {
        body: { mandato_id: mandatoId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, mandatoId) => {
      queryClient.invalidateQueries({ queryKey: ["buyer-matches", mandatoId] });
      toast.success(`Matching completado: ${data.matches} compradores compatibles encontrados`);
    },
    onError: (error: any) => {
      const msg = error?.message || "Error al generar matching";
      if (msg.includes("429") || msg.includes("Límite")) {
        toast.error("Límite de peticiones IA excedido. Inténtalo en unos minutos.");
      } else if (msg.includes("402") || msg.includes("Créditos")) {
        toast.error("Créditos IA agotados. Añade créditos en tu workspace.");
      } else {
        toast.error(msg);
      }
    },
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      status,
      dismissedReason,
    }: {
      matchId: string;
      status: string;
      dismissedReason?: string;
    }) => {
      const update: any = { status };
      if (dismissedReason) update.dismissed_reason = dismissedReason;

      const { error } = await supabase
        .from("buyer_matches")
        .update(update)
        .eq("id", matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-matches"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar estado");
    },
  });
}
