import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlideOutlineItem } from "./useGenerateOutline";

export interface RefinedSlide {
  slide_index: number;
  slide_type: string;
  layout: "A" | "B" | "C";
  headline: string;
  subline?: string;
  bullets?: string[];
  stats?: Array<{ value: string; label: string }>;
  team_members?: Array<{ name: string; role: string }>;
  columns?: Array<{ title: string; content: string }>;
}

interface RefineParams {
  inputs_json: Record<string, unknown>;
  outline_json: SlideOutlineItem[];
}

interface RefineResponse {
  slides: RefinedSlide[];
  error?: string;
}

export function useRefineSlidesCopy() {
  return useMutation({
    mutationFn: async ({ inputs_json, outline_json }: RefineParams): Promise<RefinedSlide[]> => {
      const { data, error } = await supabase.functions.invoke<RefineResponse>("refine-slide-copy", {
        body: { inputs_json, outline_json },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to refine slides");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.slides || !Array.isArray(data.slides)) {
        throw new Error("Invalid response from AI");
      }

      return data.slides;
    },
    onError: (error: Error) => {
      console.error("Refine slides error:", error);
      if (error.message.includes("Rate limit")) {
        toast.error("Límite de velocidad excedido. Intenta de nuevo en un momento.");
      } else if (error.message.includes("credits")) {
        toast.error("Créditos de IA agotados. Añade fondos para continuar.");
      } else {
        toast.error("Error al refinar el contenido: " + error.message);
      }
    },
  });
}
