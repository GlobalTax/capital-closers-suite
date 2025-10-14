import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReenviarCredencialesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ReenviarCredencialesDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  onConfirm,
  isLoading,
}: ReenviarCredencialesDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  const handleClose = () => {
    setConfirmed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Reenviar Credenciales
          </DialogTitle>
          <DialogDescription>
            Se generará una nueva contraseña temporal para {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Usuario:</strong> {userName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {userEmail}
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Se invalidará la contraseña anterior</li>
                <li>Deberás enviar manualmente la nueva contraseña al usuario</li>
                <li>El usuario deberá cambiarla en su primer login</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!confirmed && (
            <Alert className="border-primary/50 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Al confirmar, recibirás la nueva contraseña temporal que deberás copiar y enviar al usuario por un canal seguro.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || confirmed}
            variant="default"
          >
            {isLoading ? "Generando..." : "Confirmar Reenvío"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
