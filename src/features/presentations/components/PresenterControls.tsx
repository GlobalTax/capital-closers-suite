import { useEffect, useCallback, useState, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  Maximize, 
  Minimize,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PresenterControlsProps {
  currentIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
  onExit: () => void;
  showOverview?: boolean;
  onToggleOverview?: () => void;
}

export function PresenterControls({
  currentIndex,
  totalSlides,
  onPrevious,
  onNext,
  onGoToSlide,
  onExit,
  showOverview = false,
  onToggleOverview,
}: PresenterControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout>();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          onNext();
          break;
        case 'Escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            onExit();
          }
          break;
        case 'g':
          if (onToggleOverview) {
            e.preventDefault();
            onToggleOverview();
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, onExit, onToggleOverview]);

  // Touch/swipe navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const diff = touchStartX - touchEndX;
      const threshold = 50;

      if (diff > threshold) {
        onNext();
      } else if (diff < -threshold) {
        onPrevious();
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPrevious, onNext]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Fullscreen state tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return (
    <>
      {/* Progress indicator - always visible */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background/80 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg">
          <span className="text-sm tabular-nums">
            {String(currentIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls - auto-hide */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-1 shadow-lg flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={currentIndex === totalSlides - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {onToggleOverview && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleOverview}
              title="Vista general (G)"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title="Pantalla completa (F)"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            title="Salir (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Click areas for navigation */}
      <div
        className="fixed inset-y-0 left-0 w-1/4 cursor-pointer z-40"
        onClick={onPrevious}
      />
      <div
        className="fixed inset-y-0 right-0 w-1/4 cursor-pointer z-40"
        onClick={onNext}
      />
    </>
  );
}

export default PresenterControls;
