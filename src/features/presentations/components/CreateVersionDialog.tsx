import { useState } from "react";
import { Save, Loader2, Lock, Unlock, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCreateVersion, isSlideProtected } from "@/hooks/usePresentationVersions";
import type { PresentationSlide } from "@/types/presentations";

interface CreateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  slides: PresentationSlide[];
  onVersionCreated?: () => void;
}

export function CreateVersionDialog({
  open,
  onOpenChange,
  projectId,
  slides,
  onVersionCreated,
}: CreateVersionDialogProps) {
  const [notes, setNotes] = useState("");
  const createVersion = useCreateVersion();

  const protectedSlides = slides.filter(isSlideProtected);
  const unprotectedSlides = slides.filter(s => !isSlideProtected(s));

  const handleCreate = async () => {
    if (!projectId) return;

    await createVersion.mutateAsync({
      projectId,
      slides,
      notes: notes.trim() || undefined,
    });

    setNotes("");
    onOpenChange(false);
    onVersionCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Guardar Nueva Versión
          </DialogTitle>
          <DialogDescription>
            Guarda el estado actual de la presentación antes de hacer cambios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-green-600" />
                <span>{protectedSlides.length} slides protegidos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No se modificarán al regenerar
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Unlock className="h-4 w-4 text-amber-600" />
                <span>{unprotectedSlides.length} slides editables</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Se actualizarán con nuevo contenido
              </p>
            </div>
          </div>

          {/* Protected slides preview */}
          {protectedSlides.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Slides protegidos:</Label>
              <div className="flex flex-wrap gap-1">
                {protectedSlides.map((slide, i) => (
                  <Badge key={slide.id} variant="secondary" className="text-xs">
                    {slide.order_index + 1}. {slide.headline?.slice(0, 20) || 'Sin título'}
                    {slide.headline && slide.headline.length > 20 && '...'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Notes input */}
          <div className="space-y-2">
            <Label htmlFor="version-notes">Notas (opcional)</Label>
            <Input
              id="version-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Antes de regenerar sección financiera..."
            />
            <p className="text-xs text-muted-foreground">
              Una descripción breve para identificar esta versión
            </p>
          </div>

          {protectedSlides.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  No hay slides protegidos
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  Aprueba slides importantes antes de regenerar para preservarlos.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={createVersion.isPending}>
            {createVersion.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Versión
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
