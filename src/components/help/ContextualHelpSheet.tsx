import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader2, BookOpen } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useHelpSection } from '@/hooks/useHelpCenter';

interface ContextualHelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
}

export function ContextualHelpSheet({ open, onOpenChange, slug }: ContextualHelpSheetProps) {
  const navigate = useNavigate();
  const { data: section, isLoading, error } = useHelpSection(slug);

  const handleViewFullManual = () => {
    onOpenChange(false);
    navigate(`/ayuda/${slug}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <SheetTitle className="text-left">
              {isLoading ? 'Cargando...' : section?.title || 'Ayuda'}
            </SheetTitle>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No se pudo cargar la ayuda</p>
                <Button
                  variant="link"
                  onClick={handleViewFullManual}
                  className="mt-2"
                >
                  Ir al manual completo
                </Button>
              </div>
            ) : section ? (
              <MarkdownRenderer content={section.content_md} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay contenido de ayuda disponible para esta sección</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t shrink-0">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleViewFullManual}
          >
            <ExternalLink className="h-4 w-4" />
            Ver manual completo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
