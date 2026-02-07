import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScoringResult {
  probability: number;
  previous_probability: number | null;
  confidence: number;
  reasoning: string;
  risk_factors: string[];
  positive_signals: string[];
  recommendations: string[];
}

interface ScoringHistoryEntry {
  id: string;
  mandato_id: string;
  previous_probability: number | null;
  new_probability: number;
  ai_confidence: number;
  reasoning: string;
  risk_factors: string[];
  positive_signals: string[];
  recommendations: string[];
  signals_snapshot: Record<string, unknown>;
  scored_by: string | null;
  created_at: string;
}

export function useMandatoScoringHistory(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ["mandato-scoring-history", mandatoId],
    queryFn: async () => {
      if (!mandatoId) return [];
      const { data, error } = await supabase
        .from("mandato_scoring_history" as any)
        .select("*")
        .eq("mandato_id", mandatoId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as ScoringHistoryEntry[];
    },
    enabled: !!mandatoId,
  });
}

export function useScoreMandato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandatoId: string): Promise<ScoringResult> => {
      const { data, error } = await supabase.functions.invoke("score-mandato", {
        body: { mandato_id: mandatoId },
      });

      if (error) {
        // Check for rate limit / payment errors
        const message = (error as any)?.message || "";
        if (message.includes("429") || message.includes("rate")) {
          throw new Error("Límite de peticiones excedido. Intenta de nuevo en unos minutos.");
        }
        if (message.includes("402") || message.includes("payment")) {
          throw new Error("Créditos de IA agotados. Contacta al administrador.");
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as ScoringResult;
    },
    onSuccess: (_data, mandatoId) => {
      queryClient.invalidateQueries({ queryKey: ["mandato-scoring-history", mandatoId] });
      queryClient.invalidateQueries({ queryKey: ["mandato"] });
      queryClient.invalidateQueries({ queryKey: ["mandatos"] });
      toast.success("Scoring IA actualizado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al calcular scoring");
    },
  });
}
