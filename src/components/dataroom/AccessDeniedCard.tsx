// ============================================
// ACCESS DENIED CARD
// Card para mostrar cuando el acceso está bloqueado
// ============================================

import { 
  Lock, 
  FileQuestion, 
  AlertTriangle, 
  Clock, 
  FileSignature,
  XCircle,
  Mail
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AccessDeniedReason } from "@/hooks/useDataRoomAccess";

interface AccessDeniedCardProps {
  reason?: AccessDeniedReason;
  ndaStatus?: string;
  revokeReason?: string;
  recipientName?: string | null;
}

function getStatusConfig(reason: AccessDeniedReason | undefined, ndaStatus?: string) {
  switch (reason) {
    case "invalid_token":
      return {
        icon: FileQuestion,
        iconColor: "text-muted-foreground",
        title: "Enlace no válido",
        description: "El enlace que has utilizado no es válido o ha expirado. Por favor, contacta con el equipo para obtener un nuevo enlace de acceso.",
        showContact: true,
      };
      
    case "nda_not_signed":
      return {
        icon: FileSignature,
        iconColor: "text-amber-500",
        title: "Firma del NDA requerida",
        description: getNDADescription(ndaStatus),
        showContact: true,
        showNDAStatus: true,
      };
      
    case "access_revoked":
      return {
        icon: XCircle,
        iconColor: "text-destructive",
        title: "Acceso revocado",
        description: "Tu acceso al Data Room ha sido revocado. Si crees que esto es un error, por favor contacta con el equipo.",
        showContact: true,
      };
      
    case "project_not_found":
      return {
        icon: AlertTriangle,
        iconColor: "text-amber-500",
        title: "Proyecto no encontrado",
        description: "El proyecto asociado a este enlace no está disponible. Por favor, contacta con el equipo.",
        showContact: true,
      };
      
    default:
      return {
        icon: Lock,
        iconColor: "text-muted-foreground",
        title: "Acceso restringido",
        description: "No tienes acceso al Data Room en este momento.",
        showContact: true,
      };
  }
}

function getNDADescription(ndaStatus?: string): string {
  switch (ndaStatus) {
    case "not_required":
      return "Para acceder a la documentación del proyecto, es necesario firmar el Acuerdo de Confidencialidad (NDA). Un miembro de nuestro equipo te contactará para enviarte el documento.";
    case "pending":
      return "Hemos detectado tu interés en este proyecto. Un miembro de nuestro equipo te contactará en breve para enviarte el Acuerdo de Confidencialidad (NDA).";
    case "sent":
      return "Te hemos enviado el Acuerdo de Confidencialidad (NDA). Por favor, fírmalo y devuélvelo para obtener acceso al Data Room.";
    case "expired":
      return "El NDA que te enviamos ha expirado. Por favor, contacta con el equipo para solicitar un nuevo documento.";
    case "rejected":
      return "El NDA fue rechazado. Por favor, contacta con el equipo si deseas resolver cualquier duda.";
    default:
      return "Para acceder a la documentación del proyecto, es necesario firmar el Acuerdo de Confidencialidad (NDA).";
  }
}

function getNDAStatusBadge(ndaStatus?: string) {
  switch (ndaStatus) {
    case "pending":
      return { label: "NDA Pendiente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" };
    case "sent":
      return { label: "NDA Enviado - Pendiente firma", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    case "expired":
      return { label: "NDA Expirado", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
    case "rejected":
      return { label: "NDA Rechazado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    default:
      return { label: "NDA Requerido", color: "bg-muted text-muted-foreground" };
  }
}

export function AccessDeniedCard({
  reason,
  ndaStatus,
  revokeReason,
  recipientName,
}: AccessDeniedCardProps) {
  const config = getStatusConfig(reason, ndaStatus);
  const Icon = config.icon;
  const statusBadge = config.showNDAStatus ? getNDAStatusBadge(ndaStatus) : null;

  return (
    <Card className="border-2">
      <CardContent className="py-12">
        <div className="text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted`}>
              <Icon className={`h-10 w-10 ${config.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3">{config.title}</h2>

          {/* Greeting if we have name */}
          {recipientName && (
            <p className="text-muted-foreground mb-4">
              Hola, {recipientName}
            </p>
          )}

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {config.description}
          </p>

          {/* Revoke reason if applicable */}
          {reason === "access_revoked" && revokeReason && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-sm">
              <p className="font-medium text-destructive mb-1">Motivo:</p>
              <p className="text-muted-foreground">{revokeReason}</p>
            </div>
          )}

          {/* NDA Status badge */}
          {statusBadge && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          )}

          {/* Contact info */}
          {config.showContact && (
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Preguntas? Contacta con nuestro equipo:
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:deals@capittal.es">
                  <Mail className="h-4 w-4 mr-2" />
                  deals@capittal.es
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
