import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TVHeaderProps {
  onRefresh: () => void;
  lastUpdate?: Date;
}

export function TVHeader({ onRefresh, lastUpdate }: TVHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `Actualizado hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `Actualizado hace ${minutes}m`;
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-border shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-medium text-primary">
              Capittal CRM
            </h1>
            <span className="text-xl text-muted-foreground">
              Dashboard Comercial
            </span>
          </div>

          {/* Fecha y hora central */}
          <div className="text-center">
            <div className="text-2xl font-medium text-foreground">
              {format(currentTime, "HH:mm:ss")}
            </div>
            <div className="text-base text-muted-foreground">
              {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            {/* Indicador de última actualización */}
            <span className="text-sm text-muted-foreground">
              {getTimeSinceUpdate()}
            </span>

            {/* Botón refresh */}
            <Button
              onClick={onRefresh}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Actualizar
            </Button>

            {/* Toggle fullscreen */}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-5 h-5" />
                  Salir
                </>
              ) : (
                <>
                  <Maximize2 className="w-5 h-5" />
                  Pantalla Completa
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
