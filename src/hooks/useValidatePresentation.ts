import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PresentationSlide, SlideContent } from "@/types/presentations";

interface SlideIssue {
  type: 'constraint_violation' | 'risky_claim' | 'inconsistent_term' | 'text_density' | 'invented_data';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: 'headline' | 'subline' | 'bullets' | 'stats' | 'body';
}

interface SuggestedFix {
  slide_index: number;
  location: string;
  original: string;
  suggested: string;
  reason: string;
}

interface RiskFlag {
  slide_index: number;
  flag: string;
  recommendation: string;
}

export interface ValidationReport {
  overall_quality_score: number;
  issues_per_slide: Array<{
    slide_index: number;
    issues: SlideIssue[];
  }>;
  suggested_fixes: SuggestedFix[];
  risk_flags: RiskFlag[];
  summary: {
    total_issues: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
    risk_flags_count: number;
    suggested_fixes_count: number;
  };
}

interface ValidationInput {
  slides: PresentationSlide[];
  inputs?: Record<string, unknown>;
}

function mapSlideToValidationFormat(slide: PresentationSlide, index: number) {
  const content = slide.content as SlideContent | null;
  
  return {
    slide_index: index,
    layout: slide.layout,
    headline: slide.headline || '',
    subline: slide.subline || undefined,
    bullets: content?.bullets,
    stats: content?.stats,
    bodyText: content?.bodyText,
    teamMembers: content?.teamMembers,
    columns: content?.columns,
  };
}

export function useValidatePresentation() {
  return useMutation({
    mutationFn: async ({ slides, inputs }: ValidationInput): Promise<ValidationReport> => {
      const mappedSlides = slides.map((slide, index) => mapSlideToValidationFormat(slide, index));

      const { data, error } = await supabase.functions.invoke('validate-presentation', {
        body: { slides: mappedSlides, inputs },
      });

      if (error) {
        console.error('Validation error:', error);
        throw new Error(error.message || 'Error al validar la presentación');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as ValidationReport;
    },
  });
}

// Helper to get severity color
export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-orange-500';
    case 'low':
      return 'text-yellow-500';
    default:
      return 'text-muted-foreground';
  }
}

// Helper to get severity background
export function getSeverityBg(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'bg-destructive/10 border-destructive/20';
    case 'medium':
      return 'bg-orange-500/10 border-orange-500/20';
    case 'low':
      return 'bg-yellow-500/10 border-yellow-500/20';
    default:
      return 'bg-muted';
  }
}

// Helper to get issue type label
export function getIssueTypeLabel(type: SlideIssue['type']): string {
  switch (type) {
    case 'constraint_violation':
      return 'Violación de restricción';
    case 'risky_claim':
      return 'Afirmación arriesgada';
    case 'inconsistent_term':
      return 'Término inconsistente';
    case 'text_density':
      return 'Densidad de texto';
    case 'invented_data':
      return 'Dato sin soporte';
    default:
      return type;
  }
}

// Helper to get quality score color
export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-500';
  if (score >= 6) return 'text-yellow-500';
  if (score >= 4) return 'text-orange-500';
  return 'text-destructive';
}

// Helper to get quality status text
export function getQualityStatus(score: number): string {
  if (score >= 9) return 'Excelente';
  if (score >= 8) return 'Muy bueno';
  if (score >= 7) return 'Bueno';
  if (score >= 6) return 'Aceptable';
  if (score >= 5) return 'Necesita mejoras';
  if (score >= 4) return 'Revisión recomendada';
  return 'Revisión urgente';
}
