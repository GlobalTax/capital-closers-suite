import { useState, useEffect } from "react";
import { useTVDashboard } from "@/hooks/useTVDashboard";
import { TVHeader } from "@/components/dashboardTV/TVHeader";
import { TVMetrics } from "@/components/dashboardTV/TVMetrics";
import { TVKanbanBoard } from "@/components/dashboardTV/TVKanbanBoard";
import { Loader2 } from "lucide-react";

export default function DashboardTV() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Usar refresh más frecuente en fullscreen
  const refreshInterval = isFullscreen ? 30000 : 60000;
  const { data, isLoading, error, refetch } = useTVDashboard(refreshInterval);

  // Detectar cambios en fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Pausar refresh cuando tab está en background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab en background - pausar
      } else {
        // Tab activo - refetch
        refetch();
        setLastUpdate(new Date());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-bold text-destructive mb-4">
            Error al cargar el dashboard
          </p>
          <p className="text-muted-foreground mb-6">
            {error.message}
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TVHeader onRefresh={handleRefresh} lastUpdate={lastUpdate} />

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">Cargando dashboard...</p>
            </div>
          </div>
        ) : data ? (
          <>
            <TVMetrics data={data} />
            <div className="flex-1 min-h-0">
              <TVKanbanBoard data={data} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
