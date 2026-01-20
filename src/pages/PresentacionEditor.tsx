import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Share2, 
  Settings,
  Monitor,
  Smartphone,
  FileText,
  Save,
  MoreHorizontal,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SlideList } from "@/features/presentations/components/SlideList";
import { SlideCanvas } from "@/features/presentations/components/SlideCanvas";
import { SlideEditor } from "@/features/presentations/components/SlideEditor";
import { ShareLinkManager } from "@/features/presentations/components/ShareLinkManager";
import { BrandKitEditor } from "@/features/presentations/components/BrandKitEditor";
import { 
  usePresentationProject, 
  usePresentationSlides,
  useUpdateProject,
  useUpdateSlide,
  useCreateSlide,
  useDeleteSlide,
  useDuplicateSlide,
  useReorderSlides,
} from "@/hooks/usePresentations";
import type { SlideLayout, PresentationSlide, BrandKit } from "@/types/presentations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PreviewMode = 'desktop' | 'mobile' | 'pdf';

export default function PresentacionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  const { data: project, isLoading: loadingProject } = usePresentationProject(id);
  const { data: slides = [], isLoading: loadingSlides } = usePresentationSlides(id);
  
  const updateProject = useUpdateProject();
  const updateSlide = useUpdateSlide();
  const createSlide = useCreateSlide();
  const deleteSlide = useDeleteSlide();
  const duplicateSlide = useDuplicateSlide();
  const reorderSlides = useReorderSlides();

  const handleSaveBrandKit = useCallback((kit: BrandKit) => {
    setBrandKit(kit);
    toast.success("Brand Kit guardado");
  }, []);

  // Select first slide if none selected
  const selectedSlide = useMemo(() => {
    if (selectedSlideId) {
      return slides.find(s => s.id === selectedSlideId);
    }
    if (slides.length > 0) {
      setSelectedSlideId(slides[0].id);
      return slides[0];
    }
    return null;
  }, [slides, selectedSlideId]);

  const handleTitleSave = useCallback(() => {
    if (project && titleValue.trim() && titleValue !== project.title) {
      updateProject.mutate({ id: project.id, updates: { title: titleValue.trim() } });
    }
    setIsEditingTitle(false);
  }, [project, titleValue, updateProject]);

  const handleSlideUpdate = useCallback((updates: Partial<PresentationSlide>) => {
    if (selectedSlide) {
      updateSlide.mutate({ id: selectedSlide.id, updates });
    }
  }, [selectedSlide, updateSlide]);

  const handleAddSlide = useCallback((layout: SlideLayout) => {
    if (!id) return;
    createSlide.mutate({
      project_id: id,
      order_index: slides.length,
      layout,
      headline: 'Nuevo slide',
      content: {},
      is_hidden: false,
      is_locked: false,
    });
  }, [id, slides.length, createSlide]);

  const handleDeleteSlide = useCallback((slideId: string) => {
    if (slides.length <= 1) return;
    deleteSlide.mutate({ id: slideId, projectId: id! });
    if (slideId === selectedSlideId) {
      const idx = slides.findIndex(s => s.id === slideId);
      const nextSlide = slides[idx + 1] || slides[idx - 1];
      if (nextSlide) setSelectedSlideId(nextSlide.id);
    }
  }, [slides, selectedSlideId, id, deleteSlide]);

  const handleDuplicateSlide = useCallback((slideId: string) => {
    duplicateSlide.mutate(slideId);
  }, [duplicateSlide]);

  const handleReorderSlides = useCallback((slideIds: string[]) => {
    if (id) {
      reorderSlides.mutate({ projectId: id, slideIds });
    }
  }, [id, reorderSlides]);

  const handleToggleVisibility = useCallback((slideId: string, hidden: boolean) => {
    updateSlide.mutate({ id: slideId, updates: { is_hidden: hidden } });
  }, [updateSlide]);

  const handleExportPDF = useCallback(() => {
    // Open presenter mode with print
    window.open(`/presentaciones/${id}/present?print=true`, '_blank');
  }, [id]);

  if (loadingProject || loadingSlides) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl mb-2">Presentación no encontrada</h2>
          <Button variant="ghost" onClick={() => navigate('/presentaciones')}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="h-14 border-b bg-background flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/presentaciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Title */}
        {isEditingTitle ? (
          <Input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="max-w-[300px] h-8"
            autoFocus
          />
        ) : (
          <button
            className="text-sm hover:bg-muted px-2 py-1 rounded transition-colors"
            onClick={() => {
              setTitleValue(project.title);
              setIsEditingTitle(true);
            }}
          >
            {project.title}
          </button>
        )}

        {/* Preview mode toggle */}
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as PreviewMode)} className="ml-auto">
          <TabsList className="h-8">
            <TabsTrigger value="desktop" className="h-6 px-2">
              <Monitor className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="mobile" className="h-6 px-2">
              <Smartphone className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="pdf" className="h-6 px-2">
              <FileText className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-px h-6 bg-border" />

        {/* Actions */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Compartir
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Compartir presentación</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ShareLinkManager projectId={project.id} />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={showBrandKit} onOpenChange={setShowBrandKit}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Palette className="h-4 w-4 mr-1" />
              Brand Kit
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] p-0">
            <BrandKitEditor brandKit={brandKit} onSave={handleSaveBrandKit} />
          </SheetContent>
        </Sheet>

        <Button variant="ghost" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>

        <Button size="sm" onClick={() => navigate(`/presentaciones/${id}/present`)}>
          <Play className="h-4 w-4 mr-1" />
          Presentar
        </Button>
      </header>

      {/* Main content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Slide list */}
        <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
          <div className="h-full border-r bg-background">
            <SlideList
              slides={slides}
              selectedSlideId={selectedSlideId}
              onSelectSlide={setSelectedSlideId}
              onReorder={handleReorderSlides}
              onDuplicate={handleDuplicateSlide}
              onDelete={handleDeleteSlide}
              onToggleVisibility={handleToggleVisibility}
              onAddSlide={handleAddSlide}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Preview */}
        <ResizablePanel defaultSize={52}>
          <div className="h-full flex items-center justify-center p-8 overflow-hidden">
            <div
              className={cn(
                "bg-background shadow-2xl rounded-lg overflow-hidden transition-all",
                previewMode === 'desktop' && "w-full max-w-5xl aspect-[16/9]",
                previewMode === 'mobile' && "w-[375px] aspect-[9/16]",
                previewMode === 'pdf' && "w-full max-w-3xl aspect-[297/210]", // A4 landscape
              )}
            >
              {selectedSlide && (
                <SlideCanvas slide={selectedSlide} brandKit={brandKit} />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Editor */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="h-full border-l bg-background overflow-hidden">
            {selectedSlide ? (
              <SlideEditor
                slide={selectedSlide}
                onUpdate={handleSlideUpdate}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Selecciona un slide para editar
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
