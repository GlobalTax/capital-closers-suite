// ============================================
// DATA ROOM ACCESS PAGE
// Página pública para acceso externo al Data Room
// ============================================

import { useParams } from "react-router-dom";
import { useDataRoomAccess } from "@/hooks/useDataRoomAccess";
import { DataRoomHeader } from "@/components/dataroom/DataRoomHeader";
import { DataRoomDocumentList } from "@/components/dataroom/DataRoomDocumentList";
import { AccessDeniedCard } from "@/components/dataroom/AccessDeniedCard";
import { Loader2 } from "lucide-react";

export default function DataRoomAccess() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const {
    isLoading,
    isValid,
    hasAccess,
    recipient,
    project,
    documents,
    accessDeniedReason,
    ndaStatus,
    revokeReason,
    downloadingId,
    openDocument,
    triggerDownload,
    refresh,
  } = useDataRoomAccess(trackingId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <DataRoomHeader 
          project={project}
          recipient={recipient}
          hasAccess={hasAccess}
        />

        {/* Main content */}
        <div className="mt-8">
          {hasAccess ? (
            <DataRoomDocumentList
              documents={documents}
              downloadingId={downloadingId}
              onOpen={openDocument}
              onDownload={triggerDownload}
              onRefresh={refresh}
            />
          ) : (
            <AccessDeniedCard
              reason={accessDeniedReason}
              ndaStatus={ndaStatus}
              revokeReason={revokeReason}
              recipientName={recipient?.nombre}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Confidencial · Capittal Partners © {new Date().getFullYear()}</p>
          <p className="mt-1">
            ¿Preguntas? Contacta con{" "}
            <a href="mailto:deals@capittal.es" className="text-primary hover:underline">
              deals@capittal.es
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
