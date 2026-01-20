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
  ClipboardCheck,
  Lock,
  Unlock,
  CheckCircle,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePolishSlides, applyPolishedContent } from "@/hooks/usePolishSlides";
import { useValidatePresentation, ValidationReport as ValidationReportType } from "@/hooks/useValidatePresentation";
import { useApproveSlide, useUnlockSlide, isSlideProtected } from "@/hooks/usePresentationVersions";
import { PolishPreview } from "./PolishPreview";
import { ValidationReport } from "./ValidationReport";
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
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReportType | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

  const polishMutation = usePolishSlides();
  const validateMutation = useValidatePresentation();
  const approveMutation = useApproveSlide();
  const unlockMutation = useUnlockSlide();

  const isProtected = isSlideProtected(slide);
  const isApproved = slide.approval_status === 'approved';

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

  const handleValidatePresentation = async () => {
    const slidesToValidate = allSlides.length > 0 ? allSlides : [slide];
    
    try {
      const result = await validateMutation.mutateAsync({ slides: slidesToValidate });
      setValidationReport(result);
      setShowValidationReport(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al validar presentación');
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

  const handleApproveSlide = async () => {
    await approveMutation.mutateAsync({ slideId: slide.id, projectId: slide.project_id });
  };

  const handleUnlockSlide = async () => {
    await unlockMutation.mutateAsync({ slideId: slide.id, projectId: slide.project_id });
    setShowUnlockConfirm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Approval Status Banner */}
      {isProtected && (
        <div className={`px-4 py-2 flex items-center justify-between ${
          isApproved 
            ? 'bg-green-50 border-b border-green-200 dark:bg-green-950/30 dark:border-green-900' 
            : 'bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            {isApproved ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Slide aprobado
                </span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Slide bloqueado
                </span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowUnlockConfirm(true)}
          >
            <Unlock className="h-3 w-3 mr-1" />
            Desbloquear
          </Button>
        </div>
      )}

      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="style">Estilo</TabsTrigger>
          <TabsTrigger value="approval">Aprobación</TabsTrigger>
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
        <div className="pt-4 border-t space-y-3">
          <div>
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
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Mejora claridad, elimina lenguaje de marketing
            </p>
          </div>

          {/* Validate Button */}
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleValidatePresentation}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4 mr-2" />
              )}
              {allSlides.length > 1 ? 'Validar Presentación' : 'Validar Slide'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Verifica cumplimiento y detecta riesgos
            </p>
          </div>
        </div>
        </TabsContent>

        {/* Approval Tab */}
        <TabsContent value="approval" className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Estado de Aprobación</h3>
              <p className="text-sm text-muted-foreground">
                Los slides aprobados no se modificarán al regenerar la presentación con IA.
              </p>
            </div>

            {/* Current status */}
            <div className={`p-4 rounded-lg border ${
              isApproved 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                : isProtected
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                  : 'bg-muted/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isApproved ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : isProtected ? (
                  <Lock className="h-5 w-5 text-amber-600" />
                ) : (
                  <Shield className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {isApproved ? 'Aprobado' : isProtected ? 'Bloqueado' : 'Pendiente de revisión'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isApproved 
                  ? 'Este slide está aprobado y protegido. No se modificará al regenerar.'
                  : isProtected
                    ? 'Este slide está bloqueado manualmente. No se modificará al regenerar.'
                    : 'Este slide puede ser modificado al regenerar con IA.'}
              </p>
            </div>

            {/* Actions */}
            <Separator />

            {isProtected ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowUnlockConfirm(true)}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Desbloquear para edición
              </Button>
            ) : (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleApproveSlide}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprobar y proteger slide
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              {isProtected 
                ? 'Al desbloquear, el slide volverá a ser editable y podrá ser regenerado.'
                : 'Al aprobar, el contenido quedará protegido durante regeneraciones futuras.'}
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

    <ValidationReport
      open={showValidationReport}
      onOpenChange={setShowValidationReport}
      report={validationReport}
      slides={allSlides.length > 0 ? allSlides : [slide]}
    />

    {/* Unlock Confirmation Dialog */}
    <AlertDialog open={showUnlockConfirm} onOpenChange={setShowUnlockConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desbloquear este slide?</AlertDialogTitle>
          <AlertDialogDescription>
            Al desbloquear, el slide volverá a ser editable y podrá ser modificado 
            al regenerar la presentación con IA. El contenido actual se mantendrá, 
            pero perderá la protección.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUnlockSlide}
            disabled={unlockMutation.isPending}
          >
            {unlockMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Unlock className="h-4 w-4 mr-2" />
            )}
            Desbloquear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
