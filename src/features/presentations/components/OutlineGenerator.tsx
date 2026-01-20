import { useState } from "react";
import { Wand2, Loader2, Check, ChevronRight, ListOrdered, BarChart3, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useGenerateOutline, SlideOutlineItem, mapSlideTypeToLayout } from "@/hooks/useGenerateOutline";
import { useRefineSlidesCopy, RefinedSlide } from "@/hooks/useRefineSlidesCopy";
import type { PresentationType, SlideLayout, SlideContent } from "@/types/presentations";
import { TEMPLATE_DEFINITIONS, LAYOUT_DEFINITIONS } from "@/types/presentations";

interface OutlineGeneratorProps {
  presentationType: PresentationType;
  onApplyOutline: (slides: Array<{
    layout: SlideLayout;
    headline: string;
    subline?: string;
    content: SlideContent;
  }>) => void;
  onCancel: () => void;
}

interface InputFormData {
  company_name: string;
  sector: string;
  revenue: string;
  ebitda: string;
  highlights: string;
  target_audience: string;
}

type GenerationStep = "inputs" | "outline" | "refined";

const LAYOUT_BADGES: Record<"A" | "B" | "C", { label: string; variant: "default" | "secondary" | "outline" }> = {
  A: { label: "Statement", variant: "default" },
  B: { label: "Bullets", variant: "secondary" },
  C: { label: "Two-col", variant: "outline" },
};

