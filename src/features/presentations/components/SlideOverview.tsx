import { cn } from "@/lib/utils";
import type { PresentationSlide } from "@/types/presentations";

interface SlideOverviewProps {
  slides: PresentationSlide[];
  currentIndex: number;
  onSelectSlide: (index: number) => void;
  onClose: () => void;
}

export function SlideOverview({
  slides,
  currentIndex,
  onSelectSlide,
  onClose,
}: SlideOverviewProps) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-8"
      onClick={onClose}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl">Vista General</h2>
          <span className="text-muted-foreground">
            Click en un slide para ir a él, o fuera para cerrar
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {slides.filter(s => !s.is_hidden).map((slide, index) => (
            <button
              key={slide.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSlide(index);
              }}
              className={cn(
                "relative aspect-[16/9] bg-card border rounded-lg overflow-hidden transition-all",
                "hover:ring-2 hover:ring-primary hover:scale-105",
                index === currentIndex && "ring-2 ring-primary"
              )}
            >
              {/* Slide number */}
              <div className="absolute top-2 left-2 bg-background/80 rounded px-2 py-0.5 text-xs">
                {String(index + 1).padStart(2, '0')}
              </div>
              
              {/* Mini preview */}
              <div className="p-4 h-full flex flex-col justify-center">
                <div className="text-sm font-medium truncate">
                  {slide.headline || 'Sin título'}
                </div>
                {slide.subline && (
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {slide.subline}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground capitalize mt-2">
                  {slide.layout}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SlideOverview;
