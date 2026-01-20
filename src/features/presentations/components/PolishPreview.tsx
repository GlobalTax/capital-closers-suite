import { useState } from "react";
import { Check, X, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PresentationSlide } from "@/types/presentations";
import type { PolishedSlide } from "@/hooks/usePolishSlides";

interface PolishPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalSlides: PresentationSlide[];
  polishedSlides: PolishedSlide[];
  onApply: () => void;
  isApplying?: boolean;
}

export function PolishPreview({
  open,
  onOpenChange,
  originalSlides,
  polishedSlides,
  onApply,
  isApplying = false,
}: PolishPreviewProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);

  const currentPolished = polishedSlides[selectedSlide];
  const currentOriginal = originalSlides[currentPolished?.slide_index ?? 0];

  if (!currentPolished || !currentOriginal) {
    return null;
  }

  const originalContent = currentOriginal.content as Record<string, unknown> || {};

  const hasHeadlineChange = currentPolished.headline !== currentOriginal.headline;
  const hasSublineChange = currentPolished.subline !== currentOriginal.subline;
  const hasBulletsChange = JSON.stringify(currentPolished.bullets) !== JSON.stringify(originalContent.bullets);

  const totalChanges = polishedSlides.filter((p, idx) => {
    const orig = originalSlides[p.slide_index];
    if (!orig) return false;
    const origContent = orig.content as Record<string, unknown> || {};
    return (
      p.headline !== orig.headline ||
      p.subline !== orig.subline ||
      JSON.stringify(p.bullets) !== JSON.stringify(origContent.bullets) ||
      JSON.stringify(p.stats) !== JSON.stringify(origContent.stats)
    );
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Vista Previa de Cambios Editoriales
          </DialogTitle>
          <DialogDescription>
            {totalChanges} de {polishedSlides.length} slides modificados. Revisa los cambios antes de aplicarlos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Slide selector */}
          <div className="w-48 flex-shrink-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-2">
                {polishedSlides.map((polished, idx) => {
                  const orig = originalSlides[polished.slide_index];
                  const hasChanges = orig && polished.headline !== orig.headline;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlide(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSlide === idx
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Slide {polished.slide_index + 1}
                        </span>
                        {hasChanges && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            Editado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate mt-1">
                        {polished.headline || 'Sin título'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Comparison view */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Original
                  </h4>
                  
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${hasHeadlineChange ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                      <p className="text-xs text-muted-foreground mb-1">Título</p>
                      <p className="font-medium">{currentOriginal.headline || '—'}</p>
                    </div>

                    {currentOriginal.subline && (
                      <div className={`p-3 rounded-lg ${hasSublineChange ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                        <p className="text-xs text-muted-foreground mb-1">Subtítulo</p>
                        <p className="text-sm">{currentOriginal.subline}</p>
                      </div>
                    )}

                    {Array.isArray(originalContent.bullets) && originalContent.bullets.length > 0 && (
                      <div className={`p-3 rounded-lg ${hasBulletsChange ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                        <p className="text-xs text-muted-foreground mb-2">Puntos</p>
                        <ul className="space-y-1">
                          {(originalContent.bullets as string[]).map((b, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-muted-foreground">•</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Polished */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-primary uppercase tracking-wide flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Pulido
                  </h4>
                  
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${hasHeadlineChange ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                      <p className="text-xs text-muted-foreground mb-1">Título</p>
                      <p className="font-medium">{currentPolished.headline || '—'}</p>
                    </div>

                    {currentPolished.subline && (
                      <div className={`p-3 rounded-lg ${hasSublineChange ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                        <p className="text-xs text-muted-foreground mb-1">Subtítulo</p>
                        <p className="text-sm">{currentPolished.subline}</p>
                      </div>
                    )}

                    {currentPolished.bullets && currentPolished.bullets.length > 0 && (
                      <div className={`p-3 rounded-lg ${hasBulletsChange ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                        <p className="text-xs text-muted-foreground mb-2">Puntos</p>
                        <ul className="space-y-1">
                          {currentPolished.bullets.map((b, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-primary">•</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={onApply} disabled={isApplying}>
            {isApplying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Aplicar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
