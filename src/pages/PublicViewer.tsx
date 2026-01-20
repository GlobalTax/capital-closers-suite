import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Download, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/features/presentations/components/SlideCanvas";
import { PresenterControls } from "@/features/presentations/components/PresenterControls";
import { SlideOverview } from "@/features/presentations/components/SlideOverview";
import { useValidateShareToken } from "@/hooks/usePresentations";

export default function PublicViewer() {
  const { token } = useParams<{ token: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(false);

  const { data, isLoading, error } = useValidateShareToken(token);

  const slides = data?.slides?.filter(s => !s.is_hidden) || [];
  const canDownload = data?.permission === 'download_pdf';

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

  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">
          Cargando presentación...
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (!data?.valid || error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl mb-2">Enlace no válido</h1>
          <p className="text-muted-foreground">
            Este enlace ha expirado, ha alcanzado el límite de visualizaciones,
            o no existe.
          </p>
        </div>
      </div>
    );
  }

  // No slides
  if (slides.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl mb-2">Presentación vacía</h2>
          <p className="text-muted-foreground">
            Esta presentación no tiene slides visibles.
          </p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {/* Confidential header */}
      {data.project?.is_confidential && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-amber-950 text-center py-1 text-xs">
          <Lock className="h-3 w-3 inline mr-1" />
          CONFIDENCIAL - Distribución restringida
        </div>
      )}

      {/* Current slide */}
      <div className="w-full h-full pt-6">
        <SlideCanvas slide={currentSlide} isPresenting />
      </div>

      {/* Controls */}
      <PresenterControls
        currentIndex={currentIndex}
        totalSlides={slides.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onGoToSlide={handleGoToSlide}
        onExit={() => {}}
        showOverview={showOverview}
        onToggleOverview={() => setShowOverview(prev => !prev)}
      />

      {/* Download button (if permitted) */}
      {canDownload && (
        <div className="fixed top-4 right-4 z-50">
          <Button size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            Descargar PDF
          </Button>
        </div>
      )}

      {/* Overview grid */}
      {showOverview && (
        <SlideOverview
          slides={slides}
          currentIndex={currentIndex}
          onSelectSlide={handleGoToSlide}
          onClose={() => setShowOverview(false)}
        />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
