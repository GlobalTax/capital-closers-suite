import { useState } from "react";
import { Wand2, Loader2, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGenerateOutline, SlideOutlineItem, mapSlideTypeToLayout } from "@/hooks/useGenerateOutline";
import type { PresentationType, SlideLayout, SlideContent } from "@/types/presentations";
import { TEMPLATE_DEFINITIONS, LAYOUT_DEFINITIONS } from "@/types/presentations";

interface OutlineGeneratorProps {
  presentationType: PresentationType;
  onApplyOutline: (slides: Array<{
    layout: SlideLayout;
    headline: string;
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

const LAYOUT_BADGES: Record<"A" | "B" | "C", { label: string; variant: "default" | "secondary" | "outline" }> = {
  A: { label: "Statement", variant: "default" },
  B: { label: "Bullets", variant: "secondary" },
  C: { label: "Two-col", variant: "outline" },
};

export function OutlineGenerator({ presentationType, onApplyOutline, onCancel }: OutlineGeneratorProps) {
  const [step, setStep] = useState<"inputs" | "preview">("inputs");
  const [formData, setFormData] = useState<InputFormData>({
    company_name: "",
    sector: "",
    revenue: "",
    ebitda: "",
    highlights: "",
    target_audience: "",
  });
  const [outline, setOutline] = useState<SlideOutlineItem[]>([]);

  const generateMutation = useGenerateOutline();
  const templateDef = TEMPLATE_DEFINITIONS[presentationType];

  const handleInputChange = (field: keyof InputFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    const inputs_json: Record<string, unknown> = {
      ...formData,
      highlights: formData.highlights.split("\n").filter(h => h.trim()),
    };

    try {
      const result = await generateMutation.mutateAsync({
        presentation_type: presentationType,
        inputs_json,
      });
      setOutline(result);
      setStep("preview");
    } catch {
      // Error handled in hook
    }
  };

  const handleApply = () => {
    const slides = outline.map(item => ({
      layout: mapSlideTypeToLayout(item.slide_type, item.layout),
      headline: item.purpose,
      content: {} as SlideContent,
    }));
    onApplyOutline(slides);
  };

  if (step === "inputs") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Generar Esquema con IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Proporciona contexto para generar un esquema de {templateDef.slideCount} slides para tu {templateDef.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de Empresa/Proyecto</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={e => handleInputChange("company_name", e.target.value)}
                placeholder="Ej: Proyecto Atlas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
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
              <Label htmlFor="revenue">Facturación (€)</Label>
              <Input
                id="revenue"
                value={formData.revenue}
                onChange={e => handleInputChange("revenue", e.target.value)}
                placeholder="Ej: €15M"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebitda">EBITDA (€)</Label>
              <Input
                id="ebitda"
                value={formData.ebitda}
                onChange={e => handleInputChange("ebitda", e.target.value)}
                placeholder="Ej: €3M"
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
              placeholder="Ej:&#10;Líder regional en su segmento&#10;85% ingresos recurrentes&#10;Crecimiento 30% anual"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generar Esquema
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview step
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          Esquema Generado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Revisa el esquema y aplícalo para crear los slides
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {outline.map((item, index) => {
              const layoutInfo = LAYOUT_DEFINITIONS[item.slide_type as keyof typeof LAYOUT_DEFINITIONS];
              const badgeInfo = LAYOUT_BADGES[item.layout];
              
              return (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {item.slide_index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {layoutInfo?.name || item.slide_type}
                      </span>
                      <Badge variant={badgeInfo.variant} className="text-xs">
                        {badgeInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.purpose}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between gap-3 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => setStep("inputs")}>
            Volver a Editar
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleApply}>
              <Check className="h-4 w-4 mr-2" />
              Aplicar Esquema
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
