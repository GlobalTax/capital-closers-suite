import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Mail, Link as LinkIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface CredencialesResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  actionLink: string | null;
  emailSent: boolean;
}

export function CredencialesResultDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  temporaryPassword,
  actionLink,
  emailSent,
}: CredencialesResultDialogProps) {
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(temporaryPassword);
    setCopiedPassword(true);
    toast.success("Contraseña copiada al portapapeles");
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyLink = () => {
    if (actionLink) {
      navigator.clipboard.writeText(actionLink);
      setCopiedLink(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleMailTo = () => {
    const subject = encodeURIComponent("Acceso a Capittal");
    const body = encodeURIComponent(
      `Hola ${userName},\n\nSe han generado tus credenciales de acceso:\n\n` +
      `Email: ${userEmail}\n` +
      `Contraseña temporal: ${temporaryPassword}\n\n` +
      (actionLink ? `También puedes restablecer tu contraseña con este enlace:\n${actionLink}\n\n` : '') +
      `Accede aquí: https://capittal.es/auth/login\n\n` +
      `Por seguridad, deberás cambiar esta contraseña en tu primer acceso.\n\n` +
      `Saludos,\nEl equipo de Capittal`
    );
    window.open(`mailto:${userEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {emailSent ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            Credenciales Generadas
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? `Email enviado correctamente a ${userEmail}`
              : `El email no pudo ser enviado, pero las credenciales están disponibles`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!emailSent && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                El email no pudo ser entregado. Debes compartir las credenciales manualmente usando los botones de abajo.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Usuario:</strong> {userName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {userEmail}
            </p>
          </div>

          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <div>
              <p className="text-sm font-medium mb-2">Contraseña temporal:</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-background border rounded px-3 py-2 text-sm font-mono break-all">
                  {temporaryPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copiedPassword ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {actionLink && (
              <div>
                <p className="text-sm font-medium mb-2">Enlace de restablecimiento:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-background border rounded px-3 py-2 text-xs break-all">
                    {actionLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copiedLink ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <LinkIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyPassword}
              className="flex-1 gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar contraseña
            </Button>
            {actionLink && (
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Copiar enlace
              </Button>
            )}
          </div>

          <Button
            variant="default"
            onClick={handleMailTo}
            className="w-full gap-2"
          >
            <Mail className="h-4 w-4" />
            Abrir en cliente de email
          </Button>

          <Alert className="bg-primary/5 border-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              {actionLink 
                ? "Puedes compartir tanto la contraseña temporal como el enlace de restablecimiento. El usuario podrá usar cualquiera de los dos métodos."
                : "Comparte la contraseña temporal de forma segura. El usuario deberá cambiarla en su primer acceso."
              }
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
