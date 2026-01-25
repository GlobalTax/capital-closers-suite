import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HelpSection } from '@/types/help';

interface HelpNavigationProps {
  currentSlug: string;
  sections: HelpSection[];
}

export function HelpNavigation({ currentSlug, sections }: HelpNavigationProps) {
  const currentIndex = sections.findIndex(s => s.slug === currentSlug);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  if (!prevSection && !nextSection) return null;

  return (
    <div className="flex items-center justify-between mt-12 pt-6 border-t">
      {prevSection ? (
        <Button variant="ghost" asChild className="gap-2">
          <Link to={`/ayuda/${prevSection.slug}`}>
            <ChevronLeft className="h-4 w-4" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Anterior</div>
              <div className="font-medium">{prevSection.title}</div>
            </div>
          </Link>
        </Button>
      ) : (
        <div />
      )}
      
      {nextSection && (
        <Button variant="ghost" asChild className="gap-2">
          <Link to={`/ayuda/${nextSection.slug}`}>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Siguiente</div>
              <div className="font-medium">{nextSection.title}</div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
