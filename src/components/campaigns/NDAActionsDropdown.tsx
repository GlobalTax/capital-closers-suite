// ============================================
// NDA ACTIONS DROPDOWN
// Menú de acciones NDA para candidatos
// ============================================

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { 
  MoreHorizontal, 
  Send, 
  CheckCircle2, 
  Unlock, 
  Lock,
  FileText,
  History,
  RefreshCw,
  Link,
  ExternalLink
} from "lucide-react";
import type { NDARecipient } from "@/services/ndaWorkflow.service";
import { isEligibleForNDA, canAccessCIM, copyDataRoomLink, getDataRoomUrl } from "@/services/ndaWorkflow.service";
import { toast } from "sonner";

interface NDAActionsDropdownProps {
  recipient: NDARecipient;
  onSendNDA: (language: "ES" | "EN") => void;
  onMarkSigned: () => void;
  onGrantCIMAccess: () => void;
  onRevokeCIMAccess: () => void;
  onViewHistory: () => void;
  isLoading?: boolean;
}

export function NDAActionsDropdown({
  recipient,
  onSendNDA,
  onMarkSigned,
  onGrantCIMAccess,
  onRevokeCIMAccess,
  onViewHistory,
  isLoading = false,
}: NDAActionsDropdownProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const eligible = isEligibleForNDA(recipient);
  const hasCIMAccess = canAccessCIM(recipient);
  const ndaAlreadySent = ["sent", "signed"].includes(recipient.nda_status);
  const ndaSigned = recipient.nda_status === "signed";

  const handleSendNDA = (language: "ES" | "EN") => {
    if (ndaAlreadySent && recipient.nda_status === "sent") {
      setConfirmDialog({
        open: true,
        title: "Reenviar NDA",
        description: `¿Deseas reenviar el NDA en ${language === "ES" ? "español" : "inglés"} a ${recipient.email}?`,
        action: () => onSendNDA(language),
      });
    } else {
      onSendNDA(language);
    }
  };

  const handleMarkSigned = () => {
    setConfirmDialog({
      open: true,
      title: "Marcar NDA como firmado",
      description: `¿Confirmas que ${recipient.nombre || recipient.email} ha firmado el NDA?`,
      action: onMarkSigned,
    });
  };

  const handleGrantAccess = () => {
    setConfirmDialog({
      open: true,
      title: "Conceder acceso CIM",
      description: `¿Deseas conceder acceso al CIM/Data Room a ${recipient.nombre || recipient.email} sin NDA firmado?`,
      action: onGrantCIMAccess,
    });
  };

  const handleRevokeAccess = () => {
    setConfirmDialog({
      open: true,
      title: "Revocar acceso CIM",
      description: `¿Deseas revocar el acceso al CIM/Data Room de ${recipient.nombre || recipient.email}?`,
      action: onRevokeCIMAccess,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Acciones NDA</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Send NDA options */}
          {!ndaSigned && (
            <>
              <DropdownMenuItem 
                onClick={() => handleSendNDA("ES")}
                disabled={!eligible && !ndaAlreadySent}
              >
                <Send className="mr-2 h-4 w-4" />
                {ndaAlreadySent ? "Reenviar NDA (ES)" : "Enviar NDA (ES)"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSendNDA("EN")}
                disabled={!eligible && !ndaAlreadySent}
              >
                <Send className="mr-2 h-4 w-4" />
                {ndaAlreadySent ? "Reenviar NDA (EN)" : "Enviar NDA (EN)"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Mark as signed */}
          {recipient.nda_status === "sent" && (
            <DropdownMenuItem onClick={handleMarkSigned}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Marcar NDA como firmado
            </DropdownMenuItem>
          )}

          {/* CIM Access control */}
          {!hasCIMAccess && !ndaSigned && (
            <DropdownMenuItem onClick={handleGrantAccess}>
              <Unlock className="mr-2 h-4 w-4" />
              Conceder acceso CIM (override)
            </DropdownMenuItem>
          )}

          {hasCIMAccess && recipient.cim_access_granted && !ndaSigned && (
            <DropdownMenuItem onClick={handleRevokeAccess}>
              <Lock className="mr-2 h-4 w-4 text-destructive" />
              Revocar acceso CIM
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Data Room link actions */}
          {hasCIMAccess && recipient.tracking_id && (
            <>
              <DropdownMenuItem onClick={async () => {
                const success = await copyDataRoomLink(recipient.tracking_id!);
                if (success) {
                  toast.success("Link copiado al portapapeles");
                } else {
                  toast.error("Error al copiar el link");
                }
              }}>
                <Link className="mr-2 h-4 w-4" />
                Copiar link Data Room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                window.open(getDataRoomUrl(recipient.tracking_id!), "_blank");
              }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Data Room
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* View history */}
          <DropdownMenuItem onClick={onViewHistory}>
            <History className="mr-2 h-4 w-4" />
            Ver historial de actividad
          </DropdownMenuItem>

          {/* Show eligibility info */}
          {!eligible && !ndaAlreadySent && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                <FileText className="inline h-3 w-3 mr-1" />
                NDA requiere engagement previo (apertura o click)
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog?.action();
                setConfirmDialog(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Quick action button for eligible recipients
export function SendNDAButton({ 
  recipient, 
  onSendNDA,
  isLoading = false 
}: { 
  recipient: NDARecipient;
  onSendNDA: (language: "ES" | "EN") => void;
  isLoading?: boolean;
}) {
  const eligible = isEligibleForNDA(recipient);
  const ndaStatus = recipient.nda_status;

  if (ndaStatus === "signed") {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        Firmado
      </Button>
    );
  }

  if (ndaStatus === "sent") {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onSendNDA(recipient.nda_language || "ES")}
        disabled={isLoading}
        className="gap-1"
      >
        <RefreshCw className="h-3 w-3" />
        Reenviar
      </Button>
    );
  }

  if (ndaStatus === "pending" || eligible) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={isLoading} className="gap-1">
            <Send className="h-3 w-3" />
            Enviar NDA
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onSendNDA("ES")}>
            🇪🇸 Español
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSendNDA("EN")}>
            🇬🇧 English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled className="gap-1 text-muted-foreground">
      <Send className="h-3 w-3" />
      Requiere engagement
    </Button>
  );
}
