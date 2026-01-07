import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RechazarPropuestaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
}

export function RechazarPropuestaDialog({
  open,
  onOpenChange,
  onConfirm,
}: RechazarPropuestaDialogProps) {
  const [motivo, setMotivo] = useState("");

  const handleConfirm = () => {
    onConfirm(motivo);
    setMotivo("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rechazar propuesta</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de marcar esta propuesta como rechazada? Puedes indicar el motivo del rechazo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="motivo">Motivo del rechazo (opcional)</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Precio fuera de presupuesto, cambio de prioridades..."
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirmar rechazo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
