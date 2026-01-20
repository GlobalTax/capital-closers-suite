import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PresentationType, SlideLayout, SlideContent } from "@/types/presentations";

export interface SlideOutlineItem {
  slide_index: number;
  slide_type: string;
  layout: "A" | "B" | "C";
  headline: string;
  subline?: string;
  content: SlideContent;
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

// Transform AI response content to SlideContent format
export function transformAIContent(aiContent: Record<string, unknown> | undefined): SlideContent {
  if (!aiContent) return {};

  const content: SlideContent = {};

  if (Array.isArray(aiContent.bullets)) {
    content.bullets = aiContent.bullets.filter((b): b is string => typeof b === "string");
  }

  if (Array.isArray(aiContent.stats)) {
    content.stats = aiContent.stats
      .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
      .map(s => ({
        value: String(s.value || "0"),
        label: String(s.label || ""),
        prefix: s.prefix ? String(s.prefix) : undefined,
        suffix: s.suffix ? String(s.suffix) : undefined,
      }));
  }

  if (Array.isArray(aiContent.team_members)) {
    content.teamMembers = aiContent.team_members
      .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
      .map(m => ({
        name: String(m.name || ""),
        role: String(m.role || ""),
      }));
  }

  if (Array.isArray(aiContent.columns)) {
    content.columns = aiContent.columns
      .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
      .map(c => ({
        title: String(c.title || ""),
        items: Array.isArray(c.items) ? c.items.filter((i): i is string => typeof i === "string") : [],
      }));
  }

  if (typeof aiContent.bodyText === "string") {
    content.bodyText = aiContent.bodyText;
  }

  return content;
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

      // Transform the response to include proper content structure
      const slides = data as Array<{
        slide_index: number;
        slide_type: string;
        layout: "A" | "B" | "C";
        headline: string;
        subline?: string;
        content?: Record<string, unknown>;
      }>;

      return slides.map(slide => ({
        slide_index: slide.slide_index,
        slide_type: slide.slide_type,
        layout: slide.layout,
        headline: slide.headline,
        subline: slide.subline,
        content: transformAIContent(slide.content),
      }));
    },
    onError: (error) => {
      console.error("Generate outline error:", error);
      toast.error(error.message || "Error al generar el esquema");
    },
  });
}
