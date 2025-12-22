import { FileSignature, FileText, Presentation, ScrollText, ListChecks, Shield, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTemplates } from "@/hooks/useDocumentTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentTemplate, TemplateCategory } from "@/types/documents";

interface TemplateLibraryProps {
  tipoOperacion?: 'compra' | 'venta';
  onSelectTemplate?: (template: DocumentTemplate) => void;
}

const categoryConfig: Record<TemplateCategory, { icon: React.ReactNode; color: string; label: string }> = {
  NDA: { icon: <Shield className="w-4 h-4" />, color: 'text-red-500', label: 'NDA' },
  LOI: { icon: <FileSignature className="w-4 h-4" />, color: 'text-blue-500', label: 'LOI' },
  Teaser: { icon: <Presentation className="w-4 h-4" />, color: 'text-green-500', label: 'Teaser' },
  SPA: { icon: <ScrollText className="w-4 h-4" />, color: 'text-purple-500', label: 'SPA' },
  DD_Checklist: { icon: <ListChecks className="w-4 h-4" />, color: 'text-orange-500', label: 'DD Checklist' },
  Contrato: { icon: <FileText className="w-4 h-4" />, color: 'text-amber-500', label: 'Contrato' },
  Otro: { icon: <FileText className="w-4 h-4" />, color: 'text-muted-foreground', label: 'Otro' },
};

export function TemplateLibrary({ tipoOperacion, onSelectTemplate }: TemplateLibraryProps) {
  const { templates, groupedTemplates, isLoading } = useDocumentTemplates();

  // Filtrar por tipo de operación si se proporciona
  const filteredTemplates = tipoOperacion
    ? templates.filter(t => t.tipo_operacion === tipoOperacion || t.tipo_operacion === 'ambos')
    : templates;

  const categories = Object.keys(groupedTemplates).filter(cat => 
    groupedTemplates[cat as TemplateCategory]?.some(t => 
      !tipoOperacion || t.tipo_operacion === tipoOperacion || t.tipo_operacion === 'ambos'
    )
  ) as TemplateCategory[];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay plantillas disponibles</p>
        <p className="text-sm">Las plantillas M&A se mostrarán aquí</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={categories[0]} className="w-full">
      <TabsList className="flex-wrap h-auto gap-1 mb-4">
        {categories.map(category => {
          const config = categoryConfig[category];
          return (
            <TabsTrigger key={category} value={category} className="gap-2">
              <span className={config.color}>{config.icon}</span>
              {config.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {categories.map(category => (
        <TabsContent key={category} value={category}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedTemplates[category]
              ?.filter(t => !tipoOperacion || t.tipo_operacion === tipoOperacion || t.tipo_operacion === 'ambos')
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={onSelectTemplate}
                />
              ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

interface TemplateCardProps {
  template: DocumentTemplate;
  onSelect?: (template: DocumentTemplate) => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const config = categoryConfig[template.category];

  const handleDownload = () => {
    if (template.template_url) {
      window.open(template.template_url, '_blank');
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-accent ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              {template.fase_aplicable && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {template.fase_aplicable}
                </Badge>
              )}
            </div>
          </div>
          
          {template.tipo_operacion && template.tipo_operacion !== 'ambos' && (
            <Badge variant={template.tipo_operacion === 'venta' ? 'default' : 'secondary'}>
              {template.tipo_operacion === 'venta' ? 'Venta' : 'Compra'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {template.description && (
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        )}

        <div className="flex items-center gap-2">
          {template.template_url && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          )}
          
          {onSelect && (
            <Button variant="default" size="sm" onClick={() => onSelect(template)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Usar plantilla
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
