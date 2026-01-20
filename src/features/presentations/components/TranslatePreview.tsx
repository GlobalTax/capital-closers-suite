import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronLeft, ChevronRight, AlertTriangle, Globe } from "lucide-react";
import { PresentationSlide, SlideContent } from "@/types/presentations";
import { cn } from "@/lib/utils";

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

interface TranslatePreviewProps {
  originalSlides: PresentationSlide[];
  translatedSlides: SlideForTranslation[];
  targetLanguage: string;
  warnings?: string[];
  onApply: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

export function TranslatePreview({
  originalSlides,
  translatedSlides,
  targetLanguage,
  warnings,
  onApply,
  onCancel,
  isApplying = false,
}: TranslatePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentOriginal = originalSlides[currentIndex];
  const currentTranslated = translatedSlides.find(t => t.slide_index === currentIndex);
  const originalContent = currentOriginal?.content as SlideContent | null;

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(originalSlides.length - 1, prev + 1));
  };

  const renderComparison = (label: string, original?: string | null, translated?: string | null) => {
    if (!original && !translated) return null;
    const hasChanged = original !== translated;

    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 rounded bg-muted/50 text-sm">
            {original || <span className="text-muted-foreground italic">—</span>}
          </div>
          <div className={cn(
            "p-2 rounded text-sm",
            hasChanged ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" : "bg-muted/50"
          )}>
            {translated || <span className="text-muted-foreground italic">—</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderBulletsComparison = (original?: string[], translated?: string[]) => {
    if (!original?.length && !translated?.length) return null;

    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Bullets
        </span>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 rounded bg-muted/50 text-sm space-y-1">
            {original?.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{b}</span>
              </div>
            )) || <span className="text-muted-foreground italic">—</span>}
          </div>
          <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm space-y-1">
            {translated?.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{b}</span>
              </div>
            )) || <span className="text-muted-foreground italic">—</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderStatsComparison = (
    original?: { value: string; label: string }[],
    translated?: { value: string; label: string }[]
  ) => {
    if (!original?.length && !translated?.length) return null;

    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Stats
        </span>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 rounded bg-muted/50 text-sm space-y-2">
            {original?.map((s, i) => (
              <div key={i}>
                <div className="font-bold">{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </div>
            )) || <span className="text-muted-foreground italic">—</span>}
          </div>
          <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm space-y-2">
            {translated?.map((s, i) => (
              <div key={i}>
                <div className="font-bold">{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </div>
            )) || <span className="text-muted-foreground italic">—</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Vista previa de traducción</h2>
            <p className="text-sm text-muted-foreground">
              Traducido a <Badge variant="secondary">{targetLanguage}</Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isApplying}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={onApply} disabled={isApplying}>
            <Check className="h-4 w-4 mr-2" />
            Aplicar traducción
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Correcciones automáticas aplicadas:</p>
              <ul className="list-disc list-inside mt-1">
                {warnings.slice(0, 3).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {warnings.length > 3 && (
                  <li>...y {warnings.length - 3} más</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide list */}
        <div className="w-48 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {originalSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    currentIndex === idx
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="font-medium truncate">
                    {idx + 1}. {slide.headline || slide.layout}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Comparison view */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {/* Column headers */}
              <div className="grid grid-cols-2 gap-4 pb-2 border-b">
                <div className="text-sm font-medium text-muted-foreground">Original</div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {targetLanguage}
                </div>
              </div>

              {/* Headline */}
              {renderComparison(
                "Titular",
                currentOriginal?.headline,
                currentTranslated?.headline
              )}

              {/* Subline */}
              {renderComparison(
                "Subtítulo",
                currentOriginal?.subline,
                currentTranslated?.subline
              )}

              {/* Bullets */}
              {renderBulletsComparison(
                originalContent?.bullets,
                currentTranslated?.bullets
              )}

              {/* Stats */}
              {renderStatsComparison(
                originalContent?.stats,
                currentTranslated?.stats
              )}

              {/* Body text */}
              {renderComparison(
                "Texto",
                originalContent?.bodyText,
                currentTranslated?.bodyText
              )}

              {/* Footnote */}
              {renderComparison(
                "Nota al pie",
                originalContent?.footnote,
                currentTranslated?.footnote
              )}

              {/* Confidentiality */}
              {renderComparison(
                "Confidencialidad",
                originalContent?.confidentialityText,
                currentTranslated?.confidentialityText
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Diapositiva {currentIndex + 1} de {originalSlides.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === originalSlides.length - 1}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
