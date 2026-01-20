import { useState } from "react";
import { History, RotateCcw, Clock, User, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { usePresentationVersions, useRestoreVersion } from "@/hooks/usePresentationVersions";
import type { PresentationVersion, PresentationSlide } from "@/types/presentations";

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  currentSlides: PresentationSlide[];
}

export function VersionHistory({ open, onOpenChange, projectId, currentSlides }: VersionHistoryProps) {
  const [confirmRestore, setConfirmRestore] = useState<PresentationVersion | null>(null);
  
  const { data: versions = [], isLoading } = usePresentationVersions(projectId);
  const restoreMutation = useRestoreVersion();

  const handleRestore = async () => {
    if (!confirmRestore || !projectId) return;
    
    await restoreMutation.mutateAsync({ 
      version: confirmRestore, 
      projectId 
    });
    setConfirmRestore(null);
    onOpenChange(false);
  };

  const getVersionSlideCount = (version: PresentationVersion): number => {
    const snapshot = version.snapshot as { slides?: unknown[] } | null;
    return snapshot?.slides?.length || 0;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Versiones
            </SheetTitle>
            <SheetDescription>
              Versiones guardadas de esta presentación. Puedes restaurar cualquier versión anterior.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {/* Current version info */}
            <div className="p-3 rounded-lg border-2 border-primary/20 bg-primary/5 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Actual</Badge>
                  <span className="text-sm font-medium">{currentSlides.length} slides</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Sin guardar
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay versiones guardadas</p>
                <p className="text-xs mt-1">
                  Las versiones se crean al regenerar slides protegidos
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-3">
                  {versions.map((version) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      slideCount={getVersionSlideCount(version)}
                      onRestore={() => setConfirmRestore(version)}
                      isRestoring={restoreMutation.isPending}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar versión {confirmRestore?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reemplazará todos los slides actuales con los de la versión seleccionada.
              Los cambios no guardados se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface VersionCardProps {
  version: PresentationVersion;
  slideCount: number;
  onRestore: () => void;
  isRestoring: boolean;
}

function VersionCard({ version, slideCount, onRestore, isRestoring }: VersionCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">v{version.version_number}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {slideCount} slides
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(version.created_at), "d MMM yyyy HH:mm", { locale: es })}
            </span>
          </div>

          {version.notes && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              "{version.notes}"
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRestore}
          disabled={isRestoring}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Restaurar
        </Button>
      </div>
    </div>
  );
}
