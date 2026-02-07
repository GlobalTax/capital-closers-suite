import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useSummarizeMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      const { data, error } = await supabase.functions.invoke("summarize-meeting", {
        body: { meeting_id: meetingId },
      });

      if (error) {
        // Check for rate limit / payment errors
        const message = error.message || "";
        if (message.includes("429") || message.includes("rate")) {
          throw new Error("Límite de peticiones excedido. Inténtalo de nuevo en unos minutos.");
        }
        if (message.includes("402") || message.includes("payment") || message.includes("créditos")) {
          throw new Error("Créditos de IA agotados. Añade créditos en la configuración.");
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-meetings"] });
      toast({
        title: "Resumen generado",
        description: "El resumen de la reunión se ha generado correctamente con IA.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al generar resumen",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
