import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { SlideCanvas } from "@/features/presentations/components/SlideCanvas";
import { PresenterControls } from "@/features/presentations/components/PresenterControls";
import { SlideOverview } from "@/features/presentations/components/SlideOverview";
import { usePresentationProject, usePresentationSlides } from "@/hooks/usePresentations";

export default function PresenterMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(false);

  const { data: project } = usePresentationProject(id);
  const { data: allSlides = [] } = usePresentationSlides(id);

  // Filter out hidden slides
  const slides = allSlides.filter(s => !s.is_hidden);

  // Handle print mode
  const isPrintMode = searchParams.get('print') === 'true';
  
  useEffect(() => {
    if (isPrintMode && slides.length > 0) {
      // Wait for render then print
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isPrintMode, slides.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);

  const handleGoToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setShowOverview(false);
  }, []);

  const handleExit = useCallback(() => {
    navigate(`/presentaciones/${id}/editor`);
  }, [navigate, id]);

  const handleToggleOverview = useCallback(() => {
    setShowOverview(prev => !prev);
  }, []);

  if (slides.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl mb-2">No hay slides para presentar</h2>
          <button
            onClick={handleExit}
            className="text-primary underline"
          >
            Volver al editor
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  // Print mode - show all slides for PDF export
  if (isPrintMode) {
    return (
      <div className="print-container">
        <style>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-slide {
              width: 297mm;
              height: 210mm;
              page-break-after: always;
              page-break-inside: avoid;
              overflow: hidden;
            }
            .print-slide:last-child {
              page-break-after: auto;
            }
          }
          @media screen {
            .print-slide {
              width: 100vw;
              height: 100vh;
              border-bottom: 1px solid #ccc;
            }
          }
        `}</style>
        {slides.map((slide, index) => (
          <div key={slide.id} className="print-slide">
            <SlideCanvas slide={slide} isPresenting />
            {/* Page number in footer */}
            <div className="absolute bottom-4 right-8 text-xs text-muted-foreground print:block">
              {index + 1} / {slides.length}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {/* Current slide */}
      <div className="w-full h-full">
        <SlideCanvas slide={currentSlide} isPresenting />
      </div>

      {/* Controls */}
      <PresenterControls
        currentIndex={currentIndex}
        totalSlides={slides.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onGoToSlide={handleGoToSlide}
        onExit={handleExit}
        showOverview={showOverview}
        onToggleOverview={handleToggleOverview}
      />

      {/* Overview grid */}
      {showOverview && (
        <SlideOverview
          slides={slides}
          currentIndex={currentIndex}
          onSelectSlide={handleGoToSlide}
          onClose={() => setShowOverview(false)}
        />
      )}
    </div>
  );
}
