import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PresentationSlide, SlideContent } from "@/types/presentations";
import { toast } from "sonner";

interface SlideForTranslation {
  slide_index: number;
  headline?: string;
  subline?: string;
  bullets?: string[];
  stats?: { value: string; label: string; prefix?: string; suffix?: string }[];
  bodyText?: string;
  teamMembers?: { name: string; role: string }[];
  columns?: { title: string; items: string[] }[];
  footnote?: string;
  confidentialityText?: string;
}

interface TranslateParams {
  slides: PresentationSlide[];
  targetLanguage: string;
}

interface TranslateResponse {
  slides: SlideForTranslation[];
  target_language: string;
  warnings?: string[];
}

export const SUPPORTED_LANGUAGES = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

function slideToTranslateFormat(slide: PresentationSlide, index: number): SlideForTranslation {
  const content = slide.content as SlideContent | null;
  
  return {
    slide_index: index,
    headline: slide.headline || undefined,
    subline: slide.subline || undefined,
    bullets: content?.bullets,
    stats: content?.stats,
    bodyText: content?.bodyText,
    teamMembers: content?.teamMembers,
    columns: content?.columns,
    footnote: content?.footnote,
    confidentialityText: content?.confidentialityText,
  };
}

export function applyTranslatedContent(
  originalSlides: PresentationSlide[],
  translatedSlides: SlideForTranslation[]
): Partial<PresentationSlide>[] {
  return originalSlides.map((original, idx) => {
    const translated = translatedSlides.find(t => t.slide_index === idx);
    if (!translated) return {};

    const originalContent = original.content as SlideContent | null;
    
    const updatedContent: SlideContent = {
      ...originalContent,
      bullets: translated.bullets || originalContent?.bullets,
      stats: translated.stats || originalContent?.stats,
      bodyText: translated.bodyText || originalContent?.bodyText,
      teamMembers: translated.teamMembers || originalContent?.teamMembers,
      columns: translated.columns || originalContent?.columns,
      footnote: translated.footnote || originalContent?.footnote,
      confidentialityText: translated.confidentialityText || originalContent?.confidentialityText,
    };

    return {
      id: original.id,
      headline: translated.headline || original.headline,
      subline: translated.subline || original.subline,
      content: updatedContent,
    };
  });
}

export function useTranslateSlides() {
  return useMutation({
    mutationFn: async ({ slides, targetLanguage }: TranslateParams): Promise<TranslateResponse> => {
      const slidesJson = slides.map((slide, idx) => slideToTranslateFormat(slide, idx));

      const { data, error } = await supabase.functions.invoke("translate-slides", {
        body: {
          slides_json: slidesJson,
          target_language: targetLanguage,
        },
      });

      if (error) {
        console.error("Translation error:", error);
        throw new Error(error.message || "Error al traducir");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as TranslateResponse;
    },
    onError: (error: Error) => {
      if (error.message.includes("Rate limit")) {
        toast.error("Límite de velocidad excedido. Intenta de nuevo en unos segundos.");
      } else if (error.message.includes("credits")) {
        toast.error("Créditos de IA agotados. Añade fondos para continuar.");
      } else {
        toast.error(`Error al traducir: ${error.message}`);
      }
    },
  });
}
