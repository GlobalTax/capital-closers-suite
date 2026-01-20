import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PresentationSlide } from "@/types/presentations";

interface SlideForPolish {
  slide_index: number;
  headline: string;
  subline?: string;
  bullets?: string[];
  stats?: Array<{ value: string; label: string; prefix?: string; suffix?: string }>;
  bodyText?: string;
  teamMembers?: Array<{ name: string; role: string }>;
  columns?: Array<{ title: string; items: string[] }>;
}

interface PolishedSlide {
  slide_index: number;
  headline: string;
  subline?: string;
  bullets?: string[];
  stats?: Array<{ value: string; label: string; prefix?: string; suffix?: string }>;
  bodyText?: string;
  teamMembers?: Array<{ name: string; role: string }>;
  columns?: Array<{ title: string; items: string[] }>;
}

interface PolishResponse {
  slides: PolishedSlide[];
}

function slideToPolishFormat(slide: PresentationSlide, index: number): SlideForPolish {
  const content = slide.content as Record<string, unknown> || {};
  
  return {
    slide_index: index,
    headline: slide.headline || '',
    subline: slide.subline || undefined,
    bullets: content.bullets as string[] | undefined,
    stats: content.stats as SlideForPolish['stats'],
    bodyText: content.bodyText as string | undefined,
    teamMembers: content.teamMembers as SlideForPolish['teamMembers'],
    columns: content.columns as SlideForPolish['columns'],
  };
}

export function usePolishSlides() {
  return useMutation({
    mutationFn: async (slides: PresentationSlide[]): Promise<PolishResponse> => {
      const slidesJson = slides.map((slide, idx) => slideToPolishFormat(slide, idx));

      const { data, error } = await supabase.functions.invoke('polish-slides', {
        body: { slides_json: slidesJson }
      });

      if (error) {
        throw new Error(error.message || 'Failed to polish slides');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as PolishResponse;
    }
  });
}

export function applyPolishedContent(
  originalSlides: PresentationSlide[],
  polishedSlides: PolishedSlide[]
): Partial<PresentationSlide>[] {
  return polishedSlides.map((polished) => {
    const original = originalSlides[polished.slide_index];
    if (!original) return {};

    const originalContent = original.content as Record<string, unknown> || {};
    
    const newContent: Record<string, unknown> = { ...originalContent };
    
    if (polished.bullets) newContent.bullets = polished.bullets;
    if (polished.stats) newContent.stats = polished.stats;
    if (polished.bodyText) newContent.bodyText = polished.bodyText;
    if (polished.teamMembers) newContent.teamMembers = polished.teamMembers;
    if (polished.columns) newContent.columns = polished.columns;

    return {
      headline: polished.headline,
      subline: polished.subline ?? original.subline,
      content: newContent,
    };
  });
}

export type { SlideForPolish, PolishedSlide, PolishResponse };