// Helper to render content preview
function ContentPreview({ content, slideType }: { content: SlideContent; slideType: string }) {
  const hasContent = content.bullets?.length || content.stats?.length || content.teamMembers?.length || content.columns?.length;
  
  if (!hasContent) return null;

  return (
    <div className="mt-2 pl-4 border-l-2 border-muted space-y-2">
      {content.bullets && content.bullets.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ListOrdered className="h-3 w-3" />
            <span>Puntos ({content.bullets.length})</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {content.bullets.slice(0, 3).map((bullet, i) => (
              <li key={i} className="truncate">• {bullet}</li>
            ))}
            {content.bullets.length > 3 && (
              <li className="text-muted-foreground/60">+ {content.bullets.length - 3} más...</li>
            )}
          </ul>
        </div>
      )}

      {content.stats && content.stats.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            <span>Métricas ({content.stats.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {content.stats.slice(0, 4).map((stat, i) => (
              <div key={i} className="text-xs bg-muted/50 px-2 py-1 rounded">
                <span className="font-medium">{stat.prefix}{stat.value}{stat.suffix}</span>
                <span className="text-muted-foreground ml-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.teamMembers && content.teamMembers.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Equipo ({content.teamMembers.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {content.teamMembers.map((member, i) => (
              <div key={i} className="text-xs bg-muted/50 px-2 py-1 rounded">
                <span className="font-medium">{member.name}</span>
                <span className="text-muted-foreground ml-1">- {member.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.columns && content.columns.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {content.columns.map((col, i) => (
            <div key={i} className="text-xs">
              <div className="font-medium text-muted-foreground">{col.title}</div>
              <ul className="text-muted-foreground/80">
                {col.items.slice(0, 2).map((item, j) => (
                  <li key={j} className="truncate">• {item}</li>
                ))}
                {col.items.length > 2 && (
                  <li className="text-muted-foreground/60">+ {col.items.length - 2} más</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Convert RefinedSlide to SlideOutlineItem format for display
function refinedToOutlineItem(refined: RefinedSlide): SlideOutlineItem {
  const content: SlideContent = {};
  
  if (refined.bullets?.length) {
    content.bullets = refined.bullets;
  }
  if (refined.stats?.length) {
    content.stats = refined.stats.map(s => ({ value: s.value, label: s.label }));
  }
  if (refined.team_members?.length) {
    content.teamMembers = refined.team_members;
  }
  if (refined.columns?.length) {
    content.columns = refined.columns.map(c => ({ title: c.title, items: [c.content] }));
  }

  return {
    slide_index: refined.slide_index,
    slide_type: refined.slide_type,
    layout: refined.layout,
    headline: refined.headline,
    subline: refined.subline,
    content,
  };
}

export function OutlineGenerator({ presentationType, onApplyOutline, onCancel }: OutlineGeneratorProps) {
  const [step, setStep] = useState<GenerationStep>("inputs");
  const [formData, setFormData] = useState<InputFormData>({
    company_name: "",
    sector: "",
    revenue: "",
    ebitda: "",
    highlights: "",
    target_audience: "",
  });
  const [outline, setOutline] = useState<SlideOutlineItem[]>([]);
  const [refinedOutline, setRefinedOutline] = useState<SlideOutlineItem[]>([]);
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set());

  const generateMutation = useGenerateOutline();
  const refineMutation = useRefineSlidesCopy();
  const templateDef = TEMPLATE_DEFINITIONS[presentationType];

  const handleInputChange = (field: keyof InputFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInputsJson = (): Record<string, unknown> => ({
    ...formData,
    highlights: formData.highlights.split("\n").filter(h => h.trim()),
  });

  const handleGenerate = async () => {
    const inputs_json = getInputsJson();

    try {
      const result = await generateMutation.mutateAsync({
        presentation_type: presentationType,
        inputs_json,
      });
      setOutline(result);
      setExpandedSlides(new Set(result.map((_, i) => i)));
      setStep("outline");
    } catch {
      // Error handled in hook
    }
  };

  const handleRefine = async () => {
    const inputs_json = getInputsJson();

    try {
      const refined = await refineMutation.mutateAsync({
        inputs_json,
        outline_json: outline,
      });
      setRefinedOutline(refined.map(refinedToOutlineItem));
      setExpandedSlides(new Set(refined.map((_, i) => i)));
      setStep("refined");
    } catch {
      // Error handled in hook
    }
  };

  const toggleSlideExpanded = (index: number) => {
    setExpandedSlides(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleApply = () => {
    const slidesToApply = step === "refined" ? refinedOutline : outline;
    const slides = slidesToApply.map(item => ({
      layout: mapSlideTypeToLayout(item.slide_type, item.layout),
      headline: item.headline,
      subline: item.subline,
      content: item.content,
    }));
    onApplyOutline(slides);
  };

  // Input step
  if (step === "inputs") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Generar Presentación con IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            La IA generará {templateDef.slideCount} slides para tu {templateDef.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de Empresa/Proyecto *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={e => handleInputChange("company_name", e.target.value)}
                placeholder="Ej: Proyecto Atlas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={e => handleInputChange("sector", e.target.value)}
                placeholder="Ej: Healthcare Tech"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Facturación</Label>
              <Input
                id="revenue"
                value={formData.revenue}
                onChange={e => handleInputChange("revenue", e.target.value)}
                placeholder="Ej: €15M"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebitda">EBITDA</Label>
              <Input
                id="ebitda"
                value={formData.ebitda}
                onChange={e => handleInputChange("ebitda", e.target.value)}
                placeholder="Ej: €3M (20% margen)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Audiencia Objetivo</Label>
            <Input
              id="target_audience"
              value={formData.target_audience}
              onChange={e => handleInputChange("target_audience", e.target.value)}
              placeholder="Ej: Private Equity, Inversores Estratégicos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Puntos Destacados (uno por línea)</Label>
            <Textarea
              id="highlights"
              value={formData.highlights}
              onChange={e => handleInputChange("highlights", e.target.value)}
              placeholder="Ej:&#10;Líder regional en su segmento&#10;85% ingresos recurrentes&#10;Crecimiento 30% anual&#10;+500 clientes B2B"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Cuantos más detalles proporciones, mejor será el contenido generado
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={generateMutation.isPending || !formData.company_name || !formData.sector}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando estructura...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generar Estructura
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Current slides to display (outline or refined)
  const currentSlides = step === "refined" ? refinedOutline : outline;
  const isRefined = step === "refined";

  // Outline or Refined step
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRefined ? (
            <>
              <Sparkles className="h-5 w-5 text-amber-500" />
              Copy Profesional Generado
            </>
          ) : (
            <>
              <Check className="h-5 w-5 text-green-500" />
              Estructura Generada
            </>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isRefined 
            ? "Copy M&A-grade aplicado. Revisa y aplica la presentación."
            : "Revisa la estructura. Puedes refinar el copy con IA o aplicar directamente."
          }
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-2">
            {currentSlides.map((item, index) => {
              const layoutInfo = LAYOUT_DEFINITIONS[item.slide_type as keyof typeof LAYOUT_DEFINITIONS];
              const badgeInfo = LAYOUT_BADGES[item.layout];
              const isExpanded = expandedSlides.has(index);
              const hasContent = item.content.bullets?.length || item.content.stats?.length || 
                                item.content.teamMembers?.length || item.content.columns?.length;
              
              return (
                <Collapsible 
                  key={index} 
                  open={isExpanded}
                  onOpenChange={() => toggleSlideExpanded(index)}
                >
                  <div className="rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-start gap-3 p-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {item.slide_index + 1}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">
                              {layoutInfo?.name || item.slide_type}
                            </span>
                            <Badge variant={badgeInfo.variant} className="text-xs">
                              {badgeInfo.label}
                            </Badge>
                            {hasContent && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                Con contenido
                              </Badge>
                            )}
                            {isRefined && (
                              <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-300">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Refinado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {item.headline}
                          </p>
                          {item.subline && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.subline}
                            </p>
                          )}
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        <ContentPreview content={item.content} slideType={item.slide_type} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between gap-3 pt-4 mt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setStep(isRefined ? "outline" : "inputs")}
          >
            Volver
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            
            {!isRefined && (
              <Button 
                variant="secondary"
                onClick={handleRefine}
                disabled={refineMutation.isPending}
              >
                {refineMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refinando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Refinar Copy
                  </>
                )}
              </Button>
            )}
            
            <Button onClick={handleApply}>
              <Check className="h-4 w-4 mr-2" />
              Aplicar Presentación
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
