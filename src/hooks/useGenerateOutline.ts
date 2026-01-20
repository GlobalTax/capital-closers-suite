import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PresentationType, SlideLayout } from "@/types/presentations";

export interface SlideOutlineItem {
  slide_index: number;
  slide_type: string;
  layout: "A" | "B" | "C";
  purpose: string;
}

export interface GenerateOutlineParams {
  presentation_type: PresentationType;
  inputs_json: Record<string, unknown>;
}

// Map layout codes to SlideLayout
const LAYOUT_CODE_MAP: Record<"A" | "B" | "C", SlideLayout[]> = {
  A: ["title", "hero", "overview", "stats", "market", "closing"],
  B: ["bullets", "timeline", "team"],
  C: ["comparison", "financials"],
};

export function mapSlideTypeToLayout(slideType: string, layoutCode: "A" | "B" | "C"): SlideLayout {
  // If the slide_type is already a valid SlideLayout, use it
  const validLayouts: SlideLayout[] = [
    "title", "hero", "overview", "bullets", "stats", 
    "financials", "timeline", "team", "comparison", 
    "market", "closing", "disclaimer", "custom"
  ];
  
  if (validLayouts.includes(slideType as SlideLayout)) {
    return slideType as SlideLayout;
  }
  
  // Otherwise, pick from the layout code's options
  const options = LAYOUT_CODE_MAP[layoutCode];
  return options[0];
}

export function useGenerateOutline() {
  return useMutation({
    mutationFn: async (params: GenerateOutlineParams): Promise<SlideOutlineItem[]> => {
      const { data, error } = await supabase.functions.invoke("generate-slide-outline", {
        body: params,
      });

      if (error) {
        throw new Error(error.message || "Failed to generate outline");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as SlideOutlineItem[];
    },
    onError: (error) => {
      console.error("Generate outline error:", error);
      toast.error(error.message || "Error al generar el esquema");
    },
  });
}
