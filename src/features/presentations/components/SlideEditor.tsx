import { useState, useEffect } from "react";
import { 
  Type, 
  List, 
  BarChart3, 
  Users, 
  Columns,
  Palette,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { usePolishSlides, applyPolishedContent } from "@/hooks/usePolishSlides";
import { PolishPreview } from "./PolishPreview";
import type { PresentationSlide, SlideContent, SlideLayout } from "@/types/presentations";
import type { PolishedSlide } from "@/hooks/usePolishSlides";

interface SlideEditorProps {
  slide: PresentationSlide;
  allSlides?: PresentationSlide[];
  onUpdate: (updates: Partial<PresentationSlide>) => void;
  onBulkUpdate?: (updates: { slideId: string; updates: Partial<PresentationSlide> }[]) => void;
}

const LAYOUTS: { value: SlideLayout; label: string; icon: React.ElementType }[] = [
  { value: 'title', label: 'Portada', icon: Type },
  { value: 'bullets', label: 'Puntos', icon: List },
  { value: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { value: 'overview', label: 'Visión General', icon: Type },
  { value: 'team', label: 'Equipo', icon: Users },
  { value: 'comparison', label: 'Comparativa', icon: Columns },
  { value: 'closing', label: 'Cierre', icon: Type },
];

export function SlideEditor({ slide, allSlides = [], onUpdate, onBulkUpdate }: SlideEditorProps) {
  const [localHeadline, setLocalHeadline] = useState(slide.headline || '');
  const [localSubline, setLocalSubline] = useState(slide.subline || '');
  const [localContent, setLocalContent] = useState<SlideContent>(slide.content as SlideContent || {});
  const [showPolishPreview, setShowPolishPreview] = useState(false);
  const [polishedSlides, setPolishedSlides] = useState<PolishedSlide[]>([]);

  const polishMutation = usePolishSlides();

  // Sync when slide changes
  useEffect(() => {
    setLocalHeadline(slide.headline || '');
    setLocalSubline(slide.subline || '');
    setLocalContent(slide.content as SlideContent || {});
  }, [slide.id]);

  const handleHeadlineBlur = () => {
    if (localHeadline !== slide.headline) {
      onUpdate({ headline: localHeadline });
    }
  };

  const handleSublineBlur = () => {
    if (localSubline !== slide.subline) {
      onUpdate({ subline: localSubline });
    }
  };

  const handleContentUpdate = (updates: Partial<SlideContent>) => {
    const newContent = { ...localContent, ...updates };
    setLocalContent(newContent);
    onUpdate({ content: newContent });
  };

  const handleLayoutChange = (layout: SlideLayout) => {
    onUpdate({ layout });
  };

  const handlePolishSlides = async () => {
    const slidesToPolish = allSlides.length > 0 ? allSlides : [slide];
    
    try {
      const result = await polishMutation.mutateAsync(slidesToPolish);
      setPolishedSlides(result.slides);
      setShowPolishPreview(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al pulir slides');
    }
  };

  const handleApplyPolish = () => {
    if (!onBulkUpdate || polishedSlides.length === 0) {
      // Single slide update fallback
      const polished = polishedSlides[0];
      if (polished) {
        const originalContent = slide.content as Record<string, unknown> || {};
        const newContent: Record<string, unknown> = { ...originalContent };
        if (polished.bullets) newContent.bullets = polished.bullets;
        if (polished.stats) newContent.stats = polished.stats;
        if (polished.bodyText) newContent.bodyText = polished.bodyText;
        if (polished.teamMembers) newContent.teamMembers = polished.teamMembers;
        if (polished.columns) newContent.columns = polished.columns;

        onUpdate({
          headline: polished.headline,
          subline: polished.subline ?? slide.subline,
          content: newContent,
        });
      }
    } else {
      // Bulk update for all slides
      const updates = polishedSlides.map((polished) => {
        const original = allSlides[polished.slide_index];
        if (!original) return null;

        const originalContent = original.content as Record<string, unknown> || {};
        const newContent: Record<string, unknown> = { ...originalContent };
        if (polished.bullets) newContent.bullets = polished.bullets;
        if (polished.stats) newContent.stats = polished.stats;
        if (polished.bodyText) newContent.bodyText = polished.bodyText;
        if (polished.teamMembers) newContent.teamMembers = polished.teamMembers;
        if (polished.columns) newContent.columns = polished.columns;

        return {
          slideId: original.id,
          updates: {
            headline: polished.headline,
            subline: polished.subline ?? original.subline,
            content: newContent,
          }
        };
      }).filter(Boolean) as { slideId: string; updates: Partial<PresentationSlide> }[];

      onBulkUpdate(updates);
    }
    
    setShowPolishPreview(false);
    toast.success('Cambios editoriales aplicados');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="style">Estilo</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Layout selector */}
          <div className="space-y-2">
            <Label>Diseño</Label>
            <Select value={slide.layout} onValueChange={handleLayoutChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUTS.map((layout) => (
                  <SelectItem key={layout.value} value={layout.value}>
                    <div className="flex items-center gap-2">
                      <layout.icon className="h-4 w-4" />
                      {layout.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={localHeadline}
              onChange={(e) => setLocalHeadline(e.target.value)}
              onBlur={handleHeadlineBlur}
              placeholder="Título del slide"
            />
          </div>

          {/* Subline */}
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input
              value={localSubline}
              onChange={(e) => setLocalSubline(e.target.value)}
              onBlur={handleSublineBlur}
              placeholder="Subtítulo opcional"
            />
          </div>

          {/* Layout-specific content editors */}
          <LayoutContentEditor
            layout={slide.layout}
            content={localContent}
            onUpdate={handleContentUpdate}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas del presentador</Label>
            <Textarea
              value={slide.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Notas visibles solo para el presentador..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="style" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Background color */}
          <div className="space-y-2">
            <Label>Color de fondo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={slide.background_color || '#ffffff'}
                onChange={(e) => onUpdate({ background_color: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={slide.background_color || ''}
                onChange={(e) => onUpdate({ background_color: e.target.value })}
                placeholder="#ffffff"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ background_color: null })}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Text color */}
          <div className="space-y-2">
            <Label>Color de texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={slide.text_color || '#000000'}
                onChange={(e) => onUpdate({ text_color: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={slide.text_color || ''}
                onChange={(e) => onUpdate({ text_color: e.target.value })}
                placeholder="#000000"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ text_color: null })}
              >
              Reset
            </Button>
          </div>
        </div>

        {/* Polish AI Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handlePolishSlides}
            disabled={polishMutation.isPending}
          >
            {polishMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {allSlides.length > 1 ? 'Pulir Todos los Slides con IA' : 'Pulir con IA'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Mejora claridad, elimina lenguaje de marketing
          </p>
        </div>
      </TabsContent>
    </Tabs>

    <PolishPreview
      open={showPolishPreview}
      onOpenChange={setShowPolishPreview}
      originalSlides={allSlides.length > 0 ? allSlides : [slide]}
      polishedSlides={polishedSlides}
      onApply={handleApplyPolish}
      isApplying={false}
    />
  </div>
);
}

function LayoutContentEditor({
  layout,
  content,
  onUpdate,
}: {
  layout: SlideLayout;
  content: SlideContent;
  onUpdate: (updates: Partial<SlideContent>) => void;
}) {
  switch (layout) {
    case 'bullets':
    case 'overview':
    case 'market':
    case 'financials':
      return <BulletsEditor content={content} onUpdate={onUpdate} />;
    case 'stats':
      return <StatsEditor content={content} onUpdate={onUpdate} />;
    case 'team':
      return <TeamEditor content={content} onUpdate={onUpdate} />;
    case 'comparison':
      return <ComparisonEditor content={content} onUpdate={onUpdate} />;
    case 'closing':
    case 'disclaimer':
      return <BodyTextEditor content={content} onUpdate={onUpdate} />;
    default:
      return null;
  }
}

function BulletsEditor({ content, onUpdate }: { content: SlideContent; onUpdate: (u: Partial<SlideContent>) => void }) {
  const bullets = content.bullets || [];

  const addBullet = () => {
    onUpdate({ bullets: [...bullets, ''] });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    onUpdate({ bullets: newBullets });
  };

  const removeBullet = (index: number) => {
    onUpdate({ bullets: bullets.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Puntos</Label>
        <Button variant="ghost" size="sm" onClick={addBullet}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>
      <div className="space-y-2">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={bullet}
              onChange={(e) => updateBullet(i, e.target.value)}
              placeholder={`Punto ${i + 1}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeBullet(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsEditor({ content, onUpdate }: { content: SlideContent; onUpdate: (u: Partial<SlideContent>) => void }) {
  const stats = content.stats || [];

  const addStat = () => {
    onUpdate({ stats: [...stats, { value: '', label: '' }] });
  };

  const updateStat = (index: number, field: string, value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [field]: value };
    onUpdate({ stats: newStats });
  };

  const removeStat = (index: number) => {
    onUpdate({ stats: stats.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Estadísticas</Label>
        <Button variant="ghost" size="sm" onClick={addStat}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>
      <div className="space-y-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2">
            <div className="flex gap-2">
              <Input
                value={stat.prefix || ''}
                onChange={(e) => updateStat(i, 'prefix', e.target.value)}
                placeholder="€"
                className="w-16"
              />
              <Input
                value={stat.value}
                onChange={(e) => updateStat(i, 'value', e.target.value)}
                placeholder="100"
                className="flex-1"
              />
              <Input
                value={stat.suffix || ''}
                onChange={(e) => updateStat(i, 'suffix', e.target.value)}
                placeholder="M"
                className="w-16"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStat(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={stat.label}
              onChange={(e) => updateStat(i, 'label', e.target.value)}
              placeholder="Etiqueta"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamEditor({ content, onUpdate }: { content: SlideContent; onUpdate: (u: Partial<SlideContent>) => void }) {
  const members = content.teamMembers || [];

  const addMember = () => {
    onUpdate({ teamMembers: [...members, { name: '', role: '' }] });
  };

  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    onUpdate({ teamMembers: newMembers });
  };

  const removeMember = (index: number) => {
    onUpdate({ teamMembers: members.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Miembros del equipo</Label>
        <Button variant="ghost" size="sm" onClick={addMember}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>
      <div className="space-y-3">
        {members.map((member, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={member.name}
              onChange={(e) => updateMember(i, 'name', e.target.value)}
              placeholder="Nombre"
              className="flex-1"
            />
            <Input
              value={member.role}
              onChange={(e) => updateMember(i, 'role', e.target.value)}
              placeholder="Cargo"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeMember(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonEditor({ content, onUpdate }: { content: SlideContent; onUpdate: (u: Partial<SlideContent>) => void }) {
  const columns = content.columns || [{ title: '', items: [] }, { title: '', items: [] }];

  const updateColumn = (index: number, field: string, value: string | string[]) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    onUpdate({ columns: newColumns });
  };

  return (
    <div className="space-y-4">
      <Label>Columnas comparativas</Label>
      <div className="grid grid-cols-2 gap-4">
        {columns.slice(0, 2).map((column, i) => (
          <div key={i} className="space-y-2">
            <Input
              value={column.title}
              onChange={(e) => updateColumn(i, 'title', e.target.value)}
              placeholder={`Título columna ${i + 1}`}
            />
            <Textarea
              value={column.items.join('\n')}
              onChange={(e) => updateColumn(i, 'items', e.target.value.split('\n'))}
              placeholder="Un item por línea"
              rows={4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function BodyTextEditor({ content, onUpdate }: { content: SlideContent; onUpdate: (u: Partial<SlideContent>) => void }) {
  return (
    <div className="space-y-2">
      <Label>Texto</Label>
      <Textarea
        value={content.bodyText || ''}
        onChange={(e) => onUpdate({ bodyText: e.target.value })}
        placeholder="Contenido del slide..."
        rows={6}
      />
    </div>
  );
}

export default SlideEditor;
